import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/student', label: '题库', icon: '📚' },
  { path: '/student/progress', label: '进度', icon: '📊' },
  { path: '/student/achievements', label: '成就', icon: '🏆' },
  { path: '/teacher', label: '教师', icon: '👨‍🏫' },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="border-b border-neon-cyan/20 bg-cyber-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-white font-bold text-sm group-hover:shadow-lg group-hover:shadow-neon-cyan/50 transition-shadow">
                ⚡
              </div>
              <div className="absolute -inset-1 rounded-lg bg-neon-cyan/20 blur-sm group-hover:bg-neon-cyan/40 transition-colors -z-10" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold cyber-text-green text-sm leading-tight">Socrates Coach</span>
              <span className="text-[10px] text-gray-500 leading-tight">赛博修仙·信奥导学</span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path + item.label}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  location.pathname === item.path
                    ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* User Badge */}
          <div className="flex items-center gap-3 pl-4 border-l border-neon-cyan/20">
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-500">Lv.12</span>
              <span className="text-xs text-neon-green font-medium">2450 XP</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center text-white text-sm font-medium">
              陈
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
