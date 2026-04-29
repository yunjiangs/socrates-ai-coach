/**
 * 统计相关API路由 - 老师后台
 * GET /api/stats/student/:studentId - 学生思维雷达图数据
 * GET /api/stats/class/:classId - 班级整体情况
 * GET /api/stats/alerts/:teacherId - 预警列表
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../db.js';

export async function routes(fastify: FastifyInstance) {

  // ========== 学生思维雷达图 ==========
  fastify.get<{ Params: { studentId: string } }>(
    '/student/:studentId',
    async (request, reply) => {
      const { studentId } = request.params;

      // 获取该学生的知识点统计
      const [stats] = await pool.query(
        `SELECT * FROM knowledge_stats WHERE student_id = ?`,
        [studentId]
      );

      // 获取学生信息
      const [students] = await pool.query(
        'SELECT id, nickname FROM students WHERE id = ?',
        [studentId]
      );

      if (!Array.isArray(students) || students.length === 0) {
        return reply.status(404).send({ error: 'Student not found' });
      }

      const student = (students[0] as any);

      // 计算雷达图数据
      const radarData = {
        labels: [] as string[],
        datasets: [{
          label: student.nickname,
          data: [] as number[],
        }],
      };

      // 获取知识点通过率
      const knowledgeTags = ['DP', 'DFS', 'BFS', '排序', '二分', '图论', '字符串', '数学'];
      
      for (const tag of knowledgeTags) {
        const tagStats = (stats as any[]).filter(s => 
          s.knowledge_tag && s.knowledge_tag.includes(tag)
        );

        if (tagStats.length > 0) {
          const avgPassRate = tagStats.reduce((sum, s) => sum + (s.pass_rate || 0), 0) / tagStats.length;
          radarData.labels.push(tag);
          radarData.datasets[0].data.push(Math.round(avgPassRate * 100));
        } else {
          radarData.labels.push(tag);
          radarData.datasets[0].data.push(0);
        }
      }

      // 获取薄弱点
      const weakPoints = (stats as any[])
        .filter(s => s.is_weak_point)
        .map(s => ({
          knowledge_tag: s.knowledge_tag,
          pass_rate: Math.round((s.pass_rate || 0) * 100),
          avg_stay_seconds: s.avg_stay_seconds,
        }));

      return reply.send({
        student_id: studentId,
        student_name: student.nickname,
        radar_data: radarData,
        weak_points: weakPoints,
        total_tasks: (stats as any[]).filter(s => s.total_attempts > 0).length,
      });
    }
  );

  // ========== 班级整体情况 ==========
  fastify.get<{ Params: { classId: string } }>(
    '/class/:classId',
    async (request, reply) => {
      const { classId } = request.params;

      // 获取班级学生列表
      const [students] = await pool.query(
        `SELECT s.id, s.nickname, 
                COUNT(p.id) as tasks_completed,
                SUM(p.total_time_seconds) as total_time
         FROM students s
         LEFT JOIN student_progress p ON s.id = p.student_id AND p.is_completed = TRUE
         WHERE s.class_id = ?
         GROUP BY s.id`,
        [classId]
      );

      // 获取班级信息
      const [classes] = await pool.query(
        'SELECT * FROM classes WHERE id = ?',
        [classId]
      );

      if (!Array.isArray(classes) || classes.length === 0) {
        return reply.status(404).send({ error: 'Class not found' });
      }

      // 计算班级整体数据
      const classData = classes[0] as any;
      const studentList = students as any[];

      return reply.send({
        class: {
          id: classData.id,
          name: classData.name,
          student_count: studentList.length,
        },
        students: studentList.map(s => ({
          id: s.id,
          nickname: s.nickname,
          tasks_completed: s.tasks_completed || 0,
          total_time_minutes: Math.round((s.total_time || 0) / 60),
        })),
        summary: {
          avg_completion: studentList.length > 0
            ? Math.round(studentList.reduce((sum, s) => sum + (s.tasks_completed || 0), 0) / studentList.length)
            : 0,
        },
      });
    }
  );

  // ========== 老师预警列表 ==========
  fastify.get<{ Params: { teacherId: string } }>(
    '/alerts/:teacherId',
    async (request, reply) => {
      const { teacherId } = request.params;
      const { unread_only } = request.query as { unread_only?: boolean };

      let query = `
        SELECT a.*, s.nickname as student_name, t.title as task_title
        FROM teacher_alerts a
        JOIN students s ON a.student_id = s.id
        JOIN tasks t ON a.task_id = t.id
        WHERE a.teacher_id = ?
      `;
      const params: any[] = [teacherId];

      if (unread_only) {
        query += ' AND a.is_read = FALSE';
      }

      query += ' ORDER BY a.created_at DESC LIMIT 50';

      const [rows] = await pool.query(query, params);

      return reply.send({ alerts: rows });
    }
  );

  // ========== 标记预警已读 ==========
  fastify.post<{ Body: { alert_id: number } }>(
    '/alerts/read',
    async (request, reply) => {
      const { alert_id } = request.body;

      await pool.query(
        'UPDATE teacher_alerts SET is_read = TRUE WHERE id = ?',
        [alert_id]
      );

      return reply.send({ success: true });
    }
  );
}
