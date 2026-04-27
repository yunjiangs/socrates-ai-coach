import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="border-b border-neon-cyan/20 bg-cyber-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <span className="font-bold cyber-text-green">苏格拉底AI教练</span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-6">
            <Link 
              to="/" 
              className="text-gray-300 hover:text-neon-cyan transition-colors"
            >
              首页
            </Link>
            <Link 
              to="/student" 
              className="text-gray-300 hover:text-neon-cyan transition-colors"
            >
              学生端
            </Link>
            <Link 
              to="/teacher" 
              className="text-gray-300 hover:text-neon-cyan transition-colors"
            >
              老师后台
            </Link>
            <Link 
              to="/login" 
              className="cyber-button text-sm"
            >
              登录
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
