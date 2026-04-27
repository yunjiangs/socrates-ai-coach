/**
 * Socrates Coach - 信奥AI启发式导学平台
 * Backend: Fastify + TypeScript + MySQL + LangChain
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { routes as taskRoutes } from './routes/tasks.js';
import { routes as authRoutes } from './routes/auth.js';
import { routes as progressRoutes } from './routes/progress.js';
import { routes as statsRoutes } from './routes/stats.js';
import { aiBreakdownRouter } from './routes/ai.js';

const PORT = parseInt(process.env.PORT || '3001');

// ========== Fastify 实例 ==========
const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// ========== 插件注册 ==========
await fastify.register(cors, {
  origin: true,
  credentials: true,
});

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'socrates-coach-secret-key-2024',
});

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

// ========== 健康检查 ==========
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// ========== API 路由 ==========
fastify.register(taskRoutes, { prefix: '/api/tasks' });
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(progressRoutes, { prefix: '/api/progress' });
fastify.register(statsRoutes, { prefix: '/api/stats' });
fastify.register(aiBreakdownRouter, { prefix: '/api/ai' });

// ========== 错误处理 ==========
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  
  if (error.validation) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: error.message,
    });
  }
  
  return reply.status(error.statusCode || 500).send({
    error: error.name,
    message: error.message,
  });
});

// ========== 启动 ==========
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎯 Socrates Coach Backend                              ║
║   赛博修仙风格信奥AI导学平台                              ║
║                                                           ║
║   Server running on: http://localhost:${PORT}               ║
║   API Docs: http://localhost:${PORT}/docs                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

export { fastify };
