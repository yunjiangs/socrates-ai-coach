import React, { useState } from 'react';
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

const DIFFICULTY_COLORS = {
  1: { bg: 'bg-green-500/20', text: 'text-green-400', label: '入门' },
  2: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '基础' },
  3: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: '提高' },
  4: { bg: 'bg-red-500/20', text: 'text-red-400', label: '进阶' },
  5: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: '竞赛' },
};

// 演示数据
const DEMO_TASKS: Task[] = [
  { id: 1, title: '两数之和（经典）', source: 'CSP-J 基础', difficulty_level: 2, knowledge_tags: ['数组', '哈希表'] },
  { id: 2, title: '斐波那契数列', source: 'CSP-J 基础', difficulty_level: 1, knowledge_tags: ['数组', '动态规划'] },
  { id: 3, title: '判断质数', source: 'CSP-J 基础', difficulty_level: 1, knowledge_tags: ['数学', '循环'] },
  { id: 4, title: '最大公约数', source: 'CSP-J 基础', difficulty_level: 2, knowledge_tags: ['数学', '欧几里得算法'] },
  { id: 5, title: '字符串反转', source: 'CSP-J 基础', difficulty_level: 1, knowledge_tags: ['字符串', '双指针'] },
];

export default function HomePage() {
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null);
  const [showDemo, setShowDemo] = useState(false);

  // 获取题目列表
  const { data: tasks, isLoading, refetch } = useQuery<Task[]>({
    queryKey: ['tasks', difficultyFilter],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (difficultyFilter) {
          params.append('difficulty', String(difficultyFilter));
        }
        const url = `${API_BASE}/tasks${params.toString() ? '?' + params.toString() : ''}`;
        const res = await axios.get(url);
        if (res.data.tasks && res.data.tasks.length > 0) {
          return res.data.tasks;
        }
        // API没有数据，使用演示数据
        setShowDemo(true);
        return DEMO_TASKS;
      } catch {
        // API失败，使用演示数据
        setShowDemo(true);
        return DEMO_TASKS;
      }
    },
  });

  // 过滤题目
  const filteredTasks = difficultyFilter
    ? tasks?.filter(t => t.difficulty_level === difficultyFilter)
    : tasks;

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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-neon-green">🔥 开始修炼</h2>
          <div className="flex items-center gap-2">
            {/* 难度筛选 */}
            <div className="flex gap-1">
              <button
                onClick={() => setDifficultyFilter(null)}
                className={`px-3 py-1 rounded text-sm ${
                  difficultyFilter === null
                    ? 'bg-neon-cyan/20 text-neon-cyan'
                    : 'bg-cyber-dark text-gray-400 hover:text-white'
                }`}
              >
                全部
              </button>
              {[1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  onClick={() => setDifficultyFilter(level)}
                  className={`px-3 py-1 rounded text-sm ${
                    difficultyFilter === level
                      ? `${DIFFICULTY_COLORS[level as keyof typeof DIFFICULTY_COLORS].bg} ${DIFFICULTY_COLORS[level as keyof typeof DIFFICULTY_COLORS].text}`
                      : 'bg-cyber-dark text-gray-400 hover:text-white'
                  }`}
                >
                  {DIFFICULTY_COLORS[level as keyof typeof DIFFICULTY_COLORS].label}
                </button>
              ))}
            </div>
            <button
              onClick={() => refetch()}
              className="p-2 rounded bg-cyber-dark hover:bg-cyber-dark/80 text-gray-400 hover:text-neon-cyan transition-colors"
              title="刷新"
            >
              🔄
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-4xl animate-pulse mb-4">⏳</div>
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : filteredTasks && filteredTasks.length > 0 ? (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <Link
                key={task.id}
                to={`/task/${task.id}`}
                className="block p-4 rounded-lg bg-cyber-dark border border-neon-cyan/20 
                           hover:border-neon-cyan/50 transition-all duration-200
                           hover:shadow-lg hover:shadow-neon-cyan/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-neon-cyan">{task.title}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-gray-500">{task.source}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        DIFFICULTY_COLORS[task.difficulty_level as keyof typeof DIFFICULTY_COLORS].bg
                      } ${
                        DIFFICULTY_COLORS[task.difficulty_level as keyof typeof DIFFICULTY_COLORS].text
                      }`}>
                        {DIFFICULTY_COLORS[task.difficulty_level as keyof typeof DIFFICULTY_COLORS].label}
                      </span>
                      {task.knowledge_tags?.map((tag, idx) => (
                        <span key={idx} className="text-xs px-2 py-0.5 rounded bg-neon-purple/10 text-neon-purple">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-neon-green text-2xl ml-4">→</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-gray-400 mb-4">暂无题目</p>
            <p className="text-gray-500 text-sm">
              可以通过导入功能添加题目
            </p>
          </div>
        )}

        {/* 演示数据提示 */}
        {showDemo && tasks && tasks.length > 0 && (
          <div className="mt-6 p-4 rounded-lg bg-neon-cyan/5 border border-neon-cyan/20">
            <p className="text-sm text-neon-cyan">
              💡 当前显示演示题目。登录后可体验完整功能。
            </p>
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
