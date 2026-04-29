/**
 * 认证相关API路由
 * POST /api/auth/login - 登录
 * POST /api/auth/register - 注册
 * GET /api/auth/me - 获取当前用户
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { pool } from '../db.js';

export async function routes(fastify: FastifyInstance) {

  // ========== 注册 ==========
  fastify.post<{
    Body: {
      username: string;
      password: string;
      nickname?: string;
      role?: 'student' | 'teacher';
    };
  }>('/register', async (request, reply) => {
    const { username, password, nickname, role = 'student' } = request.body;

    if (!username || !password) {
      return reply.status(400).send({ error: 'username and password are required' });
    }

    // 检查用户名是否存在
    const [existing] = await pool.query(
      'SELECT id FROM students WHERE username = ?',
      [username]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      return reply.status(409).send({ error: 'Username already exists' });
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建用户
    const [result] = await pool.query(
      'INSERT INTO students (username, password_hash, nickname, role) VALUES (?, ?, ?, ?)',
      [username, passwordHash, nickname || username, role]
    );

    // 生成token
    const token = fastify.jwt.sign({
      id: (result as any).insertId,
      username,
      role,
    });

    return reply.send({
      token,
      user: {
        id: (result as any).insertId,
        username,
        nickname: nickname || username,
        role,
      },
    });
  });

  // ========== 登录 ==========
  fastify.post<{
    Body: {
      username: string;
      password: string;
    };
  }>('/login', async (request, reply) => {
    const { username, password } = request.body;

    if (!username || !password) {
      return reply.status(400).send({ error: 'username and password are required' });
    }

    // 查找用户
    const [rows] = await pool.query(
      'SELECT * FROM students WHERE username = ?',
      [username]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const user = rows[0] as any;

    // 验证密码
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    // 更新最后活跃时间
    await pool.query(
      'UPDATE students SET last_active_at = NOW() WHERE id = ?',
      [user.id]
    );

    // 生成token
    const token = fastify.jwt.sign({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    return reply.send({
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        role: user.role,
        class_id: user.class_id,
      },
    });
  });

  // ========== 获取当前用户 ==========
  fastify.get('/me', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const decoded = await request.jwtVerify();
      return reply.send({ user: decoded });
    } catch {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });
}
