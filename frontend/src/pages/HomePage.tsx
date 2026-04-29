import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface Task {
  id: number;
  title: string;
  content?: string;
  source?: string;
  difficulty_level: number; // 1=入门, 2=基础, 3=提高, 4=进阶, 5=竞赛
  knowledge_tags?: string[];
  pass_count?: number;   // 通过人数
  time_limit?: number;  // ms
  memory_limit?: number; // MB
  level_1?: any; // 有内容表示已解锁
  level_2?: any;
  level_3?: any;
}

// 难度映射：数字 → 显示文字 + 颜色 (与原型一致：青铜/白银/黄金/钻石)
const DIFFICULTY_MAP: Record<number, { label: string; textColor: string; bgColor: string; borderColor: string }> = {
  1: { label: '青铜', textColor: 'text-amber-400', bgColor: 'bg-amber-400/10', borderColor: 'border-amber-400/30' },
  2: { label: '白银', textColor: 'text-gray-300', bgColor: 'bg-gray-400/10', borderColor: 'border-gray-400/30' },
  3: { label: '黄金', textColor: 'text-yellow-400', bgColor: 'bg-yellow-400/10', borderColor: 'border-yellow-400/30' },
  4: { label: '钻石', textColor: 'text-cyan-300', bgColor: 'bg-cyan-300/10', borderColor: 'border-cyan-300/30' },
};

const DIFFICULTY_LEVELS = [1, 2, 3, 4]; // 青铜、白银、黄金、钻石

// 演示题目数据（与原型一致）
const DEMO_TASKS: Task[] = [
  { id: 1, title: '两数之和（经典）', source: 'CSP-J 基础', difficulty_level: 1, knowledge_tags: ['数组', '哈希表'], pass_count: 12300, time_limit: 1000, memory_limit: 128, level_1: {} },
  { id: 2, title: '斐波那契数列', source: 'CSP-J 基础', difficulty_level: 1, knowledge_tags: ['数组', '动态规划'], pass_count: 8900, time_limit: 1000, memory_limit: 128, level_1: {}, level_2: {} },
  { id: 3, title: '判断质数', source: 'CSP-J 基础', difficulty_level: 1, knowledge_tags: ['数学', '循环'], pass_count: 23400, time_limit: 1000, memory_limit: 64, level_1: {} },
  { id: 4, title: '最大公约数', source: 'CSP-J 基础', difficulty_level: 2, knowledge_tags: ['数学', '欧几里得算法'], pass_count: 6700, time_limit: 1000, memory_limit: 64, level_1: {} },
  { id: 5, title: '字符串反转', source: 'CSP-J 基础', difficulty_level: 2, knowledge_tags: ['字符串', '双指针'], pass_count: 4500, time_limit: 1000, memory_limit: 128, level_1: {} },
  { id: 6, title: '[NOIP 2003 普及组] 栈', source: '洛谷 P1044', difficulty_level: 3, knowledge_tags: ['栈', 'Catalan数'], pass_count: 9200, time_limit: 1000, memory_limit: 128, level_1: {} },
  { id: 7, title: '[模板] 堆排序', source: '洛谷 P3382', difficulty_level: 4, knowledge_tags: ['堆', '贪心'], pass_count: 5100, time_limit: 1000, memory_limit: 256, level_1: {} },
  { id: 8, title: '鸡兔同笼问题', source: 'CZOJ B2001', difficulty_level: 1, knowledge_tags: ['分支', '数学'], pass_count: 20500, time_limit: 1000, memory_limit: 64, level_1: {} },
  { id: 9, title: '矩阵移动', source: 'CZOJ', difficulty_level: 2, knowledge_tags: ['递推', '动态规划'], pass_count: 3200, time_limit: 1000, memory_limit: 256, level_1: {} },
];

export default function HomePage() {
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');
  const [showDemo, setShowDemo] = useState(false);

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', difficultyFilter],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (difficultyFilter) params.append('difficulty', String(difficultyFilter));
        const url = `${API_BASE}/tasks${params.toString() ? '?' + params.toString() : ''}`;
        const res = await axios.get(url);
        if (res.data.tasks?.length > 0) {
          return res.data.tasks;
        }
        setShowDemo(true);
        return DEMO_TASKS;
      } catch {
        setShowDemo(true);
        return DEMO_TASKS;
      }
    },
  });

  const filteredTasks = tasks
    ?.filter(t => !difficultyFilter || t.difficulty_level === difficultyFilter)
    ?.filter(t => !searchText || t.title.toLowerCase().includes(searchText.toLowerCase()));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-2">
          {/* 螺旋发光图标 */}
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan via-neon-purple to-neon-pink flex items-center justify-center animate-spin-slow">
              <span className="text-2xl">🌀</span>
            </div>
            <div className="absolute inset-0 rounded-xl bg-neon-cyan/30 blur-xl -z-10" />
          </div>
          <h1 className="text-4xl font-bold cyber-text-green animate-glow-pulse">
            开始修炼
          </h1>
        </div>
        <p className="text-gray-400 text-sm">
          选择题目，从逻辑建模到代码提示，循序渐进
        </p>
      </div>

      {/* 特性介绍 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="cyber-card p-6 text-center hover:glow-box transition-all">
          <div className="text-4xl mb-3">📚</div>
          <h3 className="text-neon-cyan text-lg font-bold mb-2">三段式拆解</h3>
          <p className="text-gray-400 text-sm">逻辑建模 → 算法拆解 → 代码提示<br />把大问题拆成小问题</p>
        </div>
        <div className="cyber-card p-6 text-center hover:glow-box transition-all">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="text-neon-cyan text-lg font-bold mb-2">懂没懂验证</h3>
          <p className="text-gray-400 text-sm">强制输出思路才能解锁下一步<br />不让学生跳过思考</p>
        </div>
        <div className="cyber-card p-6 text-center hover:glow-box transition-all">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="text-neon-cyan text-lg font-bold mb-2">思维雷达图</h3>
          <p className="text-gray-400 text-sm">老师后台一目了然<br />哪里薄弱重点关注</p>
        </div>
      </div>

      {/* 题库区域 */}
      <div className="cyber-card p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-neon-green">🔥 开始修炼</h2>
          <div className="flex items-center gap-3 flex-wrap">
            {/* 搜索框 */}
            <input
              type="text"
              placeholder="🔍 搜索题目..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="cyber-input w-44 text-sm"
            />
            {/* 难度筛选 */}
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setDifficultyFilter(null)}
                className={`px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-1 ${
                  difficultyFilter === null
                    ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                    : 'bg-cyber-dark text-gray-400 hover:text-white border border-transparent'
                }`}
              >
                全部
              </button>
              {DIFFICULTY_LEVELS.map(level => {
                const diff = DIFFICULTY_MAP[level];
                return (
                  <button
                    key={level}
                    onClick={() => setDifficultyFilter(difficultyFilter === level ? null : level)}
                    className={`px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-1 ${
                      difficultyFilter === level
                        ? `${diff.bgColor} ${diff.textColor} border ${diff.borderColor}`
                        : 'bg-cyber-dark text-gray-400 hover:text-white border border-transparent'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-sm ${diff.bgColor} ${diff.textColor.replace('text-', 'bg-')}`} />
                    {diff.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-4xl animate-pulse mb-4">⏳</div>
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : filteredTasks && filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task) => {
              const diff = DIFFICULTY_MAP[task.difficulty_level] || DIFFICULTY_MAP[1];
              return (
                <Link
                  key={task.id}
                  to={`/task/${task.id}`}
                  className="block p-5 rounded-lg bg-cyber-dark border border-neon-cyan/20
                             hover:border-neon-cyan/50 hover:shadow-lg hover:shadow-neon-cyan/10
                             transition-all duration-200 problem-card"
                >
                  {/* 顶部：题号 + 来源 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded">
                        {task.source?.split(' ')[0] || '题目'}
                      </span>
                      {task.source?.includes('洛谷') && (
                        <span className="text-xs text-gray-500">洛谷</span>
                      )}
                      {task.source?.includes('CZOJ') && (
                        <span className="text-xs text-gray-500">CZOJ</span>
                      )}
                      {task.source?.includes('YBT') && (
                        <span className="text-xs text-gray-500">一本通</span>
                      )}
                    </div>
                    {/* 限制 */}
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <span>⚡</span>
                      <span>{(task.time_limit || 1000)}ms</span>
                      <span className="mx-1">/</span>
                      <span>{(task.memory_limit || 128)}MB</span>
                    </div>
                  </div>

                  {/* 标题 */}
                  <h3 className="text-base font-medium text-white mb-2 line-clamp-1 hover:text-neon-green transition-colors">
                    {task.title}
                  </h3>

                  {/* 标签 + 难度 */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex gap-1 flex-wrap">
                      {task.knowledge_tags?.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="text-xs px-2 py-0.5 rounded bg-neon-purple/10 text-neon-purple border border-neon-purple/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${diff.bgColor} ${diff.textColor} border ${diff.borderColor}`}>
                        {diff.label}
                      </span>
                      {task.pass_count && (
                        <span className="text-xs text-gray-500">{task.pass_count >= 1000 ? (task.pass_count / 1000).toFixed(1) + 'k' : task.pass_count} AC</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-gray-400 mb-4">暂无题目</p>
            <p className="text-gray-500 text-sm">可以通过导入功能添加题目</p>
          </div>
        )}

        {/* 演示提示 */}
        {showDemo && (
          <div className="mt-6 p-4 rounded-lg bg-neon-cyan/5 border border-neon-cyan/20">
            <p className="text-sm text-neon-cyan">
              💡 当前显示演示题目。连接真实API后可查看实际题库。
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center mt-12 text-gray-600 text-xs">
        <p>© 2024 Socrates Coach · Powered by LangChain + GPT-4 · 题目来源：洛谷 / CZOL / YBT题库</p>
      </div>
    </div>
  );
}
