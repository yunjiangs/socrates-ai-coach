import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface Problem {
  id: number;
  title: string;
  status?: 'completed' | 'in_progress' | 'stuck';
  minutes?: number;
  xp?: number;
  time?: string;
  step?: string;
  difficulty?: string;
}

interface WeakTag {
  tag: string;
  passRate: number;
  avgMinutes: number;
}

interface RadarPoint {
  label: string;
  value: number; // 0-100
}

interface StudentXP {
  level: number;
  total_xp: number;
  xp_in_current_level: number;
  xp_to_next_level: number;
  progress_percent: number;
}

// 模拟数据（实际对接API后替换）
const DEMO_STUDENT = {
  id: 1,
  name: '陈同学',
  totalProblems: 12,
  totalHours: 38,
  streakDays: 23,
  weakTags: [
    { tag: '动态规划', passRate: 30, avgMinutes: 45 },
    { tag: '哈希表', passRate: 45, avgMinutes: 32 },
    { tag: '树结构', passRate: 25, avgMinutes: 55 },
    { tag: '图论', passRate: 15, avgMinutes: 60 },
    { tag: '贪心', passRate: 55, avgMinutes: 28 },
  ],
  radarData: [
    { label: '数组', value: 85 },
    { label: '循环', value: 78 },
    { label: '字符串', value: 72 },
    { label: '分支', value: 90 },
    { label: '动态规划', value: 30 },
  ],
  recentActivity: [
    { id: 1, title: 'P1001 — A+B Problem', status: 'completed', minutes: 5, xp: 10, time: '10分钟前' },
    { id: 2, title: 'P1044 — [NOIP2003普及组]栈', status: 'in_progress', minutes: 25, step: '2/3', time: '进行中' },
    { id: 3, title: 'B2001 — 鸡兔同笼问题', status: 'completed', minutes: 18, xp: 15, time: '昨天 18:30' },
    { id: 4, title: 'P1057 — 校门外的树', status: 'completed', minutes: 22, xp: 15, time: '昨天 15:20' },
    { id: 5, title: 'P3382 — [模板]堆排序', status: 'stuck', minutes: 45, time: '2天前' },
  ] as Problem[],
  xp: { level: 12, total_xp: 2450, xp_in_current_level: 2000, xp_to_next_level: 450, progress_percent: 67 },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  入门: 'text-neon-green',
  '普及−': 'text-gray-400',
  '普及/提高−': 'text-gray-400',
  '普及+/提高': 'text-purple-400',
  '提高+/省选−': 'text-orange-400',
  默认: 'text-gray-400',
};

// 注入 shimmer 动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
  .animate-shimmer {
    animation: shimmer 2s ease-in-out infinite;
  }
`;
if (!document.querySelector('#progress-styles')) {
  style.id = 'progress-styles';
  document.head.appendChild(style);
}

export default function StudentProgress() {
  const [student] = useState(DEMO_STUDENT);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const radarMax = 100;
  const centerX = 150, centerY = 140, radius = 100;
  const numPoints = student.radarData.length;

  // 计算雷达图多边形顶点
  const getRadarPoints = () => {
    return student.radarData.map((p, i) => {
      const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2;
      const r = (p.value / radarMax) * radius;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  // 网格线
  const gridLevels = [0.25, 0.5, 0.75, 1];
  const gridPolygons = gridLevels.map(level => {
    return student.radarData.map((_, i) => {
      const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2;
      const r = radius * level;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  });

  // 雷达图标签位置
  const getLabelPos = (i: number) => {
    const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2;
    const r = radius + 22;
    return { x: centerX + r * Math.cos(angle), y: centerY + r * Math.sin(angle) };
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 顶部标题 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold cyber-text-green">📊 学习进度</h1>
          <p className="text-gray-400 text-sm mt-1">追踪成长轨迹，定位薄弱环节</p>
        </div>
        <Link to="/student" className="text-gray-400 hover:text-neon-green text-sm">
          ← 返回学习中心
        </Link>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="cyber-card p-5">
          <div className="text-3xl font-bold text-neon-green">{student.totalProblems}</div>
          <div className="text-xs text-gray-400 mt-1">已完成题目</div>
          <div className="text-xs text-neon-green mt-2">+3 本周</div>
        </div>
        <div className="cyber-card p-5">
          <div className="text-3xl font-bold text-neon-cyan">{student.totalHours}h</div>
          <div className="text-xs text-gray-400 mt-1">总学习时长</div>
          <div className="text-xs text-neon-cyan mt-2">+8h 本周</div>
        </div>
        <div className="cyber-card p-5">
          <div className="text-3xl font-bold text-orange-400">{student.weakTags.length}</div>
          <div className="text-xs text-gray-400 mt-1">薄弱知识点</div>
          <div className="text-xs text-orange-400 mt-2">需加强练习</div>
        </div>
        <div className="cyber-card p-5">
          <div className="text-3xl font-bold text-yellow-400">{student.streakDays}</div>
          <div className="text-xs text-gray-400 mt-1">连续学习</div>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-orange-400">🔥</span>
            <span className="text-xs text-orange-400">加油保持！</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 雷达图 */}
        <div className="cyber-card p-6">
          <h3 className="text-lg font-bold text-neon-cyan mb-4 flex items-center gap-2">
            <span>📡</span> 知识雷达
          </h3>
          <div className="flex justify-center">
            <svg viewBox="0 0 300 280" className="w-72 h-64">
              {/* 网格 */}
              {gridPolygons.map((pts, i) => (
                <polygon key={i} points={pts} fill="none" stroke="rgba(0,212,255,0.15)" strokeWidth="1" />
              ))}
              {/* 轴线 */}
              {student.radarData.map((_, i) => {
                const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2;
                const x2 = centerX + radius * Math.cos(angle);
                const y2 = centerY + radius * Math.sin(angle);
                return <line key={i} x1={centerX} y1={centerY} x2={x2} y2={y2} stroke="rgba(0,212,255,0.1)" strokeWidth="1" />;
              })}
              {/* 数据区域 */}
              <polygon
                points={getRadarPoints()}
                fill="rgba(0,255,136,0.15)"
                stroke="#00ff88"
                strokeWidth="2"
              />
              {/* 数据点 */}
              {student.radarData.map((p, i) => {
                const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2;
                const r = (p.value / radarMax) * radius;
                const x = centerX + r * Math.cos(angle);
                const y = centerY + r * Math.sin(angle);
                return <circle key={i} cx={x} cy={y} r="4" fill="#00ff88" />;
              })}
              {/* 标签 */}
              {student.radarData.map((p, i) => {
                const pos = getLabelPos(i);
                const anchor = pos.x < centerX - 5 ? 'end' : pos.x > centerX + 5 ? 'start' : 'middle';
                return (
                  <text
                    key={i}
                    x={pos.x}
                    y={pos.y}
                    textAnchor={anchor}
                    dominantBaseline="middle"
                    fill="#00d4ff"
                    fontSize="11"
                  >
                    {p.label} {p.value}%
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* 薄弱知识点 */}
        <div className="cyber-card p-6">
          <h3 className="text-lg font-bold text-orange-400 mb-4 flex items-center gap-2">
            <span>⚠️</span> 薄弱知识点
          </h3>
          <div className="space-y-3">
            {student.weakTags.map(wt => (
              <div
                key={wt.tag}
                className={`p-3 rounded-lg transition-all cursor-pointer ${selectedTag === wt.tag ? 'bg-orange-500/20 border border-orange-500/40' : 'bg-cyber-dark/50 hover:bg-orange-500/10'}`}
                onClick={() => setSelectedTag(selectedTag === wt.tag ? null : wt.tag)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{wt.tag}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">正确率</span>
                    <span className={`text-sm font-bold ${
                      wt.passRate < 30 ? 'text-red-400' : wt.passRate < 50 ? 'text-orange-400' : 'text-yellow-400'
                    }`}>{wt.passRate}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 mb-1">
                  <div
                    className={`h-2 rounded-full transition-all ${wt.passRate < 30 ? 'bg-red-500' : wt.passRate < 50 ? 'bg-orange-500' : 'bg-yellow-500'}`}
                    style={{ width: `${wt.passRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>平均用时 {wt.avgMinutes} 分钟</span>
                  <button className="text-neon-cyan hover:text-neon-green transition-colors">
                    → 练习推荐
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* AI推荐 */}
          <div className="mt-4 p-3 rounded-lg bg-neon-purple/10 border border-neon-purple/30">
            <div className="text-xs text-purple-400 font-bold mb-2">🤖 AI 学习建议</div>
            <p className="text-xs text-gray-400 leading-relaxed">
              你的动态规划和哈希表比较薄弱，建议先从「记忆化搜索」入门题开始，每天练习2-3道，2周可见效。
            </p>
          </div>
        </div>
      </div>

      {/* XP进度 */}
      <div className="cyber-card p-6 mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl">⭐</span>
            <div>
              <div className="text-2xl font-bold text-neon-green">Lv.{student.xp.level}</div>
              <div className="text-gray-400 text-sm">{student.xp.total_xp} XP 总经验值</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-neon-cyan font-bold">{student.xp.xp_to_next_level} XP</div>
            <div className="text-gray-500 text-sm">距下一级</div>
          </div>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-neon-green to-neon-cyan transition-all duration-700 relative overflow-hidden"
            style={{ width: `${student.xp.progress_percent}%` }}
          >
            {/* 光效 */}
            <div className="absolute inset-0 bg-gradient-to-r transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{student.xp.xp_in_current_level} / {student.xp.level * 100} XP</span>
          <span>下一级: {student.xp.level + 1}级</span>
        </div>
      </div>

      {/* 最近学习记录 */}
      <div className="cyber-card p-6 mt-6">
        <h3 className="text-lg font-bold text-white mb-4">📝 最近学习</h3>
        <div className="space-y-2">
          {student.recentActivity.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg bg-cyber-dark/50 hover:bg-cyber-dark/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  item.status === 'completed' ? 'bg-neon-green/20 text-neon-green' :
                  item.status === 'in_progress' ? 'bg-neon-cyan/20 text-neon-cyan animate-pulse' :
                  'bg-orange-500/20 text-orange-400'
                }`}>
                  {item.status === 'completed' ? '✅' : item.status === 'in_progress' ? '⏳' : '⚠️'}
                </div>
                <div>
                  <div className="text-sm text-white font-medium">{item.title}</div>
                  <div className="text-xs text-gray-500">{item.time} {item.minutes && `· ${item.minutes}分钟`}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {item.step && (
                  <span className="text-xs text-neon-cyan">{item.step}</span>
                )}
                {item.xp && (
                  <span className="text-xs text-neon-green font-bold">+{item.xp} XP</span>
                )}
                {item.status === 'stuck' && (
                  <button className="cyber-btn text-xs text-orange-400 border-orange-500/50 py-1 px-3">
                    需要帮助
                  </button>
                )}
                {item.status === 'in_progress' && (
                  <Link to="/student" className="cyber-btn cyber-btn-cyan text-xs py-1 px-3">
                    继续
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
