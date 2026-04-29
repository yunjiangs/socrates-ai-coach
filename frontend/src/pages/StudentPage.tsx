import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function StudentPage() {
  const userId = 1; // TODO: 从登录态获取
  const [xp, setXP] = useState({ level: 1, total_xp: 0 });
  const [earnedCount, setEarnedCount] = useState(0);

  useEffect(() => {
    // 加载成就数据用于展示
    const loadAchData = async () => {
      try {
        const [achRes, xpRes] = await Promise.all([
          axios.get(`${API_BASE}/achievements/student/${userId}`),
          axios.get(`${API_BASE}/achievements/student/${userId}/xp`),
        ]);
        setXP(xpRes.data);
        setEarnedCount(achRes.data.earned?.length || 0);
      } catch {
        // 接口未就绪时静默跳过
      }
    };
    loadAchData();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold cyber-text-green mb-8">学生端</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 进度查看 */}
        <Link
          to="/student/progress"
          className="cyber-card p-6 hover:border-neon-cyan/50 transition-colors"
        >
          <div className="text-4xl mb-4">📊</div>
          <h2 className="text-xl font-bold text-neon-cyan mb-2">学习进度</h2>
          <p className="text-gray-400 text-sm">
            查看我的学习记录、知识点掌握情况和成长轨迹
          </p>
        </Link>

        {/* 继续学习 */}
        <Link
          to="/"
          className="cyber-card p-6 hover:border-neon-green/50 transition-colors"
        >
          <div className="text-4xl mb-4">📚</div>
          <h2 className="text-xl font-bold text-neon-green mb-2">继续修炼</h2>
          <p className="text-gray-400 text-sm">
            选择题目开始学习，从逻辑建模到代码提示
          </p>
        </Link>

        {/* 成就系统 */}
        <Link
          to="/student/achievements"
          className="cyber-card p-6 hover:border-yellow-400/50 transition-colors"
        >
          <div className="text-4xl mb-4">🏆</div>
          <h2 className="text-xl font-bold text-yellow-400 mb-2">学习成就</h2>
          <p className="text-gray-400 text-sm mb-3">
            查看已解锁成就、当前进度和等级
          </p>
          {/* 成就小状态 */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <span>⭐</span>
              <span className="text-gray-300">Lv.{xp.level}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🏆</span>
              <span className="text-gray-300">{earnedCount} 已解锁</span>
            </div>
          </div>
        </Link>

        {/* 错题本 */}
        <div className="cyber-card p-6 opacity-60">
          <div className="text-4xl mb-4">📝</div>
          <h2 className="text-xl font-bold text-gray-400 mb-2">错题本</h2>
          <p className="text-gray-500 text-sm">
            功能开发中，敬请期待...
          </p>
        </div>

        {/* 收藏题目 */}
        <div className="cyber-card p-6 opacity-60">
          <div className="text-4xl mb-4">⭐</div>
          <h2 className="text-xl font-bold text-gray-400 mb-2">收藏题目</h2>
          <p className="text-gray-500 text-sm">
            功能开发中，敬请期待...
          </p>
        </div>

        {/* 排行榜 */}
        <Link
          to="/student/achievements"
          className="cyber-card p-6 opacity-60"
        >
          <div className="text-4xl mb-4">🎖️</div>
          <h2 className="text-xl font-bold text-gray-400 mb-2">排行榜</h2>
          <p className="text-gray-500 text-sm">
            功能开发中，敬请期待...
          </p>
        </Link>
      </div>
    </div>
  );
}
