/**
 * 题目相关API路由
 * POST /api/tasks/ingest - 摄入题目并AI拆解
 * GET /api/tasks/:id - 获取题目详情
 * GET /api/tasks - 获取题目列表
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

export async function routes(fastify: FastifyInstance) {
  
  // ========== 摄入题目 + AI拆解 ==========
  fastify.post('/ingest', async (request: FastifyRequest, reply: FastifyReply) => {
    const { title, content, source, difficulty_level, knowledge_tags } = request.body as {
      title: string;
      content: string;
      source?: string;
      difficulty_level?: number;
      knowledge_tags?: string[];
    };

    if (!title || !content) {
      return reply.status(400).send({ error: 'title and content are required' });
    }

    // 检查缓存
    const cacheKey = Buffer.from(content).toString('base64').slice(0, 64);
    const [cached] = await pool.query('SELECT * FROM tasks WHERE cache_key = ?', [cacheKey]);
    
    if (Array.isArray(cached) && cached.length > 0) {
      return reply.send({ 
        message: 'from_cache',
        task: cached[0] 
      });
    }

    // TODO: 调用AI拆解引擎
    // const breakdown = await socratesEngine.generateBreakdown(content, difficulty_level, knowledge_tags);

    // 临时模拟AI返回
    const mockBreakdown = {
      level_1_model: '这是一个查找配对问题',
      level_2_pseudo: { steps: [] },
      level_3_quiz: { question: '', options: [], correct: 0 },
    };

    // 存入数据库
    const [result] = await pool.query(
      `INSERT INTO tasks (title, content, source, difficulty_level, knowledge_tags, cache_key, ai_breakdown)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        title, 
        content, 
        source || '', 
        difficulty_level || 1, 
        JSON.stringify(knowledge_tags || []),
        cacheKey,
        JSON.stringify(mockBreakdown),
      ]
    );

    return reply.send({
      message: 'created',
      task_id: (result as any).insertId,
      cache_key: cacheKey,
    });
  });

  // ========== 获取题目详情(根据学生进度返回对应级别) ==========
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const { student_id } = request.query as { student_id?: number };

    const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return reply.status(404).send({ error: 'Task not found' });
    }

    const task = tasks[0] as any;
    let currentLevel = 1;
    let isLocked = true;

    // 如果有学生ID，获取进度
    if (student_id) {
      const [progress] = await pool.query(
        'SELECT * FROM student_progress WHERE task_id = ? AND student_id = ?',
        [id, student_id]
      );
      
      if (Array.isArray(progress) && progress.length > 0) {
        currentLevel = (progress[0] as any).current_level;
        isLocked = false;
      }
    }

    // 根据进度返回对应级别的内容
    const response: any = {
      id: task.id,
      title: task.title,
      content: task.content,
      difficulty_level: task.difficulty_level,
      current_level: currentLevel,
    };

    // 逐步解锁
    if (!isLocked || currentLevel >= 1) {
      response.level_1 = {
        core_model: task.level_1_model,
        analogy: '待解锁',
        real_world_example: '待解锁',
        key_terms: [],
      };
    }

    if (currentLevel >= 2) {
      response.level_2 = task.level_2_pseudo;
    }

    if (currentLevel >= 3) {
      response.level_3 = task.level_3_quiz;
    }

    return reply.send(response);
  });

  // ========== 获取题目列表 ==========
  fastify.get('/', async (request, reply) => {
    const { difficulty, limit = 20, offset = 0 } = request.query as {
      difficulty?: number;
      limit?: number;
      offset?: number;
    };

    let query = 'SELECT id, title, source, difficulty_level, knowledge_tags FROM tasks';
    const params: any[] = [];

    if (difficulty) {
      query += ' WHERE difficulty_level = ?';
      params.push(difficulty);
    }

    query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);

    return reply.send({
      tasks: rows,
      pagination: { limit, offset },
    });
  });
}
