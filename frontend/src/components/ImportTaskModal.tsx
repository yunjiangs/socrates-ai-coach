import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface ImportTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportTaskModal({ isOpen, onClose, onSuccess }: ImportTaskModalProps) {
  const [jsonContent, setJsonContent] = useState('');
  const [error, setError] = useState('');

  // 下载模板
  const handleDownloadTemplate = async () => {
    try {
      const res = await axios.get(`${API_BASE}/tasks/template`);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'task_template.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('下载模板失败');
    }
  };

  // 导入
  const importMutation = useMutation({
    mutationFn: async () => {
      const tasks = JSON.parse(jsonContent);
      const res = await axios.post(`${API_BASE}/tasks/import`, { tasks });
      return res.data;
    },
    onSuccess: (data) => {
      alert(`导入完成！成功: ${data.success}，失败: ${data.failed}`);
      setJsonContent('');
      setError('');
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || '导入失败');
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="cyber-card w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neon-cyan/20">
          <h2 className="text-xl font-bold text-neon-cyan">📥 批量导入题目</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {/* 操作按钮 */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={handleDownloadTemplate}
              className="cyber-button text-sm"
            >
              📥 下载模板
            </button>
          </div>

          {/* 说明 */}
          <div className="bg-cyber-dark/50 rounded-lg p-4 mb-4">
            <h3 className="text-neon-green font-bold mb-2">导入说明</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• 支持JSON格式的题目批量导入</li>
              <li>• 必填字段：title（标题）、content（内容）</li>
              <li>• 建议先下载模板，按照格式填写</li>
              <li>• 支持带三级拆解的题目，也支持只上传题目内容</li>
            </ul>
          </div>

          {/* JSON输入 */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">题目JSON</label>
            <textarea
              value={jsonContent}
              onChange={(e) => setJsonContent(e.target.value)}
              placeholder={`[\n  {\n    "title": "题目标题",\n    "content": "题目内容",\n    "difficulty_level": 1\n  }\n]`}
              className="w-full h-64 px-4 py-2 rounded-lg bg-cyber-dark border border-neon-cyan/30 
                         text-gray-100 font-mono text-sm resize-none
                         focus:outline-none focus:border-neon-cyan/70"
            />
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-neon-cyan/20">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-cyber-dark text-gray-400 hover:text-white transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => importMutation.mutate()}
            disabled={!jsonContent.trim() || importMutation.isPending}
            className="cyber-button-primary disabled:opacity-50"
          >
            {importMutation.isPending ? '导入中...' : '确认导入'}
          </button>
        </div>
      </div>
    </div>
  );
}
