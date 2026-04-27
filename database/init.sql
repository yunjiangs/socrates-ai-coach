-- Socrates Coach - 数据库初始化脚本
-- 版本: v1.0
-- 描述: 信奥AI启发式导学平台 - 题目拆解 + 逻辑网关

-- ============================================
-- 1. 题目表 (tasks)
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL COMMENT '题目标题',
    content TEXT NOT NULL COMMENT '原始题目内容',
    source VARCHAR(100) COMMENT '题目来源: CSP-J/S, NOIP等',
    difficulty_level INT DEFAULT 1 COMMENT '难度等级: 1-5',
    knowledge_tags JSON COMMENT '知识点标签: [DP, DFS, BFS...]',
    
    -- AI生成的拆解结构 (三级)
    ai_breakdown JSON COMMENT 'AI三段式拆解结构',
    level_1_model TEXT COMMENT 'Level 1: 核心模型分析',
    level_2_pseudo JSON COMMENT 'Level 2: 伪代码逻辑块',
    level_3_quiz JSON COMMENT 'Level 3: 互动验证题',
    
    -- 缓存
    cache_key VARCHAR(64) COMMENT '题目内容hash,用于缓存',
    cached_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_cache (cache_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 2. 学生表 (students)
-- ============================================
CREATE TABLE IF NOT EXISTS students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(50),
    role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
    avatar_url VARCHAR(255),
    class_id INT COMMENT '所属班级ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    INDEX idx_class (class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 3. 班级表 (classes)
-- ============================================
CREATE TABLE IF NOT EXISTS classes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '班级名称',
    description TEXT,
    teacher_id INT COMMENT '班主任ID',
    invite_code VARCHAR(20) UNIQUE COMMENT '邀请码',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_teacher (teacher_id),
    INDEX idx_invite (invite_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 4. 学生进度表 (student_progress)
-- ============================================
CREATE TABLE IF NOT EXISTS student_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    task_id INT NOT NULL,
    current_level INT DEFAULT 1 COMMENT '当前解锁到第几级(1-3)',
    is_completed BOOLEAN DEFAULT FALSE COMMENT '是否完成全部拆解',
    completed_at TIMESTAMP NULL,
    
    -- 行为追踪
    total_time_seconds INT DEFAULT 0 COMMENT '总用时',
   停留_log JSON COMMENT '每级停留时间记录',
    
    -- 验证题历史
    interact_logs JSON COMMENT '学生回答验证题的历史',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_progress (student_id, task_id),
    INDEX idx_student (student_id),
    INDEX idx_task (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 5. 验证记录表 (verification_logs)
-- ============================================
CREATE TABLE IF NOT EXISTS verification_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    progress_id INT NOT NULL,
    task_id INT NOT NULL,
    student_id INT NOT NULL,
    
    level_attempted INT COMMENT '尝试解锁的级别',
    student_answer TEXT NOT NULL COMMENT '学生的回答',
    ai_feedback TEXT COMMENT 'AI的反馈',
    is_correct BOOLEAN COMMENT '是否正确',
    attempt_count INT DEFAULT 1 COMMENT '该题尝试次数',
    
    stay_seconds INT DEFAULT 0 COMMENT '停留秒数',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_progress (progress_id),
    INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 6. 知识点统计表 (knowledge_stats)
-- ============================================
CREATE TABLE IF NOT EXISTS knowledge_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    task_id INT NOT NULL,
    knowledge_tag VARCHAR(50) NOT NULL COMMENT '知识点: DP, DFS, BFS...',
    
    total_attempts INT DEFAULT 0 COMMENT '总尝试次数',
    successful_attempts INT DEFAULT 0 COMMENT '成功次数',
    avg_stay_seconds INT DEFAULT 0 COMMENT '平均停留时间',
    
    pass_rate FLOAT DEFAULT 0.0 COMMENT '通过率',
    is_weak_point BOOLEAN DEFAULT FALSE COMMENT '是否薄弱点',
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_stats (student_id, task_id, knowledge_tag),
    INDEX idx_student (student_id),
    INDEX idx_knowledge (knowledge_tag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 7. 教师预警表 (teacher_alerts)
-- ============================================
CREATE TABLE IF NOT EXISTS teacher_alerts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id INT NOT NULL,
    student_id INT NOT NULL,
    task_id INT NOT NULL,
    
    alert_type ENUM('stuck', 'failed_many', 'long_time') DEFAULT 'stuck',
    knowledge_tag VARCHAR(50) COMMENT '相关知识点',
    stay_minutes INT COMMENT '停留分钟数',
    attempt_count INT COMMENT '尝试次数',
    
    message TEXT COMMENT '预警消息',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_teacher (teacher_id),
    INDEX idx_unread (teacher_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 初始化测试数据
-- ============================================

-- 插入示例班级
INSERT INTO classes (name, description, invite_code) VALUES
('信奥入门班', 'CSP-J/S入门组', 'OI2024');

-- 插入示例题目
INSERT INTO tasks (title, content, source, difficulty_level, knowledge_tags, level_1_model, level_2_pseudo, level_3_quiz) VALUES
(
    '两数之和',
    '给定一个整数数组nums和一个目标值target，找出数组中两个数的和等于目标值的两个数的下标。',
    'CSP-J 2023',
    2,
    '["数组", "哈希表", "双指针"]',
    '这是一个"查找配对"问题。本质是在一堆数里找两个能满足"加起来等于目标"的数。就像在一堆钥匙里找能开同一把锁的两把钥匙。',
    '{"steps": [{"id": 1, "title": "理解需求", "content": "找出两个数,它们加起来要等于目标值", "hint": "先想清楚:是一道题需要两个数,还是一个数配一个数?"}, {"id": 2, "title": "选择方法", "content": "用什么方法来找这两个数?", "options": ["两层循环遍历", "哈希表", "双指针"]}, {"id": 3, "title": "边界检查", "content": "需要考虑什么边界情况?", "hint": "同一个数能用两次吗?数组为空怎么办?"}]}',
    '{"question": "如果使用哈希表,key应该存什么,value应该存什么?", "options": ["key:数值,value:下标", "key:下标,value:数值", "key:数值,value:是否用过"], "correct": 0}'
);

-- 插入示例学生
INSERT INTO students (username, password_hash, nickname, role, class_id) VALUES
('teacher_demo', '$2b$10$demo_hash', '演示老师', 'teacher', 1),
('student_demo', '$2b$10$demo_hash', '演示学生', 'student', 1);

-- 插入示例进度
INSERT INTO student_progress (student_id, task_id, current_level, interact_logs) VALUES
(2, 1, 2, '[{"level": 1, "answer": "找一个数", "correct": true, "time": 30}]');
