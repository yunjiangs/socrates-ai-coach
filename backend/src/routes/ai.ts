/**
 * AI直接调用路由 - 用于测试AI拆解
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { socratesEngine } from '../ai/breakdown.js';

export async function aiBreakdownRouter(fastify: FastifyInstance) {

  // ========== 直接拆解题目(测试用) ==========
  fastify.post('/breakdown', async (request: FastifyRequest, reply: FastifyReply) => {
    const { problem, difficulty, knowledge_points } = request.body as {
      problem: string;
      difficulty?: number;
      knowledge_points?: string[];
    };

    if (!problem) {
      return reply.status(400).send({ error: 'problem is required' });
    }

    if (!socratesEngine.isConfigured()) {
      return reply.status(503).send({
        error: 'AI not configured',
        message: 'Please set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable',
      });
    }

    try {
      const breakdown = await socratesEngine.generateBreakdown(
        problem,
        difficulty || 2,
        knowledge_points || []
      );

      return reply.send({
        success: true,
        breakdown,
      });
    } catch (error) {
      fastify.log.error({ err: error }, 'AI breakdown failed');
      return reply.status(500).send({
        error: 'AI breakdown failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // ========== 验证答案 ==========
  fastify.post('/verify', async (request: FastifyRequest, reply: FastifyReply) => {
    const { student_answer, correct_approach } = request.body as {
      student_answer: string;
      correct_approach: string;
    };

    if (!student_answer || !correct_approach) {
      return reply.status(400).send({
        error: 'student_answer and correct_approach are required',
      });
    }

    if (!socratesEngine.isConfigured()) {
      return reply.status(503).send({
        error: 'AI not configured',
      });
    }

    try {
      const result = await socratesEngine.verifyAnswer(student_answer, correct_approach);
      return reply.send(result);
    } catch (error) {
      fastify.log.error({ err: error }, 'AI verify failed');
      return reply.status(500).send({
        error: 'AI verify failed',
      });
    }
  });

  // ========== 健康检查 + AI状态 ==========
  fastify.get('/status', async (request, reply) => {
    return reply.send({
      ai_configured: socratesEngine.isConfigured(),
      provider: socratesEngine.isConfigured() ? process.env.AI_PROVIDER || 'openai' : null,
      model: socratesEngine.isConfigured() 
        ? (process.env.AI_PROVIDER === 'anthropic' ? 'claude-3-sonnet' : 'gpt-4o')
        : null,
    });
  });
}
