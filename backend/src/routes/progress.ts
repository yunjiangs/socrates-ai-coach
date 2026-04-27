/**
 * 学生进度相关API路由
 * POST /api/progress/verify - 验证学生答案，解锁下一关
 * GET /api/progress/:taskId - 获取学生在某题目的进度
 * GET /api/progress/student/:studentId - 获取学生所有进度
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import mysql from 'mysql2/promise';
import { socratesEngine } from '../ai/breakdown.js';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'socrates',
  password: process.env.DB_PASSWORD || 'socrates_pass_2024',
  database: process.env.DB_NAME || 'socrates_db',
  waitForConnections: true,
  connectionLimit: 10,
});

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

    // 获取题目和当前进度
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
    
    if (!progress) {
      // 创建新进度
      const [insertResult] = await pool.query(
        'INSERT INTO student_progress (task_id, student_id, current_level) VALUES (?, ?, 1)',
        [task_id, student_id]
      );
      progress = {
        id: (insertResult as any).insertId,
        current_level: 1,
      };
    }

    // 调用AI验证答案
    let isCorrect = false;
    let feedback = '';

    if (socratesEngine.isConfigured()) {
      try {
        // 获取当前级别的正确思路
        const levelData = level === 1 ? task.level_1_model : task.level_2_pseudo;
        const correctApproach = typeof levelData === 'string' ? levelData : JSON.stringify(levelData);
        
        const verification = await socratesEngine.verifyAnswer(answer, correctApproach);
        isCorrect = verification.is_correct;
        feedback = verification.feedback;
      } catch (error) {
        fastify.log.error('AI verification failed:', error);
        // 降级：简单关键词匹配
        isCorrect = checkSimpleKeyword(answer, task.level_1_model || '');
        feedback = isCorrect ? '思路正确！' : '请再想想';
      }
    } else {
      // 无AI时的简单验证
      isCorrect = checkSimpleKeyword(answer, task.level_1_model || '');
      feedback = isCorrect ? '思路正确！' : '请再想想';
    }

    // 记录验证日志
    await pool.query(
      `INSERT INTO verification_logs (progress_id, task_id, student_id, level_attempted, student_answer, ai_feedback, is_correct, stay_seconds)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [progress.id, task_id, student_id, level, answer, feedback, isCorrect, stay_seconds]
    );

    // 如果正确，解锁下一关
    if (isCorrect && level < 3) {
      const newLevel = level + 1;
      await pool.query(
        'UPDATE student_progress SET current_level = ?, updated_at = NOW() WHERE id = ?',
        [newLevel, progress.id]
      );

      // 检查是否完成全部
      if (newLevel === 3) {
        await pool.query(
          'UPDATE student_progress SET is_completed = TRUE, completed_at = NOW() WHERE id = ?',
          [progress.id]
        );
      }

      return reply.send({
        is_correct: true,
        feedback,
        unlocked: true,
        next_level: newLevel,
        message: newLevel === 3 ? '🎉 恭喜完成全部拆解！' : `✅ 已解锁第${newLevel}级`,
      });
    }

    return reply.send({
      is_correct: false,
      feedback: feedback || '请再想想，或者查看提示',
      unlocked: false,
    });
  });

  // ========== 获取学生在某题目的进度 ==========
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
          message: '尚未开始',
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
        `SELECT p.*, t.title as task_title, t.difficulty_level 
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

// 简单关键词验证（无AI时降级使用）
function checkSimpleKeyword(answer: string, correct: string): boolean {
  const keywords = ['循环', '遍历', 'if', '判断', 'return', '数组', '哈希', '指针'];
  const answerLower = answer.toLowerCase();
  return keywords.some(kw => 
    answerLower.includes(kw) && correct.toLowerCase().includes(kw)
  );
}
