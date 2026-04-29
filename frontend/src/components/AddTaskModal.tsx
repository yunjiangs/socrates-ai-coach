import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (taskId: number) => void;
}

const KNOWLEDGE_TAGS = ['数组', '字符串', '哈希表', '双指针', '栈', '队列', '堆', '并查集', '树', '图', 'DFS', 'BFS', '动态规划', '贪心', '二分', '排序', '数学', '模拟', '设计'];

export default function AddTaskModal({ isOpen, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');
  const [difficulty, setDifficulty] = useState(1);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('请填写题目名称和描述');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/tasks/ingest`, {
        title: title.trim(),
        content: content.trim(),
        source: source.trim(),
        difficulty_level: difficulty,
        knowledge_tags: tags,
      });
      onSuccess(res.data.task_id);
      setTitle('');
      setContent('');
      setSource('');
      setDifficulty(1);
      setTags([]);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || '添加失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="cyber-card max-w-lg w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-cyber-border">
          <h3 className="text-xl font-bold text-neon-cyan">📝 添加题目</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* 题目名称 */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">题目名称 *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="cyber-input w-full"
              placeholder="例如：两数之和"
            />
          </div>

          {/* 题目描述 */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">题目描述 *</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="cyber-input w-full h-32"
              placeholder="输入题目内容..."
            />
          </div>

          {/* 来源 */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">题目来源</label>
            <input
              type="text"
              value={source}
              onChange={e => setSource(e.target.value)}
              className="cyber-input w-full"
              placeholder="例如：CSP-J 2023"
            />
          </div>

          {/* 难度 */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">难度等级</label>
            <div className="flex gap-2">
              {[
                { v: 1, l: '🥉 青铜', c: 'border-amber-400/30 text-amber-400' },
                { v: 2, l: '🥈 白银', c: 'border-gray-400/30 text-gray-300' },
                { v: 3, l: '🥇 黄金', c: 'border-yellow-400/30 text-yellow-400' },
                { v: 4, l: '💎 钻石', c: 'border-cyan-400/30 text-cyan-300' },
              ].map(d => (
                <button
                  key={d.v}
                  type="button"
                  onClick={() => setDifficulty(d.v)}
                  className={`flex-1 py-2 rounded border text-sm transition-all ${
                    difficulty === d.v
                      ? `${d.c} bg-opacity-10`
                      : 'border-gray-700 text-gray-500 hover:border-gray-500'
                  }`}
                >
                  {d.l}
                </button>
              ))}
            </div>
          </div>

          {/* 知识点 */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">知识点（可多选）</label>
            <div className="flex flex-wrap gap-2">
              {KNOWLEDGE_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded text-xs transition-all ${
                    tags.includes(tag)
                      ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/50'
                      : 'bg-cyber-dark text-gray-400 border border-gray-700 hover:border-gray-500'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 提交 */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="cyber-button flex-1">
              取消
            </button>
            <button type="submit" disabled={loading} className="cyber-button-primary flex-1">
              {loading ? '✨ AI拆解中...' : '添加并AI拆解'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
