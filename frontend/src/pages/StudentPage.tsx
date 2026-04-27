import React from 'react';

export default function StudentPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold cyber-text-green mb-8">学生端</h1>
      
      <div className="cyber-card p-6">
        <p className="text-gray-400 mb-4">
          学生端功能开发中...
        </p>
        <ul className="space-y-2 text-gray-300">
          <li>✓ 查看已解锁题目</li>
          <li>✓ 完成拆解验证</li>
          <li>✓ 查看个人进度</li>
          <li>✓ 查看思维图谱</li>
        </ul>
      </div>
    </div>
  );
}
