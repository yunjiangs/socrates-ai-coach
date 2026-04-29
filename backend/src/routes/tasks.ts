/**
 * 题目相关API路由
 * POST /api/tasks/ingest - 摄入题目并AI拆解
 * GET /api/tasks/:id - 获取题目详情
 * GET /api/tasks - 获取题目列表
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { socratesEngine } from '../ai/breakdown.js';
import { pool } from '../db.js';

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
      return reply.send({ message: 'from_cache', task_id: (cached[0] as any).id });
    }

    let level_1_model = '';
    let level_2_pseudo = { steps: [] };
    let level_3_quiz = { question: '', options: [], explanation: '' };

    // 调用AI拆解
    if (socratesEngine.isConfigured()) {
      try {
        const breakdown = await socratesEngine.generateBreakdown(
          content,
          difficulty_level || 2,
          knowledge_tags || []
        );
        level_1_model = JSON.stringify(breakdown.level_1);
        level_2_pseudo = breakdown.level_2;
        level_3_quiz = breakdown.level_3;
      } catch (error) {
        fastify.log.error('AI breakdown failed:', error);
      }
    }

    // 存入数据库
    const [result] = await pool.query(
      `INSERT INTO tasks (title, content, source, difficulty_level, knowledge_tags, level_1_model, level_2_pseudo, level_3_quiz, cache_key)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        content,
        source || '',
        difficulty_level || 1,
        JSON.stringify(knowledge_tags || []),
        level_1_model,
        JSON.stringify(level_2_pseudo),
        JSON.stringify(level_3_quiz),
        cacheKey,
      ]
    );

    return reply.send({
      message: 'created',
      task_id: (result as any).insertId,
      cache_key: cacheKey,
    });
  });

  // ========== 获取题目详情 ==========
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const { student_id } = request.query as { student_id?: number };

    const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return reply.status(404).send({ error: 'Task not found' });
    }

    const task = tasks[0] as any;
    let currentLevel = 0;
    let isLocked = true;
    let isCompleted = false;

    // 如果有学生ID，获取进度
    if (student_id) {
      const [progress] = await pool.query(
        'SELECT * FROM student_progress WHERE task_id = ? AND student_id = ? AND current_level > 0',
        [id, student_id]
      );

      if (Array.isArray(progress) && progress.length > 0) {
        currentLevel = (progress[0] as any).current_level || 0;
        isCompleted = (progress[0] as any).is_completed || false;
        isLocked = false;
      }
    }

    // 根据进度返回对应级别的内容
    const response: any = {
      id: task.id,
      title: task.title,
      content: task.content,
      source: task.source,
      difficulty_level: task.difficulty_level,
      knowledge_tags: typeof task.knowledge_tags === 'string'
        ? JSON.parse(task.knowledge_tags)
        : task.knowledge_tags,
      current_level: currentLevel,
      is_completed: isCompleted,
    };

    // L1: 总是显示（即使未解锁也显示题目描述）
    response.level_1 = {
      core_model: task.level_1_model || '',
      analogy: '',
      real_world_example: '',
      key_terms: [],
    };

    // L2: 解锁2级后显示
    if (currentLevel >= 2) {
      const l2 = typeof task.level_2_pseudo === 'string'
        ? JSON.parse(task.level_2_pseudo)
        : task.level_2_pseudo;
      response.level_2 = l2;
    } else {
      response.level_2 = null;
    }

    // L3: 解锁3级后显示
    if (currentLevel >= 3) {
      const l3 = typeof task.level_3_quiz === 'string'
        ? JSON.parse(task.level_3_quiz)
        : task.level_3_quiz;
      response.level_3 = l3;
    } else {
      response.level_3 = null;
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

    const tasks = (rows as any[]).map(t => ({
      ...t,
      knowledge_tags: typeof t.knowledge_tags === 'string'
        ? JSON.parse(t.knowledge_tags)
        : t.knowledge_tags,
    }));

    return reply.send({
      tasks,
      pagination: { limit, offset },
    });
  });
}
