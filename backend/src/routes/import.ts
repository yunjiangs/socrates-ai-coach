/**
 * 题目导入导出API
 * POST /api/tasks/import - 批量导入题目
 * GET /api/tasks/export - 导出题目JSON
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'socrates',
  password: process.env.DB_PASSWORD || 'socrates_pass_2024',
  database: process.env.DB_NAME || 'socrates_db',
  waitForConnections: true,
  connectionLimit: 10,
});

// ========== 题目导入 ==========
interface TaskImportItem {
  title: string;
  content: string;
  source?: string;
  difficulty_level?: number;
  knowledge_tags?: string[];
  level_1_model?: string;
  level_2_pseudo?: any;
  level_3_quiz?: any;
}

export async function importRoutes(fastify: FastifyInstance) {

  // ========== 批量导入题目 ==========
  fastify.post<{
    Body: {
      tasks: TaskImportItem[];
    };
  }>('/import', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tasks } = request.body as { tasks: TaskImportItem[] };

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return reply.status(400).send({
        error: 'Invalid request',
        message: 'tasks array is required',
      });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const results: { success: number; failed: number; errors: string[] } = {
        success: 0,
        failed: 0,
        errors: [],
      };

      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        try {
          // 验证必填字段
          if (!task.title || !task.content) {
            results.failed++;
            results.errors.push(`第${i + 1}题：标题和内容不能为空`);
            continue;
          }

          // 生成缓存key
          const cacheKey = Buffer.from(task.content).toString('base64').slice(0, 64);

          // 插入数据库
          await connection.query(
            `INSERT INTO tasks 
             (title, content, source, difficulty_level, knowledge_tags, level_1_model, level_2_pseudo, level_3_quiz, cache_key)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              task.title,
              task.content,
              task.source || '',
              task.difficulty_level || 1,
              JSON.stringify(task.knowledge_tags || []),
              task.level_1_model || '',
              task.level_2_pseudo ? JSON.stringify(task.level_2_pseudo) : null,
              task.level_3_quiz ? JSON.stringify(task.level_3_quiz) : null,
              cacheKey,
            ]
          );

          results.success++;
        } catch (err: any) {
          results.failed++;
          results.errors.push(`第${i + 1}题：${err.message}`);
        }
      }

      await connection.commit();

      return reply.send({
        message: 'Import completed',
        total: tasks.length,
        success: results.success,
        failed: results.failed,
        errors: results.errors.length > 0 ? results.errors : undefined,
      });
    } catch (err: any) {
      await connection.rollback();
      return reply.status(500).send({
        error: 'Import failed',
        message: err.message,
      });
    } finally {
      connection.release();
    }
  });

  // ========== 导出题目 ==========
  fastify.get<{
    Querystring: {
      difficulty?: number;
      tag?: string;
    };
  }>('/export', async (request: FastifyRequest, reply: FastifyReply) => {
    const { difficulty, tag } = request.query as { difficulty?: number; tag?: string };

    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params: any[] = [];

    if (difficulty) {
      query += ' AND difficulty_level = ?';
      params.push(difficulty);
    }

    query += ' ORDER BY id DESC';

    const [rows] = await pool.query(query, params);

    // 格式化输出
    const tasks = (rows as any[]).map(task => ({
      title: task.title,
      content: task.content,
      source: task.source,
      difficulty_level: task.difficulty_level,
      knowledge_tags: task.knowledge_tags ? JSON.parse(task.knowledge_tags) : [],
      level_1_model: task.level_1_model,
      level_2_pseudo: task.level_2_pseudo ? JSON.parse(task.level_2_pseudo) : undefined,
      level_3_quiz: task.level_3_quiz ? JSON.parse(task.level_3_quiz) : undefined,
    }));

    return reply.send({
      total: tasks.length,
      tasks,
    });
  });

  // ========== 下载导入模板 ==========
  fastify.get('/template', async (request: FastifyRequest, reply: FastifyReply) => {
    const template = {
      version: '1.0',
      description: '苏格拉底AI教练 - 题目导入模板',
      fields: {
        title: '题目标题（必填）',
        content: '题目内容（必填）',
        source: '题目来源，如 CSP-J 2023',
        difficulty_level: '难度等级 1-5',
        knowledge_tags: '知识点数组，如 ["数组", "哈希表"]',
        level_1_model: 'Level 1 逻辑建模',
        level_2_pseudo: 'Level 2 伪代码，格式 {steps: [{id, title, content, hint}]}',
        level_3_quiz: 'Level 3 验证题，格式 {question, options, correct_index, explanation}',
      },
      example: [
        {
          title: '两数之和',
          content: '给定一个整数数组nums和一个目标值target，找出数组中两个数的和等于目标值的两个数的下标。',
          source: 'CSP-J 基础',
          difficulty_level: 2,
          knowledge_tags: ['数组', '哈希表'],
          level_1_model: '这是一个查找配对问题',
          level_2_pseudo: {
            steps: [
              { id: 1, title: '理解问题', content: '在数组中找两个数', hint: '想想生活中找配对的例子' },
            ],
          },
          level_3_quiz: {
            question: '使用哈希表时，key应该存什么？',
            options: ['数值', '下标', '数值和下标'],
            correct_index: 0,
            explanation: '哈希表用数值做key可以实现O(1)查找',
          },
        },
      ],
    };

    return reply.send(template);
  });
}
