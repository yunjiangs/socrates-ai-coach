-- 苏格拉底AI教练 - 数据库设计
-- Socrates AI Coach Database Schema

-- ============================================
-- 1. 用户表（学生/老师）
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
    nickname VARCHAR(50),
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================
-- 2. 题目表
-- ============================================
CREATE TABLE IF NOT EXISTS problems (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    difficulty ENUM('bronze', 'silver', 'gold', 'diamond', 'master') DEFAULT 'bronze',
    source VARCHAR(100),  -- 来源：如"CSP-J 2023"
    time_limit INT DEFAULT 1000,  -- 时间限制(ms)
    memory_limit INT DEFAULT 256,  -- 内存限制(MB)
    tags JSON,  -- 知识点标签，如["数组","动态规划"]
    test_cases JSON,  -- 测试用例
    hint TEXT,  -- 题目提示
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- 3. 拆解步骤表
-- ============================================
CREATE TABLE IF NOT EXISTS breakdown_steps (
    id INT PRIMARY KEY AUTO_INCREMENT,
    problem_id INT REFERENCES problems(id) ON DELETE CASCADE,
    step_order INT NOT NULL,  -- 步骤顺序
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,  -- 步骤内容
    hint TEXT,  -- 卡住时的提示
    checkpoint_question TEXT,  -- 检查点问题
    checkpoint_answer TEXT,  -- 期望的学生回答
    is_required BOOLEAN DEFAULT TRUE,  -- 是否必须完成才能解锁下一步
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. 学生进度表
-- ============================================
CREATE TABLE IF NOT EXISTS student_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    problem_id INT REFERENCES problems(id) ON DELETE CASCADE,
    current_step_id INT,  -- 当前步骤ID
    step_status ENUM('not_started', 'in_progress', 'completed', 'stuck') DEFAULT 'not_started',
    stay_seconds INT DEFAULT 0,  -- 在当前步骤停留的时间
    attempts_count INT DEFAULT 0,  -- 尝试次数
    student_answer TEXT,  -- 学生当前步骤的回答
    feedback TEXT,  -- AI给出的反馈
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_progress (user_id, problem_id)
);

-- ============================================
-- 5. 学生答案记录表（用于AI反馈）
-- ============================================
CREATE TABLE IF NOT EXISTS answer_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    progress_id INT REFERENCES student_progress(id) ON DELETE CASCADE,
    step_id INT REFERENCES breakdown_steps(id),
    student_answer TEXT NOT NULL,
    ai_feedback TEXT,  -- AI的反馈
    is_correct BOOLEAN,  -- 是否正确
    feedback_type ENUM('encourage', 'hint', 'error') DEFAULT 'hint',  -- 反馈类型
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. 班级表（老师用）
-- ============================================
CREATE TABLE IF NOT EXISTS classes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    teacher_id INT REFERENCES users(id),
    invite_code VARCHAR(20) UNIQUE,  -- 邀请码，学生加入用
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. 班级学生关联表
-- ============================================
CREATE TABLE IF NOT EXISTS class_students (
    class_id INT REFERENCES classes(id) ON DELETE CASCADE,
    student_id INT REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (class_id, student_id)
);

-- ============================================
-- 8. 思维图谱表
-- ============================================
CREATE TABLE IF NOT EXISTS thinking_maps (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    problem_id INT REFERENCES problems(id) ON DELETE CASCADE,
    total_steps INT,
    completed_steps INT,
    completion_rate FLOAT,
    weak_points JSON,  -- 薄弱知识点
    strong_points JSON,  -- 掌握知识点
    ai_suggestion TEXT,  -- AI建议
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_map (user_id, problem_id)
);

-- ============================================
-- 9. 老师预警表
-- ============================================
CREATE TABLE IF NOT EXISTS teacher_alerts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id INT REFERENCES users(id),
    student_id INT REFERENCES users(id),
    problem_id INT REFERENCES problems(id),
    step_id INT REFERENCES breakdown_steps(id),
    alert_type ENUM('stuck', 'long_time', 'wrong_pattern') DEFAULT 'stuck',
    stay_minutes INT,  -- 停留分钟数
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 10. 题目收藏表（学生收藏题目）
-- ============================================
CREATE TABLE IF NOT EXISTS problem_favorites (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    problem_id INT REFERENCES problems(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, problem_id)
);

-- ============================================
-- 索引
-- ============================================
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_tags ON problems(tags(50));
CREATE INDEX idx_progress_user ON student_progress(user_id);
CREATE INDEX idx_progress_problem ON student_progress(problem_id);
CREATE INDEX idx_alerts_teacher ON teacher_alerts(teacher_id);
CREATE INDEX idx_alerts_unread ON teacher_alerts(teacher_id, is_read);

-- ============================================
-- 初始化测试数据
-- ============================================

-- 插入示例题目
INSERT INTO problems (title, description, difficulty, tags) VALUES
('两数之和', '给定一个数组和一个目标值，找出数组中两个数之和等于目标值的两个数的下标。', 'silver', '["数组", "哈希表", "双指针"]'),
('斐波那契数列', '输入n，求斐波那契数列的第n项。f(1)=1, f(2)=1, f(n)=f(n-1)+f(n-2)', 'bronze', '["数组", "动态规划"]'),
('快速排序', '实现快速排序算法，对给定数组进行排序', 'silver', '["排序", "分治"]');

-- 插入拆解步骤（针对两数之和）
INSERT INTO breakdown_steps (problem_id, step_order, title, content, hint, checkpoint_question) VALUES
(1, 1, '理解问题', '在数组中找两个数，加起来等于目标值', '如果口算，你会怎么做？', '怎么确定这两个数的位置？'),
(1, 2, '暴力枚举', '遍历所有可能的两个数的组合', '两层循环怎么写？', '时间复杂度是多少？'),
(1, 3, '哈希优化', '用哈希表存储已经遍历过的数', '哈希表能帮我们快速查什么？', '哈希表的key和value分别存什么？');

-- 插入拆解步骤（针对斐波那契）
INSERT INTO breakdown_steps (problem_id, step_order, title, content, hint, checkpoint_question) VALUES
(2, 1, '理解规律', '斐波那契数列从第三项开始，每一项等于前两项之和', '试试用手写出前5项：1,1,2,?,?', '斐波那契的核心规律是什么？'),
(2, 2, '确定边界', '前两项是已知的，不需要计算', '第1项和第2项分别是多少？', '边界条件是什么？'),
(2, 3, '循环求解', '用循环从第3项算到第n项', '需要几个变量？', '循环的起始和结束是什么？');
