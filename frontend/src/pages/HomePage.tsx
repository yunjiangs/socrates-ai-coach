import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface Task {
  id: number;
  title: string;
  source: string;
  difficulty_level: number;
  knowledge_tags: string[];
}

export default function HomePage() {
  const { data, isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/tasks`);
      return res.data.tasks;
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 cyber-text-green animate-glow-pulse">
          🎯 苏格拉底AI教练
        </h1>
        <p className="text-xl text-gray-400 mb-2">
          不做判题机，做高价值"解惑师"
        </p>
        <p className="text-gray-500">
          让学生在思考中敲代码，不是在敲代码中放弃思考
        </p>
      </div>

      {/* 特性介绍 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="cyber-card p-6 text-center">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-neon-cyan text-lg font-bold mb-2">三段式拆解</h3>
          <p className="text-gray-400 text-sm">
            逻辑建模 → 算法拆解 → 代码提示
            <br />
            把大问题拆成小问题
          </p>
        </div>

        <div className="cyber-card p-6 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-neon-cyan text-lg font-bold mb-2">懂没懂验证</h3>
          <p className="text-gray-400 text-sm">
            强制输出思路才能解锁下一步
            <br />
            不让学生跳过思考
          </p>
        </div>

        <div className="cyber-card p-6 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-neon-cyan text-lg font-bold mb-2">思维雷达图</h3>
          <p className="text-gray-400 text-sm">
            老师后台一目了然
            <br />
            哪里薄弱重点关注
          </p>
        </div>
      </div>

      {/* 题目列表 */}
      <div className="cyber-card p-6">
        <h2 className="text-2xl font-bold text-neon-green mb-6">🔥 开始修炼</h2>
        
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : data && data.length > 0 ? (
          <div className="space-y-4">
            {data.map((task) => (
              <Link
                key={task.id}
                to={`/task/${task.id}`}
                className="block p-4 rounded-lg bg-cyber-dark border border-neon-cyan/20 
                           hover:border-neon-cyan/50 transition-all duration-200
                           hover:shadow-lg hover:shadow-neon-cyan/10"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-neon-cyan">{task.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{task.source}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-neon-purple/20 text-neon-purple">
                        难度 {task.difficulty_level}
                      </span>
                    </div>
                  </div>
                  <div className="text-neon-green">→</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            暂无题目，请先添加题目
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center mt-12 text-gray-500 text-sm">
        <p>MIT License - 完全开源，可商用</p>
        <p className="mt-2">
          <a 
            href="https://github.com/yunjiangs/socrates-ai-coach" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-neon-cyan hover:underline"
          >
            GitHub
          </a>
          {' | '}
          <a 
            href="https://gitee.com/yun_jiang/socrates-ai-coach" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-neon-cyan hover:underline"
          >
            Gitee
          </a>
        </p>
      </div>
    </div>
  );
}
