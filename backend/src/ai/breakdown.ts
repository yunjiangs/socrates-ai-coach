/**
 * 苏格拉底AI拆解引擎 - 核心
 * 启发式题目拆解 + 逻辑网关验证
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_API_BASE || 'https://api.minimaxi.com/anthropic',
});

// ========== Zod Schema 定义 ==========

interface Level1 {
  core_model: string;
  analogy: string;
  real_world_example: string;
  key_terms: string[];
}

interface Step {
  id: number;
  title: string;
  content: string;
  hint: string;
  knowledge_point?: string;
}

interface Level2 {
  steps: Step[];
}

interface Quiz {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

interface BreakdownResult {
  title: string;
  level_1: Level1;
  level_2: Level2;
  level_3: Quiz;
}

interface VerificationFeedback {
  is_correct: boolean;
  feedback: string;
  hint?: string;
  next_step?: number;
}

// ========== Prompt 模板 - 简体中文 ==========

const LEVEL1_PROMPT = `题目：{problem}
难度：{difficulty}
知识点：{knowledge_points}

请生成"逻辑建模层"内容，用JSON格式：
{
  "core_model": "核心模型分析(50字内)",
  "analogy": "一个生活类比解释这个问题的背景",
  "real_world_example": "一个现实世界的例子",
  "key_terms": ["关键术语1", "关键术语2"]
}

要求：
- 类比要贴近中小学生的日常生活
- 不用编程术语，用生活语言`;

const LEVEL2_PROMPT = `题目：{problem}
难度：{difficulty}

请把解题过程拆成3-5个步骤，每步包含：
1. 标题（简洁）
2. 具体要做什么
3. 卡住时的提示
4. 涉及的知识点（可选）

用JSON格式：
{
  "steps": [
    {
      "id": 1,
      "title": "步骤标题",
      "content": "具体要做什么",
      "hint": "卡住时的提示",
      "knowledge_point": "涉及的知识点"
    }
  ]
}`;

const LEVEL3_PROMPT = `题目：{problem}
难度：{difficulty}
算法步骤：{steps}

请生成一个"互动验证题"，用于检查学生是否真正理解了算法的核心逻辑。

要求：
- 题目要能测试学生是否真正理解，而不是死记硬背
- 选项要有层次感，不能太明显
- 正确答案要合理

JSON格式：
{
  "question": "验证问题内容",
  "options": ["选项1", "选项2", "选项3", "选项4"],
  "correct_index": 0,
  "explanation": "为什么这个是正确答案"
}`;

const VERIFY_PROMPT = `学生的回答：{student_answer}
正确的思路应该是：{correct_approach}

请判断学生的理解是否正确。

要求：
- 语义匹配不要太死板
- 允许学生用通俗语言描述
- 如果方向正确但表述不精确，也要给予肯定

JSON格式：
{
  "is_correct": true/false,
  "feedback": "针对学生答案的反馈",
  "hint": "如果不正确，给的下一步提示"
}`;

// ========== AI 工具函数 ==========

async function aiCall(prompt: string): Promise<string> {
  const response = await client.messages.create({
    model: 'MiniMax-M2.7',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
    // @ts-ignore
    thinking: { type: 'disabled' },
  });

  let text = '';
  for (const block of response.content) {
    if (block.type === 'text') {
      text += block.text;
    }
  }
  return text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
}

function parseJSON<T>(text: string): T {
  return JSON.parse(text) as T;
}

// ========== SocratesEngine ==========

class SocratesEngine {
  private configured: boolean = false;

  constructor() {
    this.configured = !!(process.env.OPENAI_API_KEY);
  }

  /**
   * 生成完整的三级拆解
   */
  async generateBreakdown(
    problem: string,
    difficulty: number,
    knowledgePoints: string[]
  ): Promise<BreakdownResult> {
    const knowledgeStr = knowledgePoints.join(', ') || '基础算法';

    // Level 1
    const l1Prompt = LEVEL1_PROMPT
      .replace('{problem}', problem)
      .replace('{difficulty}', String(difficulty))
      .replace('{knowledge_points}', knowledgeStr);

    const l1Text = await aiCall(l1Prompt);
    const level_1: Level1 = parseJSON(l1Text);

    // Level 2
    const l2Prompt = LEVEL2_PROMPT
      .replace('{problem}', problem)
      .replace('{difficulty}', String(difficulty));

    const l2Text = await aiCall(l2Prompt);
    const level_2: Level2 = parseJSON(l2Text);

    // Level 3
    const l3Prompt = LEVEL3_PROMPT
      .replace('{problem}', problem)
      .replace('{difficulty}', String(difficulty))
      .replace('{steps}', JSON.stringify(level_2.steps));

    const l3Text = await aiCall(l3Prompt);
    const level_3: Quiz = parseJSON(l3Text);

    return {
      title: problem.slice(0, 50),
      level_1,
      level_2,
      level_3,
    };
  }

  /**
   * 验证学生回答
   */
  async verifyAnswer(
    studentAnswer: string,
    correctApproach: string
  ): Promise<VerificationFeedback> {
    const prompt = VERIFY_PROMPT
      .replace('{student_answer}', studentAnswer)
      .replace('{correct_approach}', correctApproach);

    const text = await aiCall(prompt);
    return parseJSON<VerificationFeedback>(text);
  }

  /**
   * 验证学生代码（Level 3）
   */
  async verifyCode(
    studentCode: string,
    problemDescription: string,
    level1Model: string
  ): Promise<{ is_correct: boolean; feedback: string }> {
    const prompt = `学生提交了以下代码：
${studentCode}

题目描述：
${problemDescription}

解题思路提示：
${level1Model}

请检查学生代码是否符合题目要求（逻辑正确、边界处理、命名规范）。
只返回JSON格式：
{"is_correct": true/false, "feedback": "具体反馈"}`;

    try {
      const text = await aiCall(prompt);
      return parseJSON(text);
    } catch {
      return { is_correct: false, feedback: '代码校验失败' };
    }
  }

  /**
   * 生成题解
   */
  async generateSolution(
    problemDescription: string,
    level1Model: string,
    level2Pseudo: string
  ): Promise<string> {
    const prompt = `题目：${problemDescription}

解题思路：${level1Model}

算法步骤：${level2Pseudo}

请生成一份完整的题解，包含：代码实现、思路解释、复杂度分析。用中文回复。`;

    try {
      return await aiCall(prompt);
    } catch {
      return '题解生成失败';
    }
  }

  /**
   * 生成提示
   */
  async generateHint(
    problemDescription: string,
    level1Model: string,
    level: string
  ): Promise<string> {
    const prompt = `题目：${problemDescription}
当前级别：${level}
解题思路：${level1Model}

请生成一个引导性的提示，帮助学生自己思考出答案。不要直接给答案。`;

    try {
      return await aiCall(prompt);
    } catch {
      return '提示生成失败';
    }
  }

  /**
   * 检查是否配置了AI
   */
  isConfigured(): boolean {
    return this.configured;
  }
}

// 导出单例
export const socratesEngine = new SocratesEngine();
