/**
 * 共享类型定义
 */

// ========== 用户相关 ==========
export interface User {
  id: number;
  username: string;
  nickname: string;
  role: 'student' | 'teacher' | 'admin';
  class_id?: number;
  avatar_url?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ========== 题目相关 ==========
export interface Task {
  id: number;
  title: string;
  content: string;
  source?: string;
  difficulty_level: number;
  knowledge_tags: string[];
  
  // AI拆解的三级内容
  level_1?: Level1Content;
  level_2?: Level2Content;
  level_3?: Level3Content;
  
  // 学生相关
  current_level?: number;
  is_locked?: boolean;
}

export interface Level1Content {
  core_model: string;
  analogy: string;
  real_world_example: string;
  key_terms: string[];
}

export interface Level2Content {
  steps: Array<{
    id: number;
    title: string;
    content: string;
    hint: string;
    knowledge_point?: string;
  }>;
}

export interface Level3Content {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

// ========== 进度相关 ==========
export interface StudentProgress {
  id: number;
  student_id: number;
  task_id: number;
  current_level: number;
  is_completed: boolean;
  total_time_seconds: number;
  interact_logs: string[];
  created_at: string;
  updated_at: string;
}

export interface VerificationRequest {
  task_id: number;
  student_id: number;
  level: number;
  answer: string;
  stay_seconds: number;
}

export interface VerificationResponse {
  is_correct: boolean;
  feedback: string;
  unlocked: boolean;
  next_level?: number;
  message?: string;
}

// ========== 统计相关 ==========
export interface StudentStats {
  student_id: number;
  student_name: string;
  radar_data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
    }>;
  };
  weak_points: Array<{
    knowledge_tag: string;
    pass_rate: number;
    avg_stay_seconds: number;
  }>;
  total_tasks: number;
}

export interface TeacherAlert {
  id: number;
  teacher_id: number;
  student_id: number;
  task_id: number;
  alert_type: 'stuck' | 'failed_many' | 'long_time';
  knowledge_tag?: string;
  stay_minutes?: number;
  attempt_count?: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ========== 成就相关 ==========
export interface Achievement {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: 'learning' | 'speed' | 'streak' | 'mastery' | 'social';
  condition_type: string;
  condition_value: number;
  xp_reward: number;
  display_order: number;
}

export interface StudentAchievement extends Achievement {
  unlocked_at: string;
  progress: number;
}

export interface StudentXP {
  total_xp: number;
  level: number;
  xp_in_current_level: number;
  xp_to_next_level: number;
  progress_percent: number;
}

export interface AchievementCheckResult {
  new_achievements: Array<{
    id: number;
    code: string;
    name: string;
    description: string;
    icon: string;
    xp_reward: number;
  }>;
  xp: {
    total_xp: number;
    level: number;
  };
}

export interface AchievementWithProgress {
  earned: StudentAchievement[];
  progress: Array<{
    id: number;
    code: string;
    condition_type: string;
    condition_value: number;
    progress: number;
    is_unlocked: boolean;
  }>;
  xp: StudentXP;
}
