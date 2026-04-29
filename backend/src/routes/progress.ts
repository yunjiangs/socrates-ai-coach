/**
 * 学生进度相关API路由
 * POST /api/progress/verify - 验证学生答案，解锁下一关
 * GET /api/progress/:taskId - 获取学生在某题目的进度
 * GET /api/progress/student/:studentId - 获取学生所有进度
 * POST /api/progress/complete - 标记完成（成就触发）
 * POST /api/progress/favorite - 收藏/取消收藏题目
 * GET /api/progress/favorites/:studentId - 获取收藏列表
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
    let [progressRows] = await pool.query(
      'SELECT * FROM student_progress WHERE task_id = ? AND student_id = ?',
      [task_id, student_id]
    );

    let progress = progressRows[0] as any;
    const isNewProgress = !progress;

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
      // L3: 编码实现 - 用AI校验学生代码与题目要求
      if (socratesEngine.isConfigured()) {
        try {
          const verification = await socratesEngine.verifyCode(
            answer,
            task.content,
            task.level_1_model || ''
          );
          isCorrect = verification.is_correct;
          feedback = verification.feedback;
        } catch (error) {
          fastify.log.error('AI code verification failed:', error);
          isCorrect = false;
          feedback = '代码校验失败，请检查格式';
        }
      } else {
        // 无AI时：简单检查代码长度
        isCorrect = answer.length > 20;
        feedback = isCorrect ? '代码看起来完整！' : '请输入完整的代码';
      }
    } else {
      // L1/L2: 用AI校验思路
      if (socratesEngine.isConfigured()) {
        try {
          const levelData = level === 1 ? task.level_1_model : JSON.stringify(task.level_2_pseudo);
          const verification = await socratesEngine.verifyAnswer(answer, levelData);
          isCorrect = verification.is_correct;
          feedback = verification.feedback;
        } catch (error) {
          fastify.log.error('AI verification failed:', error);
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

    // 如果正确且未到最高级，解锁下一关
    if (isCorrect && level < 3) {
      const newLevel = level + 1;
      const stayLog = JSON.parse(progress.stay_log || '[]');
      stayLog.push({ level, seconds: staySeconds });

      await pool.query(
        'UPDATE student_progress SET current_level = ?, total_time_seconds = total_time_seconds + ?, stay_log = ?, updated_at = NOW() WHERE id = ?',
        [newLevel, staySeconds, JSON.stringify(stayLog), progress.id]
      );

      if (newLevel === 3) {
        await pool.query(
          'UPDATE student_progress SET is_completed = TRUE, completed_at = NOW() WHERE id = ?',
          [progress.id]
        );
        // 触发成就检查
        await triggerAchievementCheck(student_id, 'problems_completed', fastify);
      }

      return reply.send({
        is_correct: true,
        feedback,
        unlocked: true,
        next_level: newLevel,
        is_completed: newLevel === 3,
        xp_gained: level === 1 ? 5 : level === 2 ? 10 : 20,
      });
    }

    // L3 正确 - 完成全部
    if (isCorrect && level === 3) {
      const stayLog = JSON.parse(progress.stay_log || '[]');
      stayLog.push({ level, seconds: staySeconds });

      await pool.query(
        `UPDATE student_progress SET is_completed = TRUE, completed_at = NOW(), current_level = 3,
         total_time_seconds = total_time_seconds + ?, stay_log = ?, updated_at = NOW() WHERE id = ?`,
        [staySeconds, JSON.stringify(stayLog), progress.id]
      );

      xpGained = 20;
      await triggerAchievementCheck(student_id, 'problems_completed', fastify);

      return reply.send({
        is_correct: true,
        feedback,
        unlocked: true,
        next_level: 3,
        is_completed: true,
        xp_gained: xpGained,
      });
    }

    return reply.send({
      is_correct: false,
      feedback: feedback || '回答不正确，请再想想',
      unlocked: false,
      is_completed: false,
      xp_gained: 0,
    });
  });

  // ========== 获取某学生在某题目的进度 ==========
  fastify.get<{ Params: { taskId: string }; Querystring: { student_id: string } }>(
    '/task/:taskId',
    async (request, reply) => {
      const { taskId } = request.params;
      const { student_id } = request.query;

      if (!student_id) {
        return reply.status(400).send({ error: 'student_id is required' });
      }

      const [rows] = await pool.query(
        'SELECT * FROM student_progress WHERE task_id = ? AND student_id = ?',
        [taskId, student_id]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return reply.send({
          task_id: parseInt(taskId),
          student_id: parseInt(student_id),
          current_level: 0,
          is_completed: false,
          total_time_seconds: 0,
          stay_log: [],
        });
      }

      return reply.send(rows[0]);
    }
  );

  // ========== 获取学生所有进度 ==========
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

  // ========== 收藏/取消收藏题目 ==========
  fastify.post<{
    Body: {
      student_id: number;
      task_id: number;
      action: 'favorite' | 'unfavorite';
    };
  }>('/favorite', async (request, reply) => {
    const { student_id, task_id, action } = request.body;

    if (action === 'favorite') {
      // 检查是否已收藏（用 student_progress 的 stay_log 字段复用或新建表）
      // 暂时用 INSERT IGNORE 避免重复
      await pool.query(
        `INSERT IGNORE INTO student_progress (task_id, student_id, current_level, stay_log)
         VALUES (?, ?, 0, '[{"favorite":true}]')`,
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

  // ========== 获取学生收藏列表 ==========
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

  // ========== 获取题解 ==========
  fastify.get<{ Params: { taskId: string } }>(
    '/solution/:taskId',
    async (request, reply) => {
      const { taskId } = request.params;
      const { student_id } = request.query as { student_id?: number };

      // 获取题目
      const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
      if (!Array.isArray(tasks) || tasks.length === 0) {
        return reply.status(404).send({ error: 'Task not found' });
      }
      const task = tasks[0] as any;

      // 只有完成的学生才能看题解，或者用AI生成
      let solution = '';

      if (student_id) {
        const [progress] = await pool.query(
          'SELECT is_completed FROM student_progress WHERE student_id = ? AND task_id = ?',
          [student_id, taskId]
        );
        const prog = Array.isArray(progress) && progress[0] ? progress[0] : null;

        if (prog?.is_completed) {
          // 已完成：用AI生成题解
          if (socratesEngine.isConfigured()) {
            try {
              const result = await socratesEngine.generateSolution(
                task.content,
                task.level_1_model || '',
                JSON.stringify(task.level_2_pseudo)
              );
              solution = result;
            } catch (error) {
              fastify.log.error('AI solution generation failed:', error);
              solution = '题解生成暂时不可用';
            }
          } else {
            solution = 'AI服务未配置，无法生成题解';
          }
        } else {
          return reply.status(403).send({
            error: '请先完成题目三级拆解才能查看题解'
          });
        }
      } else {
        return reply.status(400).send({
          error: '请先登录学生账号'
        });
      }

      return reply.send({ solution });
    }
  );

  // ========== 获取提示 ==========
  fastify.post<{
    Body: {
      task_id: number;
      student_id: number;
      level: number;
    };
  }>('/hint', async (request, reply) => {
    const { task_id, student_id, level } = request.body;

    const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [task_id]);
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return reply.status(404).send({ error: 'Task not found' });
    }
    const task = tasks[0] as any;

    let hint = '';

    if (level === 1 && task.level_1_model) {
      // L1提示：从生活化例子引导
      if (socratesEngine.isConfigured()) {
        try {
          const result = await socratesEngine.generateHint(task.content, task.level_1_model, 'level1');
          hint = result;
        } catch {
          hint = task.level_1_model;
        }
      } else {
        hint = '提示：' + task.level_1_model.slice(0, 50) + '...';
      }
    } else if (level === 2 && task.level_2_pseudo) {
      const steps = task.level_2_pseudo;
      if (typeof steps === 'object' && steps.steps) {
        hint = steps.steps.map((s: any) => `${s.title}: ${s.hint || s.content}`).join('\n');
      }
    } else if (level === 3) {
      hint = '编码提示：仔细理解题目要求，注意边界条件和特殊情况。';
    }

    return reply.send({ hint: hint || '暂无提示' });
  });
}

// ========== 触发成就检查 ==========
async function triggerAchievementCheck(studentId: number, eventType: string, fastify: FastifyInstance) {
  try {
    await pool.query(
      `INSERT INTO student_xp (student_id, total_xp, level)
       VALUES (?, 0, 1)
       ON DUPLICATE KEY UPDATE student_id = student_id`,
      [studentId]
    );

    // 统计完成的题目数
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as cnt FROM student_progress WHERE student_id = ? AND is_completed = TRUE',
      [studentId]
    );
    const completedCount = (countResult as any)[0]?.cnt || 0;

    // 增加XP
    const xpGain = 10;
    await pool.query(
      'UPDATE student_xp SET total_xp = total_xp + ? WHERE student_id = ?',
      [xpGain, studentId]
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
        await pool.query(
          'UPDATE student_xp SET level = ? WHERE student_id = ?',
          [newLevel, studentId]
        );
      }
    }

    // 解锁成就
    const [achievements] = await pool.query(
      `SELECT * FROM achievements
       WHERE is_active = TRUE
         AND condition_type = ?
         AND condition_value <= ?
         AND id NOT IN (
           SELECT achievement_id FROM student_achievements WHERE student_id = ?
         )`,
      [eventType, completedCount, studentId]
    ) as any;

    for (const ach of achievements) {
      await pool.query(
        'INSERT IGNORE INTO student_achievements (student_id, achievement_id, progress) VALUES (?, ?, ?)',
        [studentId, ach.id, completedCount]
      );
    }
  } catch (error) {
    fastify.log.error('Achievement check failed:', error);
  }
}
