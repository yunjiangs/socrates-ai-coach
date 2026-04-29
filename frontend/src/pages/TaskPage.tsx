import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// 难度映射：数字 → 显示文字 + 颜色
const DIFFICULTY_MAP: Record<number, { label: string; textColor: string; bgColor: string; borderColor: string }> = {
  1: { label: '青铜', textColor: 'text-amber-400', bgColor: 'bg-amber-400/10', borderColor: 'border-amber-400/30' },
  2: { label: '白银', textColor: 'text-gray-300', bgColor: 'bg-gray-400/10', borderColor: 'border-gray-400/30' },
  3: { label: '黄金', textColor: 'text-yellow-400', bgColor: 'bg-yellow-400/10', borderColor: 'border-yellow-400/30' },
  4: { label: '钻石', textColor: 'text-cyan-300', bgColor: 'bg-cyan-300/10', borderColor: 'border-cyan-300/30' },
};

// 三级步骤
const STEPS = [
  { num: 1, label: '理解题意', emoji: '📜' },
  { num: 2, label: '拆解思路', emoji: '💡' },
  { num: 3, label: '编码实现', emoji: '💻' },
];

// 模拟学生ID（实际应从登录态获取）
const DEMO_STUDENT_ID = 2;

export default function TaskPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [studentAnswer, setStudentAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [staySeconds, setStaySeconds] = useState(0);
  const [hint, setHint] = useState('');
  const [solution, setSolution] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [nextLevel, setNextLevel] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [showAchievement, setShowAchievement] = useState(false);
  const [newAchievement, setNewAchievement] = useState<any>(null);

  // 计时器
  useEffect(() => {
    const timer = setInterval(() => setStaySeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // 获取题目详情
  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId, DEMO_STUDENT_ID],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/tasks/${taskId}?student_id=${DEMO_STUDENT_ID}`);
      return res.data;
    },
    enabled: !!taskId,
  });

  // 验证答案 mutation
  const verifyMutation = useMutation({
    mutationFn: async ({ level, answer }: { level: number; answer: string }) => {
      const res = await axios.post(`${API_BASE}/progress/verify`, {
        task_id: taskId,
        student_id: DEMO_STUDENT_ID,
        level,
        answer,
        stay_seconds: staySeconds,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setFeedback(data.feedback || '');
      setIsCorrect(data.is_correct);
      setUnlocked(data.unlocked);
      setNextLevel(data.next_level || 0);
      setXpGained(data.xp_gained || 0);
      setShowFeedback(true);
      setShowHint(false);
      if (data.is_completed) {
        queryClient.invalidateQueries({ queryKey: ['task', taskId, DEMO_STUDENT_ID] });
        // 完成后检查是否解锁了新成就
        checkNewAchievements();
      }
    },
  });

  // 获取提示 mutation
  const hintMutation = useMutation({
    mutationFn: async (level: number) => {
      const res = await axios.post(`${API_BASE}/progress/hint`, {
        task_id: taskId,
        student_id: DEMO_STUDENT_ID,
        level,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setHint(data.hint || '暂无提示');
      setShowHint(true);
      setShowFeedback(false);
    },
  });

  // 获取题解 mutation
  const solutionMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.get(`${API_BASE}/progress/solution/${taskId}?student_id=${DEMO_STUDENT_ID}`);
      return res.data;
    },
    onSuccess: (data) => {
      setSolution(data.solution || '题解暂不可用');
      setShowSolution(true);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || '无法获取题解');
    },
  });

  // 获取已解锁成就 mutation
  const achievementsQuery = useQuery({
    queryKey: ['achievements', DEMO_STUDENT_ID],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/achievements/student/${DEMO_STUDENT_ID}`);
      return res.data;
    },
    enabled: !!taskId,
  });

  // 检查是否解锁了新成就
  const checkNewAchievements = async () => {
    try {
      const res = await axios.get(`${API_BASE}/achievements/student/${DEMO_STUDENT_ID}`);
      const achievements = res.data.achievements || [];
      // 找出刚刚解锁的成就（难度不高但未完成的）
      const justUnlocked = achievements.find((a: any) => a.unlocked && !a.claimed);
      if (justUnlocked) {
        setNewAchievement(justUnlocked);
        setShowAchievement(true);
      }
    } catch { /* ignore */ }
  };

  // 收藏 mutation
  const favoriteMutation = useMutation({
    mutationFn: async (action: 'favorite' | 'unfavorite') => {
      const res = await axios.post(`${API_BASE}/progress/favorite`, {
        student_id: DEMO_STUDENT_ID,
        task_id: taskId,
        action,
      });
      return res.data;
    },
    onSuccess: (_, action) => {
      setIsFavorited(action === 'favorite');
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
    setStaySeconds(0);
    queryClient.invalidateQueries({ queryKey: ['task', taskId, DEMO_STUDENT_ID] });
  };

  const handleShowHint = (level: number) => {
    hintMutation.mutate(level);
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
  const currentLevel = task.current_level || 0;

  // 判断题目是否完成
  const isCompleted = task.is_completed;

  // L3 特殊：编码实现
  const isLevel3Active = currentLevel >= 3 && !isCompleted;

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
            <span className={`text-xs px-2 py-0.5 rounded ${diff.bgColor} ${diff.textColor} border ${diff.borderColor}`}>
              {diff.label}
            </span>
            {task.knowledge_tags?.slice(0, 2).map((tag: string, idx: number) => (
              <span key={idx} className="text-xs px-2 py-0.5 rounded bg-neon-purple/10 text-neon-purple">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">
            {currentLevel === 0 ? '未开始' : currentLevel >= 3 ? '已完成' : `进行中`}
          </div>
          <div className="text-2xl font-bold cyber-text">
            {isCompleted ? '✓' : currentLevel}/3
          </div>
        </div>
      </div>

      {/* 三级修炼进度条 */}
      <div className="cyber-card p-4 mb-6">
        <div className="flex items-center gap-4 text-xs">
          {STEPS.map((step, idx) => {
            const isDone = isCompleted || currentLevel > step.num;
            const isActive = !isCompleted && currentLevel + 1 === step.num;
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
                      className="h-full bg-neon-green rounded transition-all"
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
          </div>
        </div>

        {/* 右侧：学习引导 */}
        <div className="lg:col-span-3 space-y-4">
          {/* L1: 理解题意 */}
          <div className="cyber-card p-5 border-l-4 border-neon-purple">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">📜</span>
              <h3 className="text-lg font-bold text-purple-400">锦囊 · 理解题意</h3>
              {currentLevel < 1 && (
                <span className="text-xs text-gray-500 ml-2">（解锁后可见）</span>
              )}
            </div>
            {task.level_1?.core_model ? (
              <div className="space-y-3 text-sm text-gray-300">
                <p><strong className="text-neon-cyan">核心模型：</strong>{task.level_1.core_model}</p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">完成当前级别后解锁</p>
            )}
          </div>

          {/* L2: 算法拆解 */}
          {task.level_2 && (
            <div className="cyber-card p-5 border-l-4 border-neon-purple">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">💡</span>
                <h3 className="text-lg font-bold text-purple-400">锦囊 · 拆解思路</h3>
              </div>
              <div className="space-y-3">
                {(task.level_2.steps || []).map((step: any, idx: number) => (
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

          {/* L3: 编码实现 */}
          {isLevel3Active && (
            <div className="cyber-card p-5 border-l-4 border-neon-green">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">💻</span>
                <h3 className="text-lg font-bold text-neon-green">编码实现</h3>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                请写出你的代码实现（可参考上方算法步骤）：
              </p>
              <textarea
                className="cyber-input w-full h-32 font-mono text-sm"
                placeholder="// 在这里输入你的代码..."
                value={studentAnswer}
                onChange={(e) => setStudentAnswer(e.target.value)}
              />
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => handleSubmit(3)}
                  disabled={verifyMutation.isPending}
                  className="cyber-button-primary flex-1"
                >
                  {verifyMutation.isPending ? '✨ 校验中...' : '✅ 确认代码'}
                </button>
                <button
                  onClick={() => handleShowHint(3)}
                  className="cyber-button text-sm"
                >
                  💡 需要提示
                </button>
              </div>
            </div>
          )}

          {/* 检查点（Level 1 & 2 的答题区） */}
          {!isLevel3Active && currentLevel >= 1 && !isCompleted && (
            <div className="cyber-card p-5 border-l-4 border-neon-cyan">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">❓</span>
                <h3 className="text-lg font-bold text-neon-cyan">
                  检查点 · {currentLevel === 1 ? '理解题意' : '拆解思路'}
                </h3>
              </div>

              {task.level_3?.question ? (
                <>
                  <p className="text-gray-300 text-sm mb-4">{task.level_3.question}</p>
                  <div className="space-y-2 mb-4">
                    {task.level_3.options?.map((option: string, idx: number) => (
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
                </>
              ) : (
                <textarea
                  className="cyber-input w-full h-20 text-sm"
                  placeholder="在这里写下你的思考或答案..."
                  value={studentAnswer}
                  onChange={(e) => setStudentAnswer(e.target.value)}
                />
              )}

              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => handleSubmit(currentLevel)}
                  disabled={verifyMutation.isPending}
                  className="cyber-button-primary flex-1"
                >
                  {verifyMutation.isPending ? '✨ 验证中...' : '✨ 确认回答'}
                </button>
                <button
                  onClick={() => handleShowHint(currentLevel)}
                  disabled={hintMutation.isPending}
                  className="cyber-button text-sm"
                >
                  {hintMutation.isPending ? '...' : '💡 需要提示'}
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
              <p className="text-gray-300 text-sm">{feedback}</p>
              {xpGained > 0 && (
                <p className="text-neon-green text-sm mt-1">+{xpGained} XP</p>
              )}

              <div className="mt-4 flex gap-3">
                {unlocked && nextLevel < 3 && !isCompleted && (
                  <button
                    onClick={handleNextStep}
                    className="cyber-button-primary text-sm"
                  >
                    ✅ 进入下一步 →
                  </button>
                )}
                {isCorrect && isCompleted && (
                  <div className="text-neon-green text-sm">
                    🎉 恭喜完成全部拆解！
                  </div>
                )}
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
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{hint}</p>
            </div>
          )}

          {/* 题解弹窗 */}
          {showSolution && (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
              <div className="cyber-card max-w-2xl w-full max-h-[80vh] overflow-auto p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-neon-green">📝 题解</h3>
                  <button
                    onClick={() => setShowSolution(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                  {solution}
                </pre>
              </div>
            </div>
          )}

          {/* 底部操作按钮 */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/')}
              className="cyber-button text-sm text-gray-500"
            >
              ← 返回
            </button>
            <div className="flex-1" />
            {currentLevel >= 1 && !isCompleted && (
              <>
                <button
                  onClick={() => solutionMutation.mutate()}
                  disabled={solutionMutation.isPending}
                  className="cyber-button text-sm"
                >
                  📝 查看题解
                </button>
                <button
                  onClick={() => favoriteMutation.mutate(isFavorited ? 'unfavorite' : 'favorite')}
                  className={`cyber-button-primary text-sm ${isFavorited ? 'text-neon-yellow' : ''}`}
                >
                  {isFavorited ? '⭐ 已收藏' : '☆ 收藏'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 完成状态 */}
      {isCompleted && (
        <div className="cyber-card p-6 text-center border-neon-green/50 mt-6">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-neon-green mb-2">
            恭喜完成拆解！
          </h2>
          <p className="text-gray-400 mb-4">
            现在你可以尝试自己实现代码了
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => solutionMutation.mutate()}
              className="cyber-button text-sm"
            >
              📝 查看题解
            </button>
            <button
              onClick={() => navigate('/')}
              className="cyber-button-primary text-sm"
            >
              选择下一题
            </button>
          </div>
        </div>
      )}
      {/* 成就解锁弹窗 */}
      {showAchievement && newAchievement && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 achievement-unlock-modal">
          <div className="cyber-card max-w-sm w-full p-8 text-center">
            <div className="text-6xl mb-4 achievement-icon">🏆</div>
            <div className="text-xs text-neon-yellow uppercase tracking-widest mb-2">成就解锁</div>
            <h3 className="text-2xl font-bold text-neon-cyan mb-2">{newAchievement.name}</h3>
            <p className="text-gray-400 text-sm mb-6">{newAchievement.description}</p>
            <button
              onClick={() => setShowAchievement(false)}
              className="cyber-button-primary w-full"
            >
              太棒了！
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
