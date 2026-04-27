import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface Task {
  id: number;
  title: string;
  content: string;
  difficulty_level: number;
  current_level: number;
  level_1?: {
    core_model: string;
    analogy: string;
    real_world_example: string;
    key_terms: string[];
  };
  level_2?: any;
  level_3?: {
    question: string;
    options: string[];
    explanation: string;
  };
}

export default function TaskPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [studentAnswer, setStudentAnswer] = useState('');
  const [staySeconds, setStaySeconds] = useState(0);

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
        student_id: 1, // TODO: 从登录状态获取
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
      alert(data.feedback + (data.message || ''));
      setStudentAnswer('');
    },
  });

  const handleSubmit = (level: number) => {
    if (!studentAnswer.trim()) {
      alert('请输入你的理解');
      return;
    }
    verifyMutation.mutate({ level, answer: studentAnswer });
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-neon-cyan mb-4"
        >
          ← 返回
        </button>
        <h1 className="text-3xl font-bold cyber-text-green">{task.title}</h1>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-gray-500">难度: {task.difficulty_level}</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">渡劫进度:</span>
            <div className="progress-bar w-32">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${(task.current_level / 3) * 100}%` }}
              />
            </div>
            <span className="text-neon-green">{task.current_level}/3</span>
          </div>
        </div>
      </div>

      {/* 题目内容 */}
      <div className="cyber-card p-6 mb-8">
        <h2 className="text-xl font-bold text-neon-cyan mb-4">📝 题目</h2>
        <p className="text-gray-300 whitespace-pre-wrap">{task.content}</p>
      </div>

      {/* Level 1: 逻辑建模 */}
      <div className={`mb-8 ${task.current_level < 1 ? 'locked' : ''}`}>
        <div className="cyber-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-neon-purple">
              🌟 第一重：逻辑建模 {task.current_level < 1 && '🔒'}
            </h2>
            {task.current_level >= 1 && (
              <span className="text-xs px-2 py-1 rounded bg-neon-green/20 text-neon-green">
                ✓ 已解锁
              </span>
            )}
          </div>
          
          {task.current_level >= 1 && task.level_1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm text-gray-400 mb-1">核心模型</h3>
                <p className="text-lg text-neon-cyan">{task.level_1.core_model}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-400 mb-1">生活类比</h3>
                <p className="text-gray-300">{task.level_1.analogy}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-400 mb-1">现实例子</h3>
                <p className="text-gray-300">{task.level_1.real_world_example}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Level 2: 算法拆解 */}
      <div className={`mb-8 ${task.current_level < 2 ? 'locked' : ''}`}>
        <div className="cyber-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-neon-purple">
              ⚡ 第二重：算法拆解 {task.current_level < 2 && '🔒'}
            </h2>
            {task.current_level >= 2 && (
              <span className="text-xs px-2 py-1 rounded bg-neon-green/20 text-neon-green">
                ✓ 已解锁
              </span>
            )}
          </div>
          
          {task.current_level >= 2 && task.level_2 && (
            <div className="space-y-4">
              {task.level_2.steps?.map((step: any, index: number) => (
                <div key={step.id} className="jin-nang">
                  <h3 className="font-bold text-neon-cyan mb-2">
                    锦囊 {index + 1}: {step.title}
                  </h3>
                  <p className="text-gray-300 mb-2">{step.content}</p>
                  <details className="text-sm">
                    <summary className="text-gray-500 cursor-pointer hover:text-gray-300">
                      💡 需要提示?
                    </summary>
                    <p className="mt-2 text-neon-orange">{step.hint}</p>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Level 3: 互动验证 */}
      <div className={`mb-8 ${task.current_level < 3 ? 'locked' : ''}`}>
        <div className="cyber-card p-6 border-neon-green/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-neon-purple">
              🎯 第三重：验证理解 {task.current_level < 3 && '🔒'}
            </h2>
            {task.current_level >= 3 && (
              <span className="text-xs px-2 py-1 rounded bg-neon-green/20 text-neon-green">
                ✓ 已解锁
              </span>
            )}
          </div>
          
          {task.current_level >= 3 && task.level_3 && (
            <div className="space-y-6">
              <p className="text-lg text-neon-cyan">{task.level_3.question}</p>
              
              <div className="space-y-3">
                {task.level_3.options?.map((option: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setStudentAnswer(option)}
                    className={`w-full text-left p-4 rounded-lg border transition-all
                      ${studentAnswer === option 
                        ? 'border-neon-cyan bg-neon-cyan/10' 
                        : 'border-gray-700 hover:border-gray-500'
                      }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => handleSubmit(3)}
                  disabled={verifyMutation.isPending}
                  className="cyber-button-primary flex-1"
                >
                  {verifyMutation.isPending ? '验证中...' : '提交验证'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 完成状态 */}
      {task.current_level >= 3 && (
        <div className="cyber-card p-6 text-center border-neon-green/50">
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
