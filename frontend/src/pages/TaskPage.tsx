import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface StepData {
  id?: number;
  title: string;
  content: string;
  hint?: string;
}

interface Task {
  id: number;
  title: string;
  content: string;
  source?: string;
  difficulty_level: number;
  current_level: number;
  time_limit?: number;
  memory_limit?: number;
  level_1?: {
    core_model: string;
    analogy: string;
    real_world_example: string;
    key_terms?: string[];
  };
  level_2?: {
    steps?: StepData[];
  };
  level_3?: {
    question: string;
    options: string[];
    explanation?: string;
  };
}

// 难度映射
const DIFFICULTY_MAP: Record<number, { label: string; textColor: string; bgColor: string }> = {
  1: { label: '入门', textColor: 'text-neon-green', bgColor: 'bg-neon-green/10' },
  2: { label: '基础', textColor: 'text-gray-400', bgColor: 'bg-gray-500/10' },
  3: { label: '提高', textColor: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  4: { label: '进阶', textColor: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  5: { label: '竞赛', textColor: 'text-pink-400', bgColor: 'bg-pink-500/10' },
};

// 三级步骤配置
const STEPS = [
  { num: 1, label: '理解题意', emoji: '📜' },
  { num: 2, label: '拆解思路', emoji: '💡' },
  { num: 3, label: '编码实现', emoji: '💻' },
];

export default function TaskPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [studentAnswer, setStudentAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [staySeconds, setStaySeconds] = useState(0);
  const [xpGained, setXpGained] = useState(0);

  // 计时器
  useEffect(() => {
    const timer = setInterval(() => {
      setStaySeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 获取题目
  const { data: task, isLoading } = useQuery<Task>({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/tasks/${taskId}`);
      return res.data;
    },
    enabled: !!taskId,
  });

  // 验证答案
  const verifyMutation = useMutation({
    mutationFn: async ({ level, answer }: { level: number; answer: string }) => {
      const res = await axios.post(`${API_BASE}/progress/verify`, {
        task_id: taskId,
        student_id: 1,
        level,
        answer,
        stay_seconds: staySeconds,
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.unlocked) {
        queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      }
      if (data.xp) setXpGained(data.xp);
      setShowFeedback(true);
      setShowHint(false);
    },
  });

  const handleSubmit = (level: number) => {
    if (!studentAnswer.trim()) {
      alert('请输入你的思考或答案');
      return;
    }
    verifyMutation.mutate({ level, answer: studentAnswer });
  };

  const handleNextStep = () => {
    setShowFeedback(false);
    setStudentAnswer('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-neon-cyan animate-pulse">加载中...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">题目不存在</div>
      </div>
    );
  }

  const diff = DIFFICULTY_MAP[task.difficulty_level] || DIFFICULTY_MAP[1];
  const currentStep = Math.min(task.current_level + 1, 3);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button 
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-neon-cyan text-sm mb-2"
          >
            ← 返回题库
          </button>
          <h1 className="text-2xl font-bold cyber-text-green">
            {task.source?.split(' ')[0] || 'P' + task.id} — {task.title}
          </h1>
          <div className="flex gap-2 mt-1">
            {task.level_1 && (
              <span className="text-xs px-2 py-0.5 rounded bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30">
                {diff.label}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">当前步骤</div>
          <div className="text-2xl font-bold cyber-text">{currentStep} / 3</div>
        </div>
      </div>

      {/* 三级修炼进度条 */}
      <div className="cyber-card p-4 mb-6">
        <div className="flex items-center gap-4 text-xs">
          {STEPS.map((step, idx) => {
            const isDone = task.current_level >= step.num;
            const isActive = task.current_level + 1 === step.num;
            const stepClass = isDone ? 'bg-neon-green text-black step-done' : 
                              isActive ? 'bg-neon-cyan text-black step-active' : 
                              'bg-gray-700 text-gray-400';
            
            return (
              <React.Fragment key={step.num}>
                <div className="flex items-center gap-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${stepClass}`}>
                    {isDone ? '✓' : step.num}
                  </div>
                  <span className={isDone ? 'text-neon-green' : isActive ? 'text-neon-cyan' : 'text-gray-500'}>
                    {step.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 bg-cyber-border rounded">
                    <div 
                      className="h-full bg-neon-green rounded step-progress transition-all"
                      style={{ width: isDone ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 左侧：题目描述 */}
        <div className="lg:col-span-2 cyber-card p-5">
          <h2 className="text-lg font-bold text-neon-cyan mb-4">📜 题目描述</h2>
          <div className="space-y-3 text-sm text-gray-300">
            <p className="whitespace-pre-wrap">{task.content}</p>
            
            {task.time_limit && task.memory_limit && (
              <div className="flex items-center gap-2 text-xs text-orange-400 mt-4">
                <span>⚡</span>
                <span>{task.time_limit}ms</span>
                <span className="mx-1">/</span>
                <span>{task.memory_limit}MB</span>
              </div>
            )}
          </div>
        </div>

        {/* 右侧：学习引导 */}
        <div className="lg:col-span-3 space-y-4">
          {/* 锦囊卡片 */}
          {task.current_level >= 1 && task.level_1 && (
            <div className="cyber-card p-5 border-l-4 border-neon-purple">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">📜</span>
                <h3 className="text-lg font-bold text-purple-400">锦囊 · 理解题意</h3>
              </div>
              <div className="space-y-3 text-sm text-gray-300">
                {task.level_1.core_model && (
                  <p><strong className="text-neon-cyan">核心模型：</strong>{task.level_1.core_model}</p>
                )}
                {task.level_1.analogy && (
                  <p><strong className="text-neon-green">生活类比：</strong>{task.level_1.analogy}</p>
                )}
                {task.level_1.real_world_example && (
                  <p><strong className="text-yellow-400">现实例子：</strong>{task.level_1.real_world_example}</p>
                )}
              </div>
            </div>
          )}

          {/* 算法拆解锦囊 */}
          {task.current_level >= 2 && task.level_2?.steps && (
            <div className="cyber-card p-5 border-l-4 border-neon-purple">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">💡</span>
                <h3 className="text-lg font-bold text-purple-400">锦囊 · 拆解思路</h3>
              </div>
              <div className="space-y-3">
                {task.level_2.steps.map((step, idx) => (
                  <div key={step.id || idx} className="jin-nang">
                    <h4 className="font-bold text-neon-cyan mb-2">
                      步骤 {idx + 1}: {step.title}
                    </h4>
                    <p className="text-gray-300 text-sm mb-2">{step.content}</p>
                    {step.hint && (
                      <details className="text-sm">
                        <summary className="text-gray-500 cursor-pointer hover:text-gray-300">
                          💡 需要提示?
                        </summary>
                        <p className="mt-2 text-neon-orange">{step.hint}</p>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 检查点 */}
          {task.current_level >= 1 && (
            <div className="cyber-card p-5 border-l-4 border-neon-cyan">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">❓</span>
                <h3 className="text-lg font-bold text-neon-cyan">检查点 · 思考一下</h3>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                {task.level_3?.question || '试着解释一下你对这道题的理解。'}
              </p>
              <textarea
                className="cyber-input w-full h-20 text-sm"
                placeholder="在这里写下你的思考或答案..."
                value={studentAnswer}
                onChange={(e) => setStudentAnswer(e.target.value)}
              />
              <div className="flex gap-3 mt-3">
                <button 
                  onClick={() => handleSubmit(task.current_level)}
                  disabled={verifyMutation.isPending}
                  className="cyber-button-primary flex-1"
                >
                  {verifyMutation.isPending ? '✨ 验证中...' : '✨ 确认回答'}
                </button>
                <button 
                  onClick={() => { setShowHint(!showHint); setShowFeedback(false); }}
                  className="cyber-button text-sm"
                >
                  💡 需要提示
                </button>
              </div>
            </div>
          )}

          {/* AI反馈区 */}
          {showFeedback && (
            <div className="cyber-card p-5 border-l-4 border-neon-green ai-feedback-show">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🤖</span>
                <h3 className="text-lg font-bold text-neon-green">AI 反馈</h3>
              </div>
              <p className="text-gray-300 text-sm">
                🎉 回答正确！你的思考很清晰。
                {xpGained > 0 && <span className="text-neon-green"> +{xpGained} XP</span>}
              </p>
              <div className="mt-4 flex gap-3">
                <button 
                  onClick={handleNextStep}
                  className="cyber-button-primary text-sm"
                >
                  ✅ 进入下一步 →
                </button>
              </div>
            </div>
          )}

          {/* 提示区 */}
          {showHint && (
            <div className="cyber-card p-5 border-l-4 border-yellow-500/50 hint-slide">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">💡</span>
                <h3 className="text-lg font-bold text-yellow-400">提示</h3>
              </div>
              <p className="text-gray-300 text-sm">
                仔细思考题目中的关键信息，尝试用生活中的例子来理解。
              </p>
            </div>
          )}

          {/* Level 3: 验证理解 */}
          {task.current_level >= 3 && task.level_3 && (
            <div className="cyber-card p-5 border-l-4 border-neon-green">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🎯</span>
                <h3 className="text-lg font-bold text-neon-green">验证理解</h3>
              </div>
              <p className="text-gray-300 text-sm mb-4">{task.level_3.question}</p>
              <div className="space-y-2">
                {task.level_3.options?.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => setStudentAnswer(option)}
                    className={`w-full text-left p-3 rounded-lg border transition-all text-sm ${
                      studentAnswer === option 
                        ? 'border-neon-cyan bg-neon-cyan/10 text-white' 
                        : 'border-gray-700 hover:border-gray-500 text-gray-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <button
                onClick={() => handleSubmit(3)}
                disabled={verifyMutation.isPending}
                className="cyber-button-primary w-full mt-4"
              >
                {verifyMutation.isPending ? '验证中...' : '提交验证'}
              </button>
            </div>
          )}

          {/* 底部操作按钮 */}
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/')}
              className="cyber-button text-sm text-gray-500"
            >
              ← 上一步
            </button>
            <div className="flex-1" />
            <button className="cyber-button text-sm text-gray-400">
              📝 查看题解
            </button>
            <button className="cyber-button-primary text-sm">
              ⭐ 收藏题目
            </button>
          </div>
        </div>
      </div>

      {/* 完成状态 */}
      {task.current_level >= 3 && (
        <div className="cyber-card p-6 text-center border-neon-green/50 mt-6">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-neon-green mb-2">
            恭喜完成拆解！
          </h2>
          <p className="text-gray-400">
            现在你可以尝试自己实现代码了
          </p>
        </div>
      )}
    </div>
  );
}
