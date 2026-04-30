/**
 * 学生进度相关API路由
 * POST /api/progress/verify - 验证答案，解锁下一关，触发成就
 * POST /api/progress/hint - AI生成提示
 * GET  /api/progress/solution/:taskId - 查看题解
 * POST /api/progress/favorite - 收藏/取消收藏
 * GET  /api/progress/favorites/:studentId - 收藏列表
 * GET  /api/progress/student/:studentId - 学生所有进度
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { socratesEngine } from '../ai/breakdown.js';
import { pool } from '../db.js';

export async function routes(fastify: FastifyInstance) {

  // ========== 验证学生答案，解锁下一关 ==========
  fastify.post<{
    Body: {
      task_id: number;
      student_id: number;
      level: number;
      answer: string;
      stay_seconds: number;
    };
  }>('/verify', async (request, reply) => {
    const { task_id, student_id, level, answer, stay_seconds } = request.body;

    // 获取题目
    const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [task_id]);
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return reply.status(404).send({ error: 'Task not found' });
    }
    const task = (tasks[0] as any);

    // 获取或创建进度
    const progressRows = await pool.query(
      'SELECT * FROM student_progress WHERE task_id = ? AND student_id = ?',
      [task_id, student_id]
    ) as any;

    let progress = progressRows[0];
    if (!progress) {
      const [insertResult] = await pool.query(
        'INSERT INTO student_progress (task_id, student_id, current_level, stay_log) VALUES (?, ?, 1, ?)',
        [task_id, student_id, JSON.stringify([])]
      );
      progress = {
        id: (insertResult as any).insertId,
        current_level: 1,
        total_time_seconds: 0,
        stay_log: [],
      };
    }

    // 调用AI验证答案
    let isCorrect = false;
    let feedback = '';
    let xpGained = 0;

    if (level === 3) {
      // L3: 编码实现 - AI校验代码
      const level1Model = typeof task.level_1_model === 'string'
        ? task.level_1_model
        : JSON.stringify(task.level_1_model || {});

      if (socratesEngine.isConfigured()) {
        try {
          const verification = await socratesEngine.verifyCode(answer, task.content, level1Model);
          isCorrect = verification.is_correct;
          feedback = verification.feedback;
        } catch (err) {
          fastify.log.error({ err }, 'AI code verification failed');
          isCorrect = false;
          feedback = '代码校验失败，请检查格式';
        }
      } else {
        isCorrect = answer.length > 20;
        feedback = isCorrect ? '代码看起来完整！' : '请输入完整的代码';
      }
    } else {
      // L1/L2: AI校验思路
      const levelData = level === 1
        ? (typeof task.level_1_model === 'string' ? task.level_1_model : JSON.stringify(task.level_1_model || ''))
        : JSON.stringify(task.level_2_pseudo || {});

      if (socratesEngine.isConfigured()) {
        try {
          const verification = await socratesEngine.verifyAnswer(answer, levelData);
          isCorrect = verification.is_correct;
          feedback = verification.feedback;
        } catch (err) {
          fastify.log.error({ err }, 'AI verification failed');
          isCorrect = false;
          feedback = 'AI验证暂时不可用，请稍后重试';
        }
      } else {
        isCorrect = false;
        feedback = 'AI服务未配置，无法验证答案';
      }
    }

    // 记录验证日志
    await pool.query(
      `INSERT INTO verification_logs (progress_id, task_id, student_id, level_attempted, student_answer, ai_feedback, is_correct, stay_seconds, attempt_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [progress.id, task_id, student_id, level, answer, feedback, isCorrect, stay_seconds]
    );

    // 正确：解锁下一关或完成
    if (isCorrect) {
      xpGained = level === 1 ? 5 : level === 2 ? 10 : 20;
      const stayLog = JSON.parse(progress.stay_log || '[]');
      stayLog.push({ level, seconds: stay_seconds });

      if (level < 3) {
        // 解锁下一关
        const newLevel = level + 1;
        await pool.query(
          'UPDATE student_progress SET current_level = ?, total_time_seconds = total_time_seconds + ?, stay_log = ?, updated_at = NOW() WHERE id = ?',
          [newLevel, stay_seconds, JSON.stringify(stayLog), progress.id]
        );

        let newAchievements: any[] = [];
        if (newLevel === 3) {
          // 完成全部三级，触发成就
          await pool.query(
            'UPDATE student_progress SET is_completed = TRUE, completed_at = NOW() WHERE id = ?',
            [progress.id]
          );
          newAchievements = await triggerAchievementCheck(student_id, task.difficulty_level, fastify);
        }

        return reply.send({
          is_correct: true,
          feedback,
          unlocked: true,
          next_level: newLevel,
          is_completed: newLevel === 3,
          xp_gained: xpGained,
          new_achievements: newAchievements,
        });
      } else {
        // L3 正确 - 完成
        await pool.query(
          `UPDATE student_progress SET is_completed = TRUE, completed_at = NOW(), current_level = 3,
           total_time_seconds = total_time_seconds + ?, stay_log = ?, updated_at = NOW() WHERE id = ?`,
          [stay_seconds, JSON.stringify(stayLog), progress.id]
        );

        const newAchievements = await triggerAchievementCheck(student_id, task.difficulty_level, fastify);

        return reply.send({
          is_correct: true,
          feedback,
          unlocked: true,
          next_level: 3,
          is_completed: true,
          xp_gained: xpGained,
          new_achievements: newAchievements,
        });
      }
    }

    // 错误
    return reply.send({
      is_correct: false,
      feedback: feedback || '回答不正确，请再想想',
      unlocked: false,
      is_completed: false,
      xp_gained: 0,
      new_achievements: [],
    });
  });

  // ========== AI生成提示 ==========
  fastify.post<{
    Body: { task_id: number; student_id: number; level: number };
  }>('/hint', async (request, reply) => {
    const { task_id, student_id, level } = request.body;

    const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [task_id]);
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return reply.status(404).send({ error: 'Task not found' });
    }
    const task = (tasks[0] as any);

    let hint = '';

    if (socratesEngine.isConfigured()) {
      try {
        // 统一解析 level_1_model
        let level1Model = task.level_1_model;
        if (typeof level1Model === 'string') {
          try { level1Model = JSON.parse(level1Model); } catch { level1Model = {}; }
        }
        const coreModel = typeof level1Model === 'object' ? (level1Model.core_model || '') : '';

        const result = await socratesEngine.generateHint(task.content, coreModel, `level${level}`);
        hint = result;
      } catch {
        hint = await getFallbackHint(task, level);
      }
    } else {
      hint = await getFallbackHint(task, level);
    }

    return reply.send({ hint: hint || '暂无提示' });
  });

  // ========== 查看题解 ==========
  fastify.get<{ Params: { taskId: string }; Querystring: { student_id?: number } }>(
    '/solution/:taskId',
    async (request, reply) => {
      const { taskId } = request.params;
      const { student_id } = request.query;

      const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
      if (!Array.isArray(tasks) || tasks.length === 0) {
        return reply.status(404).send({ error: 'Task not found' });
      }
      const task = (tasks[0] as any);

      if (!student_id) {
        return reply.status(400).send({ error: '请提供 student_id' });
      }

      // 检查是否完成
      const [progress] = await pool.query(
        'SELECT is_completed FROM student_progress WHERE student_id = ? AND task_id = ?',
        [student_id, taskId]
      );
      const prog = Array.isArray(progress) && progress[0] ? (progress[0] as any) : null;

      if (!prog?.is_completed) {
        return reply.status(403).send({ error: '请先完成题目三级拆解才能查看题解' });
      }

      // 用AI生成题解
      let solution = '';
      if (socratesEngine.isConfigured()) {
        try {
          let level1Model = task.level_1_model;
          if (typeof level1Model === 'string') {
            try { level1Model = JSON.parse(level1Model); } catch { level1Model = {}; }
          }
          const l2Pseudo = typeof task.level_2_pseudo === 'object'
            ? task.level_2_pseudo
            : JSON.parse(task.level_2_pseudo || '{}');

          solution = await socratesEngine.generateSolution(
            task.content,
            typeof level1Model === 'object' ? JSON.stringify(level1Model) : (level1Model || ''),
            JSON.stringify(l2Pseudo)
          );
        } catch {
          solution = '题解生成暂时不可用';
        }
      } else {
        solution = 'AI服务未配置，无法生成题解';
      }

      return reply.send({ solution });
    }
  );

  // ========== 收藏/取消收藏 ==========
  fastify.post<{
    Body: { student_id: number; task_id: number; action: 'favorite' | 'unfavorite' };
  }>('/favorite', async (request, reply) => {
    const { student_id, task_id, action } = request.body;

    if (action === 'favorite') {
      await pool.query(
        `INSERT IGNORE INTO student_progress (task_id, student_id, current_level, stay_log)
         VALUES (?, ?, 0, '[]')`,
        [task_id, student_id]
      );
      return reply.send({ success: true, favorited: true });
    } else {
      await pool.query(
        'DELETE FROM student_progress WHERE student_id = ? AND task_id = ? AND current_level = 0',
        [student_id, task_id]
      );
      return reply.send({ success: true, favorited: false });
    }
  });

  // ========== 收藏列表 ==========
  fastify.get<{ Params: { studentId: string } }>(
    '/favorites/:studentId',
    async (request, reply) => {
      const { studentId } = request.params;
      const [rows] = await pool.query(
        `SELECT p.task_id, p.created_at as favorited_at, t.title, t.difficulty_level, t.source
         FROM student_progress p
         JOIN tasks t ON t.id = p.task_id
         WHERE p.student_id = ? AND p.current_level = 0
         ORDER BY p.created_at DESC`,
        [studentId]
      );
      return reply.send({ favorites: rows });
    }
  );

  // ========== 学生所有进度 ==========
  fastify.get<{ Params: { studentId: string } }>(
    '/student/:studentId',
    async (request, reply) => {
      const { studentId } = request.params;
      const [rows] = await pool.query(
        `SELECT p.*, t.title as task_title, t.difficulty_level, t.source
         FROM student_progress p
         JOIN tasks t ON p.task_id = t.id
         WHERE p.student_id = ?
         ORDER BY p.updated_at DESC`,
        [studentId]
      );
      return reply.send({ progress: rows });
    }
  );
}

// ========== 触发成就检查 ==========
// 返回新解锁的成就列表
async function triggerAchievementCheck(
  studentId: number,
  taskDifficulty: number,
  fastify: FastifyInstance
): Promise<any[]> {
  try {
    // 确保 student_xp 记录存在
    await pool.query(
      `INSERT IGNORE INTO student_xp (student_id, total_xp, level) VALUES (?, 0, 1)`,
      [studentId]
    );

    // 统计完成题目数
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as cnt FROM student_progress WHERE student_id = ? AND is_completed = TRUE',
      [studentId]
    );
    const completedCount = (countResult as any)[0]?.cnt || 0;

    // 增加XP（每完成一题+10）
    await pool.query(
      'UPDATE student_xp SET total_xp = total_xp + 10 WHERE student_id = ?',
      [studentId]
    );

    // 检查等级提升
    const [xpRow] = await pool.query(
      'SELECT total_xp, level FROM student_xp WHERE student_id = ?',
      [studentId]
    );
    const row = (xpRow as any)[0];
    if (row) {
      const newLevel = Math.floor(row.total_xp / 100) + 1;
      if (newLevel > row.level) {
        await pool.query('UPDATE student_xp SET level = ? WHERE student_id = ?', [newLevel, studentId]);
      }
    }

    // 解锁成就：problems_completed 类型
    const [newAchievements] = await pool.query(
      `SELECT a.*, sa.id as student_achievement_id
       FROM achievements a
       JOIN student_achievements sa ON sa.achievement_id = a.id
       WHERE sa.student_id = ?
         AND a.is_active = TRUE
         AND a.condition_type = 'problems_completed'
         AND a.condition_value = ?`,
      [studentId, completedCount]
    ) as any;

    // 标记为已通知
    for (const ach of newAchievements) {
      await pool.query(
        'UPDATE student_achievements SET is_notified = TRUE, unlocked_at = NOW() WHERE id = ?',
        [ach.student_achievement_id]
      );
    }

    // 解锁难度相关成就
    const [diffAchievements] = await pool.query(
      `SELECT a.*, sa.id as student_achievement_id
       FROM achievements a
       JOIN student_achievements sa ON sa.achievement_id = a.id
       WHERE sa.student_id = ?
         AND a.is_active = TRUE
         AND a.condition_type = 'difficulty_completed'
         AND a.condition_value <= ?`,
      [studentId, taskDifficulty]
    ) as any;

    for (const ach of diffAchievements) {
      await pool.query(
        'UPDATE student_achievements SET is_notified = TRUE, unlocked_at = NOW(), progress = ? WHERE id = ?',
        [taskDifficulty, ach.student_achievement_id]
      );
      newAchievements.push(ach);
    }

    return newAchievements.map((a: any) => ({
      id: a.id,
      code: a.code,
      name: a.name,
      description: a.description,
      icon: a.icon,
      xp_reward: a.xp_reward,
    }));
  } catch (error) {
    fastify.log.error({ err: error }, 'Achievement check failed');
    return [];
  }
}

// ========== 无AI时的后备提示 ==========
async function getFallbackHint(task: any, level: number): Promise<string> {
  if (level === 1) {
    let l1 = task.level_1_model;
    if (typeof l1 === 'string') {
      try { l1 = JSON.parse(l1); } catch { return '请尝试从题目描述中找出关键信息'; }
    }
    if (l1?.analogy) return `提示：${l1.analogy}`;
    if (l1?.core_model) return `提示：${l1.core_model}`;
    return '请尝试从题目描述中找出关键信息';
  }
  if (level === 2) {
    const l2 = typeof task.level_2_pseudo === 'string'
      ? JSON.parse(task.level_2_pseudo)
      : task.level_2_pseudo;
    if (l2?.steps?.length > 0) {
      return l2.steps.map((s: any) => `${s.title}: ${s.hint || s.content}`).join('\n');
    }
    return '请参考算法步骤，尝试写出你的解题思路';
  }
  return '仔细理解题目要求，注意边界条件和特殊情况';
}
