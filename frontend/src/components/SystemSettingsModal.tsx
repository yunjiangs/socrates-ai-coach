import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SystemSettingsModal({ isOpen, onClose }: Props) {
  const [tab, setTab] = useState<'ai' | 'xp' | 'achievement'>('ai');
  const [saved, setSaved] = useState(false);

  // AI设置
  const [aiProvider, setAiProvider] = useState('openai');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiBaseUrl, setAiBaseUrl] = useState('https://api.minimaxi.com/v1');

  // XP设置
  const [xpPerCorrect, setXpPerCorrect] = useState(10);
  const [xpPerTask, setXpPerTask] = useState(50);
  const [xpPerfect, setXpPerfect] = useState(20);

  // 成就设置
  const [streakDays, setStreakDays] = useState(7);

  const handleSave = () => {
    // 实际项目中这里应该调用后端 API 保存设置到数据库或 .env
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="cyber-card max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyber-border">
          <h3 className="text-xl font-bold text-neon-cyan">⚙️ 系统设置</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        {/* Tab导航 */}
        <div className="flex border-b border-cyber-border">
          {[
            { k: 'ai', l: '🤖 AI配置' },
            { k: 'xp', l: '⭐ XP规则' },
            { k: 'achievement', l: '🏆 成就规则' },
          ].map(t => (
            <button
              key={t.k}
              onClick={() => setTab(t.k as any)}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                tab === t.k
                  ? 'text-neon-cyan border-b-2 border-neon-cyan bg-neon-cyan/5'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto flex-1">
          {saved && (
            <div className="mb-4 p-3 rounded bg-neon-green/10 border border-neon-green/30 text-neon-green text-sm">
              ✅ 设置已保存
            </div>
          )}

          {tab === 'ai' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">AI提供商</label>
                <select
                  value={aiProvider}
                  onChange={e => setAiProvider(e.target.value)}
                  className="cyber-input w-full"
                >
                  <option value="openai">OpenAI (GPT-4o)</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="minimax">MiniMax</option>
                  <option value="zhipu">智谱GLM</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">API Base URL</label>
                <input
                  type="text"
                  value={aiBaseUrl}
                  onChange={e => setAiBaseUrl(e.target.value)}
                  className="cyber-input w-full"
                  placeholder="https://api.openai.com/v1"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">API Key</label>
                <input
                  type="password"
                  value={aiApiKey}
                  onChange={e => setAiApiKey(e.target.value)}
                  className="cyber-input w-full"
                  placeholder="sk-..."
                />
              </div>
              <p className="text-xs text-gray-500">
                💡 修改AI配置后需要重启后端服务生效
              </p>
            </div>
          )}

          {tab === 'xp' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">每答对一题获得XP</label>
                <input
                  type="number"
                  value={xpPerCorrect}
                  onChange={e => setXpPerCorrect(Number(e.target.value))}
                  className="cyber-input w-full"
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">完成题目总奖励XP</label>
                <input
                  type="number"
                  value={xpPerTask}
                  onChange={e => setXpPerTask(Number(e.target.value))}
                  className="cyber-input w-full"
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">满分奖励额外XP</label>
                <input
                  type="number"
                  value={xpPerfect}
                  onChange={e => setXpPerfect(Number(e.target.value))}
                  className="cyber-input w-full"
                  min={0}
                />
              </div>
              <div className="p-4 rounded bg-cyber-dark text-sm">
                <div className="text-gray-400 mb-2">等级规则：</div>
                <div className="space-y-1 text-gray-300">
                  <div>Lv.1: 0-99 XP</div>
                  <div>Lv.2: 100-299 XP (+100 XP升级)</div>
                  <div>Lv.3: 300-599 XP (+200 XP升级)</div>
                  <div>...</div>
                </div>
              </div>
            </div>
          )}

          {tab === 'achievement' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">连续学习触发成就天数</label>
                <input
                  type="number"
                  value={streakDays}
                  onChange={e => setStreakDays(Number(e.target.value))}
                  className="cyber-input w-full"
                  min={1}
                />
              </div>
              <div className="space-y-2 text-sm">
                <div className="p-3 rounded bg-cyber-dark">
                  <div className="text-neon-yellow">🏆 初出茅庐</div>
                  <div className="text-gray-400">完成第1道题</div>
                </div>
                <div className="p-3 rounded bg-cyber-dark">
                  <div className="text-neon-purple">🎯 青铜挑战者</div>
                  <div className="text-gray-400">完成1道黄金难度题目</div>
                </div>
                <div className="p-3 rounded bg-cyber-dark">
                  <div className="text-neon-green">🔥 学习之星</div>
                  <div className="text-gray-400">连续学习{streakDays}天</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-cyber-border flex gap-3">
          <button onClick={onClose} className="cyber-button flex-1">取消</button>
          <button onClick={handleSave} className="cyber-button-primary flex-1">💾 保存设置</button>
        </div>
      </div>
    </div>
  );
}
