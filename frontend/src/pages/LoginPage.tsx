import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { username, password }
        : { username, password, nickname, role };

      const res = await axios.post(`${API_BASE}${endpoint}`, payload);
      
      // 保存token
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // 跳转
      if (res.data.user.role === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '操作失败');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="cyber-card p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center cyber-text-green mb-8">
          {isLogin ? '🔐 登录' : '📝 注册'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="cyber-input"
              placeholder="请输入用户名"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="cyber-input"
              placeholder="请输入密码"
              required
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-1">昵称</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="cyber-input"
                  placeholder="请输入昵称"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">角色</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="student"
                      checked={role === 'student'}
                      onChange={() => setRole('student')}
                      className="text-neon-cyan"
                    />
                    <span>学生</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="teacher"
                      checked={role === 'teacher'}
                      onChange={() => setRole('teacher')}
                      className="text-neon-cyan"
                    />
                    <span>老师</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}

          <button type="submit" className="cyber-button-primary w-full">
            {isLogin ? '登录' : '注册'}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-400">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-neon-cyan hover:underline"
          >
            {isLogin ? '还没有账号？去注册' : '已有账号？去登录'}
          </button>
        </div>
      </div>
    </div>
  );
}
