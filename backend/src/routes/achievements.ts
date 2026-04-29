/**
 * 成就系统后端 API
 * 适配 schema.sql 的表结构
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../db.js';

export async function routes(fastify: FastifyInstance) {

  // ========== 获取所有成就定义 ==========
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM achievements WHERE is_active = TRUE ORDER BY display_order'
      );
      return reply.send(rows);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // ========== 获取某个学生的成就及进度 ==========
  fastify.get('/student/:studentId', async (request: FastifyRequest<{ Params: { studentId: string } }>, reply: FastifyReply) => {
    const { studentId } = request.params;
    try {
      const [earned] = await pool.query(
        `SELECT a.*, sa.unlocked_at, sa.progress
         FROM achievements a
         JOIN student_achievements sa ON sa.achievement_id = a.id
         WHERE sa.student_id = ? AND a.is_active = TRUE
         ORDER BY sa.unlocked_at DESC`,
        [studentId]
      ) as any;

      const [allProgress] = await pool.query(
        `SELECT a.id, a.code, a.condition_type, a.condition_value,
                COALESCE(sa.progress, 0) as progress,
                sa.unlocked_at IS NOT NULL as is_unlocked
         FROM achievements a
         LEFT JOIN student_achievements sa ON sa.achievement_id = a.id AND sa.student_id = ?
         WHERE a.is_active = TRUE`,
        [studentId]
      ) as any;

      const [xpRow] = await pool.query(
        'SELECT total_xp, level FROM student_xp WHERE student_id = ?',
        [studentId]
      ) as any;

      return reply.send({
        earned: earned,
        progress: allProgress,
        xp: xpRow[0] || { total_xp: 0, level: 1 }
      });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // ========== 获取学生等级信息 ==========
  fastify.get('/student/:studentId/xp', async (request: FastifyRequest<{ Params: { studentId: string } }>, reply: FastifyReply) => {
    const { studentId } = request.params;
    try {
      const [rows] = await pool.query(
        'SELECT total_xp, level FROM student_xp WHERE student_id = ?',
        [studentId]
      ) as any;

      if (!rows[0]) {
        await pool.query(
          'INSERT INTO student_xp (student_id, total_xp, level) VALUES (?, 0, 1)',
          [studentId]
        );
        return reply.send({ total_xp: 0, level: 1, xp_to_next_level: 100 });
      }

      const level = rows[0].level;
      const currentXP = rows[0].total_xp;
      const xpForCurrentLevel = (level - 1) * 100;
      const xpForNextLevel = level * 100;
      const xpInCurrentLevel = currentXP - xpForCurrentLevel;
      const xpToNextLevel = xpForNextLevel - currentXP;

      return reply.send({
        total_xp: currentXP,
        level,
        xp_in_current_level: xpInCurrentLevel,
        xp_to_next_level: xpToNextLevel,
        progress_percent: Math.round((xpInCurrentLevel / (xpForNextLevel - xpForCurrentLevel)) * 100)
      });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // ========== 触发成就检查 ==========
  interface CheckBody {
    studentId: number;
    eventType: string;
    eventValue?: any;
  }
  fastify.post<{ Body: CheckBody }>('/check', async (request, reply) => {
    const { studentId, eventType, eventValue } = request.body;
    try {
      const newAchievements: any[] = [];

      const [achievements] = await pool.query(
        `SELECT * FROM achievements
         WHERE is_active = TRUE
           AND id NOT IN (
             SELECT achievement_id FROM student_achievements WHERE student_id = ?
           )`,
        [studentId]
      ) as any;

      for (const ach of achievements) {
        let progress = 0;
        let shouldUnlock = false;

        switch (ach.condition_type) {
          case 'problems_completed': {
            const [countRows] = await pool.query(
              'SELECT COUNT(*) as cnt FROM student_progress WHERE student_id = ? AND is_completed = TRUE',
              [studentId]
            ) as any;
            progress = countRows[0].cnt;
            shouldUnlock = progress >= ach.condition_value;
            break;
          }
          case 'streak_days': {
            progress = eventType === 'streak_update' ? eventValue : 0;
            shouldUnlock = progress >= ach.condition_value;
            break;
          }
          case 'difficulty_completed': {
            const difficulty = eventValue?.difficulty;
            if (difficulty) {
              const [cnt] = await pool.query(
                `SELECT COUNT(*) as cnt FROM student_progress sp
                 JOIN tasks t ON t.id = sp.task_id
                 WHERE sp.student_id = ? AND t.difficulty_level = ? AND sp.is_completed = TRUE`,
                [studentId, difficulty]
              ) as any;
              progress = cnt[0].cnt;
              shouldUnlock = progress >= ach.condition_value;
            }
            break;
          }
          case 'tag_mastery': {
            const tag = eventValue?.tag;
            if (tag) {
              const [cnt] = await pool.query(
                `SELECT COUNT(*) as cnt FROM student_progress sp
                 JOIN tasks t ON t.id = sp.task_id
                 WHERE sp.student_id = ? AND JSON_CONTAINS(t.knowledge_tags, ?, '$') AND sp.is_completed = TRUE`,
                [studentId, JSON.stringify(tag)]
              ) as any;
              progress = cnt[0].cnt;
              shouldUnlock = progress >= ach.condition_value;
            }
            break;
          }
          case 'avg_time_under': {
            const [rows] = await pool.query(
              `SELECT AVG(stay_seconds) / 60 as avg_minutes
               FROM student_progress
               WHERE student_id = ? AND is_completed = TRUE AND stay_seconds > 0`,
              [studentId]
            ) as any;
            if (rows[0]?.avg_minutes !== null) {
              progress = Math.floor(rows[0].avg_minutes);
              shouldUnlock = progress <= ach.condition_value;
            }
            break;
          }
          case 'solve_speed': {
            if (eventValue?.minutes !== undefined) {
              shouldUnlock = eventValue.minutes <= ach.condition_value;
            }
            break;
          }
        }

        if (shouldUnlock) {
          await pool.query(
            'INSERT IGNORE INTO student_achievements (student_id, achievement_id, progress) VALUES (?, ?, ?)',
            [studentId, ach.id, ach.condition_value]
          );
          await pool.query(
            'UPDATE student_xp SET total_xp = total_xp + ? WHERE student_id = ?',
            [ach.xp_reward, studentId]
          );
          await checkLevelUp(studentId);
          newAchievements.push({
            id: ach.id,
            code: ach.code,
            name: ach.name,
            description: ach.description,
            icon: ach.icon,
            xp_reward: ach.xp_reward
          });
        } else {
          await pool.query(
            `INSERT INTO student_achievements (student_id, achievement_id, progress)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE progress = ?`,
            [studentId, ach.id, progress, progress]
          );
        }
      }

      const [xpRow] = await pool.query(
        'SELECT total_xp, level FROM student_xp WHERE student_id = ?',
        [studentId]
      ) as any;

      return reply.send({
        new_achievements: newAchievements,
        xp: xpRow[0] || { total_xp: 0, level: 1 }
      });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // ========== 成就排行榜 ==========
  fastify.get<{ Params: { classId: string } }>('/leaderboard/:classId', async (request, reply) => {
    const { classId } = request.params;
    try {
      const [rows] = await pool.query(
        `SELECT s.id, s.nickname, sx.level, sx.total_xp,
                COUNT(sa.id) as achievements_count
         FROM students s
         JOIN student_xp sx ON sx.student_id = s.id
         LEFT JOIN student_achievements sa ON sa.student_id = s.id
         WHERE s.class_id = ? AND s.role = 'student'
         GROUP BY s.id
         ORDER BY sx.total_xp DESC
         LIMIT 20`,
        [classId]
      );
      return reply.send(rows);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });
}

async function checkLevelUp(studentId: number) {
  const [rows] = await pool.query(
    'SELECT total_xp, level FROM student_xp WHERE student_id = ?',
    [studentId]
  ) as any;

  if (!rows[0]) return;

  const { total_xp, level } = rows[0];
  let newLevel = level;
  let xp = total_xp;
  while (xp >= newLevel * 100) {
    newLevel++;
  }
  if (newLevel > level) {
    await pool.query(
      'UPDATE student_xp SET level = ? WHERE student_id = ?',
      [newLevel, studentId]
    );
  }
}
