# 苏格拉底AI教练 - 核心拆解引擎
# Socratic AI Coach - Question Breakdown Engine
# 定位：不做判题机，做高价值解惑师

import os
import json
from typing import List, Dict, Optional
from dataclasses import dataclass
from enum import Enum

# ========== 配置 ==========
BRAND_ORANGE = "#FF6B35"
BRAND_TEAL = "#00CECE"

# ========== 数据结构 ==========
class Difficulty(Enum):
    BRONZE = "bronze"      # 普及组初赛
    SILVER = "silver"     # 普及组复赛
    GOLD = "gold"         # 提高组初赛
    DIAMOND = "diamond"    # 提高组复赛
    MASTER = "master"      # 省选/国家队

class KnowledgePoint(Enum):
    # 基础
    DATA_STRUCTURE = "数据结构"
    ARRAY = "数组"
    STRING = "字符串"
    # 搜索
    DFS = "深度优先搜索"
    BFS = "广度优先搜索"
    BACKTRACK = "回溯搜索"
    # 基础算法
    SORT = "排序"
    BINARY_SEARCH = "二分查找"
    TWO_POINTERS = "双指针"
    # DP
    DYNAMIC_PROGRAMMING = "动态规划"
    # 图论
    GRAPH = "图论基础"
    TREE = "树基础"
    # 数学
    COMBINATORICS = "排列组合"
    NUMBER_THEORY = "数论"

@dataclass
class Step:
    """拆解步骤"""
    step_id: int
    title: str
    content: str
    hint: str
    checkpoint_question: str
    is_completed: bool = False
    student_answer: Optional[str] = None

@dataclass
class ProblemBreakdown:
    """题目完整拆解"""
    problem_title: str
    difficulty: str
    knowledge_points: List[str]
    
    # 三段式拆解
    logic_layer: str          # 第一层：逻辑建模
    algo_layer: List[Step]   # 第二层：算法拆解（多个步骤）
    code_hints: str           # 第三层：代码提示
    
    # 思维图谱
    thinking_map: Dict
    
    # 总完成度
    completion_rate: float = 0.0

# ========== 苏格拉底Prompt模板 ==========
SYSTEM_PROMPT = """你是一位資深的信息学奥赛教练，擅长把复杂的算法问题用通俗易懂的方式解释给学生。

你的风格是"苏格拉底式教学"：
- 不直接给答案
- 用类比和生活例子解释概念
- 把大问题拆成小问题
- 引导学生自己思考

输出格式必须是JSON，方便程序处理。"""

# ========== 第一层：逻辑建模Prompt ==========
LOGIC_LAYER_PROMPT = """题目：{problem_text}
难度：{difficulty}
知识点：{knowledge_points}

请用JSON格式输出"逻辑建模层"内容：

{{
    "analogy_intro": "用一个生活类比介绍这个问题背景（50字以内）",
    "model_explanation": "把这个问题的数学/逻辑模型用人话解释清楚",
    "key_terms": ["关键术语1", "关键术语2", ...],
    "real_world_example": "一个现实世界的例子来理解这个问题"
}}

要求：
- 类比要贴近小学生/初中生生活
- 不要用编程术语，用生活语言
"""

# ========== 第二层：算法拆解Prompt ==========
ALGO_LAYER_PROMPT = """题目：{problem_text}
难度：{difficulty}

请把这个问题的解题过程拆成3-5个小步骤，每个步骤要有：
1. 步骤标题（简洁）
2. 具体要做什么
3. 一个提示（当学生卡住时用）

输出JSON格式：

{{
    "steps": [
        {{
            "step_id": 1,
            "title": "步骤1标题",
            "content": "具体要做什么，用人话解释",
            "hint": "当学生卡住时的提示",
            "checkpoint": "一个检查学生是否理解的问题"
        }},
        ...
    ]
}}"""

# ========== 第三层：代码提示Prompt ==========
CODE_HINT_PROMPT = """题目：{problem_text}
难度：{difficulty}

请给出解题的代码提示层：
- 只给关键函数/核心逻辑
- 留空让学生填空
- 用//注释标出需要学生填写的地方

输出JSON格式：

{{
    "pseudo_code": "伪代码或关键函数签名",
    "fill_blanks": [
        {{
            "line_number": 3,
            "comment": "这里需要学生填写什么",
            "expected_answer": "正确答案或思路"
        }}
    ],
    "full_code": "完整可运行代码（最后才展示）"
}}"""

# ========== 验证检查点Prompt ==========
CHECKPOINT_PROMPT = """学生的答案是：{student_answer}
正确思路应该是：{correct_approach}

请判断学生的理解是否正确。如果正确，给出鼓励和下一步引导；如果不正确，给出针对性提示。

输出JSON格式：

{{
    "is_correct": true/false,
    "feedback": "针对学生答案的反馈",
    "encouragement": "如果正确，给的鼓励",
    "hint": "如果不正确，给的下一个提示"
}}"""

# ========== 苏格拉底拆解引擎 ==========
class SocraticEngine:
    """苏格拉底AI教练引擎"""
    
    def __init__(self):
        self.conversation_history = []
    
    def breakdown_problem(self, problem_text: str, difficulty: str, 
                          knowledge_points: List[str]) -> ProblemBreakdown:
        """
        核心方法：对一道题目进行三段式拆解
        
        Args:
            problem_text: 题目描述或URL
            difficulty: 难度级别
            knowledge_points: 涉及的知识点列表
        
        Returns:
            ProblemBreakdown: 完整的拆解结果
        """
        # 这里需要接入GPT/Claude API
        # 目前先返回结构化模板
        
        breakdown = ProblemBreakdown(
            problem_title=problem_text[:50],
            difficulty=difficulty,
            knowledge_points=knowledge_points,
            logic_layer="",
            algo_layer=[],
            code_hints="",
            思维图谱={}
        )
        
        return breakdown
    
    def generate_checkpoint_feedback(self, step: Step, 
                                    student_answer: str) -> dict:
        """
        生成检查点反馈
        
        Args:
            step: 当前步骤
            student_answer: 学生的回答
        
        Returns:
            dict: 包含is_correct, feedback, hint
        """
        feedback = {
            "is_correct": False,
            "feedback": "",
            "encouragement": "",
            "hint": ""
        }
        
        # 这里需要GPT分析学生回答
        # 简化版：检查是否包含关键词
        
        keywords = ["循环", "遍历", "if", "判断", "return"]
        if any(kw in student_answer for kw in keywords):
            feedback["is_correct"] = True
            feedback["feedback"] = "你的思路是对的！继续往下走 👏"
            feedback["encouragement"] = "看来你理解了这个问题，继续挑战下一关！"
        else:
            feedback["is_correct"] = False
            feedback["hint"] = f"提示：{step.hint}"
        
        return feedback
    
    def track_behavior(self, step_id: int, stay_seconds: int) -> dict:
        """
        追踪学生行为，决定是否触发反向Push
        
        Returns:
            dict: 包含need_nudge, nudge_message
        """
        if stay_seconds > 120:  # 超过2分钟
            return {
                "need_nudge": True,
                "nudge_message": "卡住了吗？让我帮你理一理..."
            }
        return {"need_nudge": False}
    
    def generate_thinking_report(self, steps: List[Step]) -> dict:
        """
        生成思维图谱报告
        """
        completed = sum(1 for s in steps if s.is_completed)
        total = len(steps)
        
        return {
            "total_steps": total,
            "completed_steps": completed,
            "completion_rate": completed / total if total > 0 else 0,
            "weak_points": ["动态规划的dp状态定义"],
            "strong_points": ["边界条件判断"],
            "suggestion": "建议重点复习动态规划的状态定义部分"
        }

# ========== 示例题目 ==========
SAMPLE_PROBLEMS = {
    "fibonacci": {
        "title": "斐波那契数列",
        "description": "输入n，求斐波那契数列的第n项。f(1)=1, f(2)=1, f(n)=f(n-1)+f(n-2)",
        "difficulty": Difficulty.BRONZE,
        "knowledge_points": [KnowledgePoint.ARRAY],
        "steps": [
            Step(1, "理解规律", "斐波那契数列从第三项开始，每一项等于前两项之和", 
                 "试试用手写出前5项：1,1,2,?,?", "斐波那契的核心规律是什么？"),
            Step(2, "确定边界", "前两项是已知的，不需要计算", 
                 "第1项和第2项分别是多少？", "边界条件是什么？"),
            Step(3, "循环求解", "用循环从第3项算到第n项", 
                 "需要几个变量？", "循环的起始和结束是什么？"),
        ]
    },
    "two_sum": {
        "title": "两数之和",
        "description": "给定一个数组和一个目标值，找出数组中两个数之和等于目标值的两个数的下标",
        "difficulty": Difficulty.SILVER,
        "knowledge_points": [KnowledgePoint.ARRAY, KnowledgePoint.TWO_POINTERS],
        "steps": [
            Step(1, "理解问题", "在数组中找两个数，加起来等于目标值", 
                 "如果口算，你会怎么做？", "怎么确定这两个数的位置？"),
            Step(2, "暴力枚举", "遍历所有可能的两个数的组合", 
                 "两层循环怎么写？", "时间复杂度是多少？"),
            Step(3, "哈希优化", "用哈希表存储已经遍历过的数", 
                 "哈希表能帮我们快速查什么？", "哈希表的key和value分别存什么？"),
        ]
    }
}

# ========== 主程序测试 ==========
if __name__ == "__main__":
    engine = SocraticEngine()
    
    # 测试拆解一道题
    problem = SAMPLE_PROBLEMS["fibonacci"]
    
    print("=" * 50)
    print(f"题目：{problem['title']}")
    print(f"描述：{problem['description']}")
    print(f"难度：{problem['difficulty'].value}")
    print(f"知识点：{[kp.value for kp in problem['knowledge_points']]}")
    print("=" * 50)
    
    print("\n📚 拆解步骤：")
    for step in problem['steps']:
        print(f"\n第{step.step_id}步：{step.title}")
        print(f"  内容：{step.content}")
        print(f"  提示：{step.hint}")
        print(f"  检查点：{step.checkpoint_question}")
    
    print("\n" + "=" * 50)
    print("✅ 苏格拉底AI教练引擎测试完成")
