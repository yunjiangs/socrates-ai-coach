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

// ========== Prompt 模板 ==========

const LEVEL1_PROMPT = `題目：{problem}
難度：{difficulty}
知識點：{knowledge_points}

請生成"邏輯建模層"內容，用JSON格式：
{
  "core_model": "核心模型分析(50字內)",
  "analogy": "一個生活類比解釋這個問題的背景",
  "real_world_example": "一個現實世界的例子",
  "key_terms": ["關鍵術語1", "關鍵術語2"]
}

要求：
- 類比要貼近中小學生的日常生活
- 不要用編程術語，用生活語言`;

const LEVEL2_PROMPT = `題目：{problem}
難度：{difficulty}

請把解題過程拆成3-5個步驟，每步包含：
1. 標題（簡潔）
2. 具體要做什麼
3. 卡住時的提示
4. 涉及的知識點（可選）

用JSON格式：
{
  "steps": [
    {
      "id": 1,
      "title": "步驟標題",
      "content": "具體要做什麼",
      "hint": "卡住時的提示",
      "knowledge_point": "涉及的知識點"
    }
  ]
}`;

const LEVEL3_PROMPT = `題目：{problem}
難度：{difficulty}
算法步驟：{steps}

請生成一個"互動驗證題"，用於檢查學生是否真正理解了算法的核心邏輯。

要求：
- 題目要能測試學生是否真正理解，而不是死記硬背
- 選項要有層次感，不能太明顯
- 正確答案要合理

JSON格式：
{
  "question": "驗證問題內容",
  "options": ["選項1", "選項2", "選項3", "選項4"],
  "correct_index": 0,
  "explanation": "為什麼這個是正確答案"
}`;

const VERIFY_PROMPT = `學生的回答：{student_answer}
正確的思路應該是：{correct_approach}

請判斷學生的理解是否正確。

要求：
- 語義匹配不要太死板
- 允許學生用通俗語言描述
- 如果方向正確但表述不精確，也要給予肯定

JSON格式：
{
  "is_correct": true/false,
  "feedback": "針對學生答案的反饋",
  "hint": "如果不正確，給的下一步提示"
}`;

// ========== AI 工具函数 ==========

async function aiCall(prompt: string): Promise<string> {
  const response = await client.messages.create({
    model: 'MiniMax-M2.7',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  let text = '';
  for (const block of response.content) {
    if (block.type === 'text') {
      text += block.text;
    }
  }
  return text;
}

function parseJSON<T>(text: string): T {
  // 去掉 markdown 代码块
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned) as T;
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
    const knowledgeStr = knowledgePoints.join(', ') || '基礎算法';

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
    const prompt = `學生提交了以下代碼：
${studentCode}

題目描述：
${problemDescription}

解題思路提示：
${level1Model}

請檢查學生代碼是否符合題目要求（邏輯正確、邊界處理、命名規範）。
只返回JSON格式：
{"is_correct": true/false, "feedback": "具體反饋"}`;

    try {
      const text = await aiCall(prompt);
      return parseJSON(text);
    } catch {
      return { is_correct: false, feedback: '代碼校驗失敗' };
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
    const prompt = `題目：${problemDescription}

解題思路：${level1Model}

算法步驟：${level2Pseudo}

請生成一份完整的題解，包含：代碼實現、思維解釋、複雜度分析。用中文回覆。`;

    try {
      return await aiCall(prompt);
    } catch {
      return '題解生成失敗';
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
    const prompt = `題目：${problemDescription}
當前級別：${level}
解題思路：${level1Model}

請生成一個引導性的提示，幫助學生自己思考出答案。不要直接給答案。`;

    try {
      return await aiCall(prompt);
    } catch {
      return '提示生成失敗';
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
