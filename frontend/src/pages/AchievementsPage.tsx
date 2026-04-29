import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface Achievement {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  condition_type: string;
  condition_value: number;
  xp_reward: number;
  unlocked_at?: string;
  progress?: number;
  is_unlocked?: boolean;
}

interface XPData {
  total_xp: number;
  level: number;
  xp_in_current_level: number;
  xp_to_next_level: number;
  progress_percent: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  learning: '📚 学习成就',
  speed: '⚡ 速度成就',
  streak: '🔥 连续成就',
  mastery: '🎯 掌握成就',
  social: '👥 社交成就',
};

const CATEGORY_COLORS: Record<string, string> = {
  learning: 'border-neon-green',
  speed: 'border-yellow-400',
  streak: 'border-orange-500',
  mastery: 'border-purple-500',
  social: 'border-blue-400',
};

export default function AchievementsPage() {
  const userId = 1; // TODO: 从登录态获取
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [earnedIds, setEarnedIds] = useState<Set<number>>(new Set());
  const [xp, setXP] = useState<XPData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAch, setSelectedAch] = useState<Achievement | null>(null);
  const [newUnlock, setNewUnlock] = useState<Achievement | null>(null);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      const [achRes, xpRes] = await Promise.all([
        axios.get(`${API_BASE}/achievements/student/${userId}`),
        axios.get(`${API_BASE}/achievements/student/${userId}/xp`),
      ]);

      const data = achRes.data;
      const earned = data.earned as Achievement[];
      const allAch = data.progress as Achievement[];

      // 合并所有成就含进度
      const earnedMap = new Map(earned.map(a => [a.id, a]));
      const progressMap = new Map(allAch.map(a => [a.id, a]));

      const all = [...earned, ...allAch.filter(a => !earnedMap.has(a.id))];
      const unique = Array.from(new Map(all.map(a => [a.id, {
        ...a,
        ...progressMap.get(a.id),
        ...earnedMap.get(a.id),
        is_unlocked: earnedMap.has(a.id),
        progress: progressMap.get(a.id)?.progress || 0,
        unlocked_at: earnedMap.get(a.id)?.unlocked_at,
      }])).values()).sort((a, b) => {
        if (a.is_unlocked && !b.is_unlocked) return -1;
        if (!a.is_unlocked && b.is_unlocked) return 1;
        return a.display_order - b.display_order;
      });

      setAchievements(unique);
      setEarnedIds(new Set(earned.map(a => a.id)));
      setXP(xpRes.data);
    } catch (err) {
      console.error('Failed to load achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  // 按分类分组
  const byCategory = achievements.reduce((acc, ach) => {
    const cat = ach.category || 'learning';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ach);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const earnedCount = earnedIds.size;
  const totalCount = achievements.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neon-green animate-pulse text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 顶部状态栏 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold cyber-text-green mb-6">🏆 学习成就</h1>

        {/* XP进度条 */}
        {xp && (
          <div className="cyber-card p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-4xl">⭐</span>
                <div>
                  <div className="text-2xl font-bold text-neon-green">Lv.{xp.level}</div>
                  <div className="text-gray-400 text-sm">{xp.total_xp} XP 总经验值</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-neon-cyan font-bold">{xp.xp_to_next_level} XP</div>
                <div className="text-gray-500 text-sm">距下一级</div>
              </div>
            </div>
            {/* 等级进度条 */}
            <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-neon-green to-neon-cyan transition-all duration-700"
                style={{ width: `${xp.progress_percent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{xp.xp_in_current_level} / {xp.level * 100} XP (当前级)</span>
              <span>升级: {xp.level + 1}级</span>
            </div>
          </div>
        )}

        {/* 统计概览 */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="cyber-card p-4 text-center">
            <div className="text-3xl font-bold text-neon-green">{earnedCount}</div>
            <div className="text-gray-400 text-sm">已解锁</div>
          </div>
          <div className="cyber-card p-4 text-center">
            <div className="text-3xl font-bold text-gray-500">{totalCount - earnedCount}</div>
            <div className="text-gray-400 text-sm">未解锁</div>
          </div>
          <div className="cyber-card p-4 text-center">
            <div className="text-3xl font-bold text-neon-cyan">{totalCount}</div>
            <div className="text-gray-400 text-sm">成就总数</div>
          </div>
        </div>
      </div>

      {/* 分类展示 */}
      {Object.entries(byCategory).map(([cat, achs]) => (
        <div key={cat} className="mb-8">
          <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
            <span className={`w-1 h-6 bg-gradient-to-b ${cat === 'learning' ? 'from-neon-green' : cat === 'speed' ? 'from-yellow-400' : cat === 'streak' ? 'from-orange-500' : cat === 'mastery' ? 'from-purple-500' : 'from-blue-400'} rounded-full`} />
            {CATEGORY_LABELS[cat] || cat}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {achs.map(ach => (
              <div
                key={ach.id}
                onClick={() => setSelectedAch(ach)}
                className={`
                  cyber-card p-4 cursor-pointer transition-all duration-300
                  ${ach.is_unlocked
                    ? 'border ' + (CATEGORY_COLORS[cat] || 'border-neon-green') + ' hover:scale-105'
                    : 'opacity-50 hover:opacity-75'
                  }
                `}
              >
                <div className="text-4xl mb-2 text-center">
                  {ach.is_unlocked ? ach.icon : '🔒'}
                </div>
                <div className="text-center">
                  <div className={`font-bold text-sm mb-1 ${ach.is_unlocked ? 'text-white' : 'text-gray-400'}`}>
                    {ach.name}
                  </div>
                  <div className="text-xs text-gray-500 mb-2 line-clamp-2">
                    {ach.description}
                  </div>

                  {ach.is_unlocked ? (
                    <div className="text-xs text-neon-green">+{ach.xp_reward} XP 已获得</div>
                  ) : (
                    <div className="mt-2">
                      <div className="w-full bg-gray-800 rounded-full h-1.5">
                        <div
                          className="h-full bg-neon-green rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, ((ach.progress || 0) / ach.condition_value) * 100)}%`
                          }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {ach.progress || 0} / {ach.condition_value}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 成就详情弹窗 */}
      {selectedAch && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedAch(null)}>
          <div className="cyber-card p-8 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="text-6xl mb-4 text-center">{selectedAch.is_unlocked ? selectedAch.icon : '🔒'}</div>
            <h3 className="text-2xl font-bold text-center mb-2 cyber-text-green">{selectedAch.name}</h3>
            <p className="text-gray-400 text-center mb-4">{selectedAch.description}</p>

            <div className="flex justify-between text-sm mb-4 px-4">
              <div>
                <span className="text-gray-500">奖励</span>
                <span className="text-neon-green ml-2 font-bold">+{selectedAch.xp_reward} XP</span>
              </div>
              <div>
                <span className="text-gray-500">分类</span>
                <span className="text-gray-300 ml-2">{CATEGORY_LABELS[selectedAch.category]}</span>
              </div>
            </div>

            {selectedAch.is_unlocked ? (
              <div className="text-center text-neon-green">
                <div className="text-sm">已于 {new Date(selectedAch.unlocked_at!).toLocaleDateString('zh-CN')} 解锁</div>
              </div>
            ) : (
              <div>
                <div className="mb-2 text-sm text-gray-400">达成进度</div>
                <div className="w-full bg-gray-800 rounded-full h-3">
                  <div
                    className="h-full bg-gradient-to-r from-neon-green to-neon-cyan rounded-full"
                    style={{ width: `${Math.min(100, ((selectedAch.progress || 0) / selectedAch.condition_value) * 100)}%` }}
                  />
                </div>
                <div className="text-right text-sm text-gray-400 mt-1">
                  {selectedAch.progress || 0} / {selectedAch.condition_value}
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedAch(null)}
              className="mt-6 w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 新成就解锁动画 */}
      {newUnlock && (
        <div className="fixed top-8 right-8 z-50 animate-bounce">
          <div className="cyber-card p-6 border-neon-green bg-green-900/30 max-w-xs">
            <div className="text-4xl mb-2">{newUnlock.icon}</div>
            <div className="text-neon-green font-bold">新成就解锁！</div>
            <div className="text-white font-bold">{newUnlock.name}</div>
            <div className="text-gray-400 text-sm">+{newUnlock.xp_reward} XP</div>
          </div>
        </div>
      )}
    </div>
  );
}
