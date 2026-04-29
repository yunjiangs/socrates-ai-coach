-- ============================================
-- Socrates Coach 数据库架构
-- 版本: v2.0
-- 描述: 信奥AI启发式导学平台
-- 字符集: utf8mb4_unicode_ci
-- ============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- tasks 表
CREATE TABLE IF NOT EXISTS tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    source VARCHAR(100),
    difficulty_level TINYINT DEFAULT 1,
    knowledge_tags JSON,
    level_1_model TEXT,
    level_2_pseudo JSON,
    level_3_quiz JSON,
    cache_key VARCHAR(64),
    cached_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_cache (cache_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- students 表
CREATE TABLE IF NOT EXISTS students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(50),
    role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
    avatar_url VARCHAR(255),
    class_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    last_active_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_class (class_id),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- classes 表
CREATE TABLE IF NOT EXISTS classes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    teacher_id INT,
    invite_code VARCHAR(20) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_teacher (teacher_id),
    INDEX idx_invite (invite_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- student_progress 表
CREATE TABLE IF NOT EXISTS student_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    task_id INT NOT NULL,
    current_level TINYINT DEFAULT 1,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    total_time_seconds INT DEFAULT 0,
    stay_log JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_progress (student_id, task_id),
    INDEX idx_student (student_id),
    INDEX idx_task (task_id),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- verification_logs 表
CREATE TABLE IF NOT EXISTS verification_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    progress_id INT NOT NULL,
    task_id INT NOT NULL,
    student_id INT NOT NULL,
    level_attempted TINYINT,
    student_answer TEXT NOT NULL,
    ai_feedback TEXT,
    is_correct BOOLEAN,
    attempt_count INT DEFAULT 1,
    stay_seconds INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_progress (progress_id),
    INDEX idx_student (student_id),
    INDEX idx_task (task_id),
    FOREIGN KEY (progress_id) REFERENCES student_progress(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- knowledge_stats 表
CREATE TABLE IF NOT EXISTS knowledge_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    task_id INT NOT NULL,
    knowledge_tag VARCHAR(50) NOT NULL,
    total_attempts INT DEFAULT 0,
    successful_attempts INT DEFAULT 0,
    avg_stay_seconds INT DEFAULT 0,
    pass_rate FLOAT DEFAULT 0.0,
    is_weak_point BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_stats (student_id, task_id, knowledge_tag),
    INDEX idx_student (student_id),
    INDEX idx_knowledge (knowledge_tag),
    INDEX idx_weak (is_weak_point),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- teacher_alerts 表
CREATE TABLE IF NOT EXISTS teacher_alerts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id INT NOT NULL,
    student_id INT NOT NULL,
    task_id INT NOT NULL,
    alert_type ENUM('stuck', 'failed_many', 'long_time') DEFAULT 'stuck',
    knowledge_tag VARCHAR(50),
    stay_minutes INT,
    attempt_count INT,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_teacher (teacher_id),
    INDEX idx_unread (teacher_id, is_read),
    FOREIGN KEY (teacher_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- achievements 表
CREATE TABLE IF NOT EXISTS achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    category ENUM('learning', 'speed', 'streak', 'mastery', 'social') DEFAULT 'learning',
    condition_type VARCHAR(50) NOT NULL,
    condition_value INT DEFAULT 1,
    xp_reward INT DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- student_achievements 表
CREATE TABLE IF NOT EXISTS student_achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    achievement_id INT NOT NULL,
    progress INT DEFAULT 0,
    is_notified BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_achievement (student_id, achievement_id),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- student_xp 表
CREATE TABLE IF NOT EXISTS student_xp (
    student_id INT PRIMARY KEY,
    total_xp INT DEFAULT 0,
    level INT DEFAULT 1,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 演示数据
-- ============================================

INSERT INTO classes (name, description, invite_code) VALUES
('信奥入门班', 'CSP-J/S入门组体验班级', 'DEMO2024'),
('信奥提高班', 'CSP-S提高组体验班级', 'DEMO2024S');

INSERT INTO students (username, password_hash, nickname, role, class_id) VALUES
('demo_teacher', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36Vy6yUXiSOFe6ZQ6z1w9Vy', '演示老师', 'teacher', 1),
('demo_student1', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36Vy6yUXiSOFe6ZQ6z1w9Vy', '小明同学', 'student', 1),
('demo_student2', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36Vy6yUXiSOFe6ZQ6z1w9Vy', '小红同学', 'student', 1);

INSERT INTO achievements (code, name, description, icon, category, condition_type, condition_value, xp_reward, display_order) VALUES
('first_problem', '初出茅庐', '完成第一道题目', '🥉', 'learning', 'problems_completed', 1, 10, 1),
('five_problems', '小试牛刀', '完成5道题目', '🥈', 'learning', 'problems_completed', 5, 30, 2),
('ten_problems', '渐入佳境', '完成10道题目', '🥇', 'learning', 'problems_completed', 10, 50, 3),
('twentyfive_problems', '学有小成', '完成25道题目', '🏅', 'learning', 'problems_completed', 25, 100, 4),
('fifty_problems', '学有所成', '完成50道题目', '🎖️', 'learning', 'problems_completed', 50, 200, 5),
('hundred_problems', '百题斩', '完成100道题目', '🏆', 'learning', 'problems_completed', 100, 500, 6),
('speed_demon', '闪电侠', '30分钟内完成一道题', '⚡', 'speed', 'solve_speed', 30, 50, 10),
('speed_expert', '极速达人', '平均每题不超过15分钟', '🚀', 'speed', 'avg_time_under', 15, 100, 11),
('three_day_streak', '坚持不懈', '连续学习3天', '📅', 'streak', 'streak_days', 3, 30, 20),
('seven_day_streak', '锲而不舍', '连续学习7天', '🔥', 'streak', 'streak_days', 7, 100, 21),
('thirty_day_streak', '持之以恒', '连续学习30天', '💎', 'streak', 'streak_days', 30, 500, 22),
('master_array', '数组大师', '完成5道数组相关题目', '🔢', 'mastery', 'tag_mastery', 5, 80, 30),
('master_dp', '动态规划入门', '完成5道动态规划题目', '📈', 'mastery', 'tag_mastery', 5, 80, 31),
('master_string', '字符串专家', '完成5道字符串题目', '📝', 'mastery', 'tag_mastery', 5, 80, 32),
('first_bronze', '青铜战士', '完成第一道青铜难度题目', '🟫', 'learning', 'difficulty_completed', 1, 15, 40),
('first_silver', '白银骑士', '完成第一道白银难度题目', '⚪', 'learning', 'difficulty_completed', 1, 30, 41),
('first_gold', '黄金勇士', '完成第一道黄金难度题目', '🟨', 'learning', 'difficulty_completed', 1, 60, 42),
('first_diamond', '钻石强者', '完成第一道钻石难度题目', '💠', 'learning', 'difficulty_completed', 1, 120, 43);

INSERT INTO student_xp (student_id, total_xp, level)
SELECT id, 0, 1 FROM students WHERE role = 'student'
ON DUPLICATE KEY UPDATE student_id = student_id;

-- 演示题目数据
INSERT INTO tasks (title, content, source, difficulty_level, knowledge_tags, level_1_model, level_2_pseudo, level_3_quiz) VALUES
('两数之和（经典）', '给定一个整数数组nums和一个目标值target，找出数组中两个数的和等于目标值的两个数的下标。

示例：
输入: nums = [2,7,11,15], target = 9
输出: [0,1]
解释: nums[0] + nums[1] = 2 + 7 = 9', 'CSP-J 基础', 2, '["数组","哈希表","双指针"]', '这是一个查找配对问题。想象你有一堆钥匙和一把锁，你要找两把能开同一把锁的钥匙。最笨的方法是一把一把试（暴力枚举），聪明的方法是用一个记录本记住已经看过的钥匙。', '{"steps":[{"id":1,"title":"理解问题","content":"在数组中找两个数，加起来要等于目标值","hint":"先想清楚：是一道题需要两个数还是一个数配一个数？"},{"id":2,"title":"选择方法","content":"用什么方法来找这两个数？","hint":"可以用两层循环，但太慢了。有没有一次就能知道的方法？"},{"id":3,"title":"边界检查","content":"需要考虑什么边界情况？","hint":"同一个数能用两次吗？数组为空怎么办？"}]}', '{"question":"如果使用哈希表，key应该存什么，value应该存什么？","options":["key:数值, value:下标","key:下标, value:数值","key:数值, value:是否用过"],"explanation":"哈希表的key用来快速查找，value用来记录位置。所以key应该是数值，value是下标。"}'),
('斐波那契数列', '斐波那契数列（Fibonacci）定义如下：
F(0) = 0
F(1) = 1
F(n) = F(n-1) + F(n-2)

输入一个正整数n，输出F(n)。

示例：
输入: 10
输出: 55', 'CSP-J 基础', 1, '["数组","动态规划","递归"]', '斐波那契数列就像兔子繁殖：第一个月有一对兔子，第二个月还是一对，但第三个月开始，每个月的兔子对数等于前两个月的总和。这是一个很有规律的数列：0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55...', '{"steps":[{"id":1,"title":"找规律","content":"观察数列：0,1,1,2,3,5,8...后一个数是前两个数的和","hint":"第3个数是1+1，第4个数是1+2..."},{"id":2,"title":"确定边界","content":"前两个数是已知的，不需要计算","hint":"F(0)=0, F(1)=1，这是起点"},{"id":3,"title":"循环求解","content":"从第3项开始，用循环算到第n项","hint":"需要几个变量来保存前两个数？"}]}', '{"question":"斐波那契数列中，F(6)等于多少？","options":["5","8","13","21"],"explanation":"F(0)=0, F(1)=1, F(2)=1, F(3)=2, F(4)=3, F(5)=5, F(6)=8"}'),
('判断质数', '质数（Prime）是指大于1的自然数中，除了1和它本身外，不能被其他自然数整除的数。

判断一个数n是否为质数。

示例：
输入: 17
输出: Yes (或 true)

输入: 12
输出: No (或 false)', 'CSP-J 基础', 1, '["数学","循环","条件判断"]', '质数就像一个孤僻的数：它只愿意和1以及自己交朋友。7是质数（只能被1和7整除），但8不是（还能被2和4整除）。判断质数的方法就是：从2开始，一个一个试，看有没有其他因数。', '{"steps":[{"id":1,"title":"理解质数定义","content":"质数是只能被1和它本身整除的数","hint":"小于2的数都不是质数"},{"id":2,"title":"选择试除范围","content":"不需要检查到n，只需要到sqrt(n)","hint":"如果n=16，根号16=4，只需要检查2,3,4"},{"id":3,"title":"优化判断","content":"遇到第一个因数就可以判定不是质数","hint":"一旦发现一个因数，就可以停止检查了"}]}', '{"question":"以下哪个数是质数？","options":["9","15","17","21"],"explanation":"9=3×3（不是质数），15=3×5（不是质数），17只能被1和17整除（是质数），21=3×7（不是质数）。答案是17。"}'),
('最大公约数（辗转相除）', '给定两个正整数a和b，求它们的最大公约数（GCD）。

最大公约数是指能够整除a和b的最大正整数。

示例：
输入: 24 18
输出: 6

解释：24和18的最大公约数是6。', 'CSP-J 基础', 2, '["数学","欧几里得算法","递归"]', '最大公约数就像两个人分东西：24个苹果和18个橘子，要分成相同的小堆且没有剩余。最大的一堆就是6个。求最大公约数有一个很巧妙的方法叫辗转相除法：用大数除以小数，取余数，再用除数除以余数，反复直到余数为0。', '{"steps":[{"id":1,"title":"理解辗转相除","content":"用大数除以小数，记录余数","hint":"24除以18，余数是6"},{"id":2,"title":"继续迭代","content":"用除数继续除以余数","hint":"现在用18除以6"},{"id":3,"title":"终止条件","content":"当余数为0时，除数就是答案","hint":"6除以6等于1，余数为0，所以答案是6"}]}', '{"question":"使用辗转相除法，求48和18的最大公约数，第一步的结果是什么？","options":["余数6","余数12","商2余12","商3"],"explanation":"48除以18等于2余12，所以余数是12。答案是余数12。"}'),
('字符串反转', '给定一个字符串，将其反转后输出。

示例：
输入: hello
输出: olleh', 'CSP-J 基础', 1, '["字符串","数组","双指针"]', '字符串反转就像照镜子：镜子里的hello会变成olleh。最简单的方法是用两个指针，一个从头开始，一个从尾开始，交换对应的字符。', '{"steps":[{"id":1,"title":"理解字符串存储","content":"字符串在内存中是连续的字符数组","hint":"hello就是 h-e-l-l-o 五个字符"},{"id":2,"title":"双指针法","content":"头指针和尾指针指向的字符交换，然后向中间移动","hint":"h和o换，e和l换"},{"id":3,"title":"终止条件","content":"当头指针>=尾指针时停止","hint":"如果字符串长度是5，只需要交换2次"}]}', '{"question":"用双指针反转abcde，交换几次后能完成？","options":["2次","3次","4次","5次"],"explanation":"5个字符，只需要交换位置2次（a<->e, b<->d），中间字符c不需要动。答案是2次。"}');

INSERT INTO student_progress (student_id, task_id, current_level, stay_log, is_completed) VALUES
(2, 1, 3, '[{"level":1,"seconds":30},{"level":2,"seconds":60}]', TRUE),
(2, 2, 2, '[{"level":1,"seconds":20}]', FALSE),
(3, 1, 1, '[{"level":1,"seconds":45}]', FALSE);