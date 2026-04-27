import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function TeacherDashboard() {
  // TODO: 获取老师班级的学生数据
  
  const mockStudents = [
    { id: 1, nickname: '张小明', tasks_completed: 5, total_time_minutes: 120 },
    { id: 2, nickname: '李小红', tasks_completed: 3, total_time_minutes: 80 },
    { id: 3, nickname: '王小宝', tasks_completed: 7, total_time_minutes: 150 },
  ];

  const mockAlerts = [
    { id: 1, student_name: '张小明', task_title: '两数之和', message: '在"哈希表"逻辑上停留超过10分钟', is_read: false },
    { id: 2, student_name: '李小红', task_title: '斐波那契', message: '验证题尝试了5次才通过', is_read: false },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold cyber-text-green mb-8">🎛️ 老师后台</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 预警列表 */}
        <div className="cyber-card p-6">
          <h2 className="text-xl font-bold text-neon-pink mb-4">🚨 需要关注</h2>
          
          {mockAlerts.length > 0 ? (
            <div className="space-y-4">
              {mockAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-4 rounded-lg ${
                    alert.is_read ? 'bg-cyber-dark' : 'bg-neon-pink/10 border border-neon-pink/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-neon-cyan">{alert.student_name}</span>
                    <span className="text-xs text-gray-500">{alert.task_title}</span>
                  </div>
                  <p className="text-sm text-gray-400">{alert.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">暂无预警</p>
          )}
        </div>

        {/* 学生列表 */}
        <div className="cyber-card p-6">
          <h2 className="text-xl font-bold text-neon-cyan mb-4">📊 学生概览</h2>
          
          <div className="space-y-4">
            {mockStudents.map((student) => (
              <div 
                key={student.id}
                className="flex items-center justify-between p-4 rounded-lg bg-cyber-dark"
              >
                <div>
                  <div className="font-medium text-neon-green">{student.nickname}</div>
                  <div className="text-xs text-gray-500">
                    完成 {student.tasks_completed} 题 | 用时 {student.total_time_minutes}分钟
                  </div>
                </div>
                <button className="text-neon-cyan hover:underline text-sm">
                  查看详情 →
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 班级整体数据 */}
        <div className="cyber-card p-6 lg:col-span-2">
          <h2 className="text-xl font-bold text-neon-purple mb-4">📈 班级整体数据</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-cyber-dark rounded-lg">
              <div className="text-3xl font-bold text-neon-cyan">3</div>
              <div className="text-sm text-gray-500">学生数</div>
            </div>
            <div className="text-center p-4 bg-cyber-dark rounded-lg">
              <div className="text-3xl font-bold text-neon-green">15</div>
              <div className="text-sm text-gray-500">完成题目</div>
            </div>
            <div className="text-center p-4 bg-cyber-dark rounded-lg">
              <div className="text-3xl font-bold text-neon-purple">350</div>
              <div className="text-sm text-gray-500">总用时(分钟)</div>
            </div>
            <div className="text-center p-4 bg-cyber-dark rounded-lg">
              <div className="text-3xl font-bold text-neon-pink">78%</div>
              <div className="text-sm text-gray-500">平均通过率</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
