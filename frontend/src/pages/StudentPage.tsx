import React from 'react';
import { Link } from 'react-router-dom';

export default function StudentPage() {
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

        {/* 错题本 */}
        <div className="cyber-card p-6 opacity-60">
          <div className="text-4xl mb-4">📝</div>
          <h2 className="text-xl font-bold text-gray-400 mb-2">错题本</h2>
          <p className="text-gray-500 text-sm">
            功能开发中，敬请期待...
          </p>
        </div>

        {/* 成就系统 */}
        <div className="cyber-card p-6 opacity-60">
          <div className="text-4xl mb-4">🏆</div>
          <h2 className="text-xl font-bold text-gray-400 mb-2">学习成就</h2>
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
        <div className="cyber-card p-6 opacity-60">
          <div className="text-4xl mb-4">🎖️</div>
          <h2 className="text-xl font-bold text-gray-400 mb-2">排行榜</h2>
          <p className="text-gray-500 text-sm">
            功能开发中，敬请期待...
          </p>
        </div>
      </div>
    </div>
  );
}
