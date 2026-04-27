import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface Progress {
  id: number;
  task_id: number;
  task_title: string;
  difficulty_level: number;
  current_level: number;
  is_completed: boolean;
  total_time_seconds: number;
  completed_at: string;
  interact_logs: string;
}

interface StudentInfo {
  id: number;
  nickname: string;
  total_tasks: number;
  completed_tasks: number;
  total_time_minutes: number;
}

const DIFFICULTY_COLORS = {
  1: { bg: 'bg-green-500/20', text: 'text-green-400', label: '入门' },
  2: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '基础' },
  3: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: '提高' },
  4: { bg: 'bg-red-500/20', text: 'text-red-400', label: '进阶' },
  5: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: '竞赛' },
};

// 演示数据
const DEMO_PROGRESS: Progress[] = [
  { id: 1, task_id: 1, task_title: '两数之和（经典）', difficulty_level: 2, current_level: 3, is_completed: true, total_time_seconds: 2700, completed_at: '2026-04-27', interact_logs: '[]' },
  { id: 2, task_id: 2, task_title: '斐波那契数列', difficulty_level: 1, current_level: 2, is_completed: false, total_time_seconds: 1200, completed_at: '', interact_logs: '[]' },
  { id: 3, task_id: 3, task_title: '判断质数', difficulty_level: 1, current_level: 3, is_completed: true, total_time_seconds: 1800, completed_at: '2026-04-26', interact_logs: '[]' },
];

const DEMO_STUDENT: StudentInfo = {
  id: 2,
  nickname: '小明同学',
  total_tasks: 5,
  completed_tasks: 2,
  total_time_minutes: 95,
};

export default function StudentProgress() {
  const [studentId] = useState(2); // 演示用固定学生ID

  // 获取学生信息
  const { data: student } = useQuery<StudentInfo>({
    queryKey: ['student-info', studentId],
    queryFn: async () => {
      // 演示数据
      return DEMO_STUDENT;
    },
  });

  // 获取进度列表
  const { data: progressList, refetch } = useQuery<Progress[]>({
    queryKey: ['student-progress', studentId],
    queryFn: async () => {
      try {
        const res = await axios.get(`${API_BASE}/progress/student/${studentId}`);
        if (res.data.progress && res.data.progress.length > 0) {
          return res.data.progress;
        }
      } catch {}
      return DEMO_PROGRESS;
    },
  });

  // 计算统计数据
  const completedCount = progressList?.filter(p => p.is_completed).length || 0;
  const totalTimeMinutes = progressList?.reduce((sum, p) => sum + Math.floor(p.total_time_seconds / 60), 0) || 0;
  
  // 计算知识点掌握情况（模拟）
  const knowledgeStats = [
    { name: '数组', rate: 85, color: 'bg-neon-cyan' },
    { name: '哈希表', rate: 60, color: 'bg-neon-yellow' },
    { name: '动态规划', rate: 45, color: 'bg-neon-orange' },
    { name: '排序', rate: 70, color: 'bg-neon-green' },
    { name: '图论', rate: 30, color: 'bg-neon-pink' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-cyan to-neon-green flex items-center justify-center text-2xl">
            {student?.nickname?.charAt(0) || '?'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neon-green">{student?.nickname || '加载中...'}</h1>
            <p className="text-gray-400">学习进度概览</p>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="cyber-card p-4 text-center">
          <div className="text-3xl font-bold text-neon-cyan">{completedCount}</div>
          <div className="text-sm text-gray-400">已完成题目</div>
        </div>
        <div className="cyber-card p-4 text-center">
          <div className="text-3xl font-bold text-neon-green">{totalTimeMinutes}</div>
          <div className="text-sm text-gray-400">总学习分钟</div>
        </div>
        <div className="cyber-card p-4 text-center">
          <div className="text-3xl font-bold text-neon-purple">{progressList?.length || 0}</div>
          <div className="text-sm text-gray-400">开始过的题目</div>
        </div>
        <div className="cyber-card p-4 text-center">
          <div className="text-3xl font-bold text-neon-pink">
            {completedCount > 0 ? Math.round((completedCount / (progressList?.length || 1)) * 100) : 0}%
          </div>
          <div className="text-sm text-gray-400">完成率</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 知识点掌握雷达 */}
        <div className="cyber-card p-6">
          <h2 className="text-xl font-bold text-neon-purple mb-4">📊 知识点掌握</h2>
          
          <div className="space-y-4">
            {knowledgeStats.map((stat, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-300">{stat.name}</span>
                  <span className="text-sm text-gray-500">{stat.rate}%</span>
                </div>
                <div className="h-2 bg-cyber-dark rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${stat.color} transition-all duration-500`}
                    style={{ width: `${stat.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-cyber-dark/50 rounded-lg">
            <h3 className="text-sm font-bold text-neon-cyan mb-2">💡 学习建议</h3>
            <p className="text-xs text-gray-400">
              动态规划和图论是你的薄弱点，建议加强这两方面的练习。
            </p>
          </div>
        </div>

        {/* 进度列表 */}
        <div className="lg:col-span-2 cyber-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-neon-cyan">📝 学习记录</h2>
            <button 
              onClick={() => refetch()}
              className="text-gray-400 hover:text-neon-cyan text-sm"
            >
              🔄 刷新
            </button>
          </div>

          {progressList && progressList.length > 0 ? (
            <div className="space-y-3">
              {progressList.map((progress) => (
                <Link
                  key={progress.id}
                  to={`/task/${progress.task_id}`}
                  className="block p-4 rounded-lg bg-cyber-dark hover:bg-cyber-dark/80 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-neon-cyan">{progress.task_title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          DIFFICULTY_COLORS[progress.difficulty_level as keyof typeof DIFFICULTY_COLORS].bg
                        } ${
                          DIFFICULTY_COLORS[progress.difficulty_level as keyof typeof DIFFICULTY_COLORS].text
                        }`}>
                          {DIFFICULTY_COLORS[progress.difficulty_level as keyof typeof DIFFICULTY_COLORS].label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>⏱️ {Math.floor(progress.total_time_seconds / 60)}分钟</span>
                        <span>📍 第{progress.current_level}关</span>
                        {progress.completed_at && (
                          <span>✅ {progress.completed_at}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {progress.is_completed ? (
                        <span className="text-xl">🎉</span>
                      ) : (
                        <span className="text-xl">📖</span>
                      )}
                      <span className="text-neon-green">→</span>
                    </div>
                  </div>
                  
                  {/* 进度条 */}
                  <div className="mt-2">
                    <div className="h-1 bg-cyber-dark rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-neon-cyan to-neon-green"
                        style={{ width: `${(progress.current_level / 3) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Level 1</span>
                      <span>Level 2</span>
                      <span>Level 3</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📚</div>
              <p className="text-gray-400">还没有学习记录</p>
              <Link
                to="/"
                className="inline-block mt-4 cyber-button text-sm"
              >
                去选题
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
