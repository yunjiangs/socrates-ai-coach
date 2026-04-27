/**
 * 苏格拉底AI拆解引擎 - 核心
 * 启发式题目拆解 + 逻辑网关验证
 */

import { z } from 'zod';
import { ChatOpenAI } from 'langchain.chat_models';
import { ChatAnthropic } from 'langchain.chat_models';

// ========== Zod Schema 定义 ==========

// Level 1: 逻辑建模层
export const Level1Schema = z.object({
  core_model: z.string().describe('核心模型分析(50字内)'),
  analogy: z.string().describe('生活类比解释'),
  real_world_example: z.string().describe('现实世界例子'),
  key_terms: z.array(z.string()).describe('关键术语列表'),
});

// Level 2: 算法拆解层
export const StepSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  hint: z.string().describe('卡住时的提示'),
  knowledge_point: z.string().optional().describe('涉及的知识点'),
});

export const Level2Schema = z.object({
  steps: z.array(StepSchema),
});

// Level 3: 互动验证题
export const QuizSchema = z.object({
  question: z.string().describe('验证问题'),
  options: z.array(z.string()).describe('选项列表'),
  correct_index: z.number().describe('正确答案索引'),
  explanation: z.string().describe('解析'),
});

// 完整三级拆解
export const BreakdownResultSchema = z.object({
  title: z.string(),
  level_1: Level1Schema,
  level_2: Level2Schema,
  level_3: QuizSchema,
});

// 验证反馈
export const VerificationFeedbackSchema = z.object({
  is_correct: z.boolean(),
  feedback: z.string(),
  hint: z.string().optional(),
  next_step: z.number().optional(),
});

// ========== Prompt 模板 ==========

const SYSTEM_PROMPT = `你是一位資深的信息學奧賽教練，教學風格是"蘇格拉底式教學"。

核心理念：
- 不直接給答案
- 用生活類比解釋複雜概念
- 把大問題拆成小問題
- 引導學生自己思考

輸出格式：嚴格JSON，方便程序處理。`;

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
- 類比要貼近中小學生的白日常生活
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

// ========== AI 客戶端 ==========

class SocratesEngine {
  private llm: ChatOpenAI | ChatAnthropic | null = null;
  private modelProvider: 'openai' | 'anthropic' = 'openai';

  constructor() {
    this.initializeLLM();
  }

  private initializeLLM() {
    const provider = process.env.AI_PROVIDER || 'openai';
    
    if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
      this.llm = new ChatAnthropic({
        modelName: 'claude-3-sonnet-20240229',
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      this.modelProvider = 'anthropic';
    } else if (process.env.OPENAI_API_KEY) {
      this.llm = new ChatOpenAI({
        modelName: 'gpt-4o',
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  /**
   * 生成完整的三级拆解
   */
  async generateBreakdown(
    problem: string,
    difficulty: number,
    knowledgePoints: string[]
  ): Promise<z.infer<typeof BreakdownResultSchema>> {
    if (!this.llm) {
      throw new Error('AI model not configured');
    }

    const knowledgeStr = knowledgePoints.join(', ');

    // Level 1
    const level1Prompt = LEVEL1_PROMPT
      .replace('{problem}', problem)
      .replace('{difficulty}', String(difficulty))
      .replace('{knowledge_points}', knowledgeStr);

    const level1Response = await this.llm.invoke([
      ['system', SYSTEM_PROMPT],
      ['human', level1Prompt],
    ]);
    const level1 = JSON.parse(level1Response.content as string);

    // Level 2
    const level2Prompt = LEVEL2_PROMPT
      .replace('{problem}', problem)
      .replace('{difficulty}', String(difficulty));

    const level2Response = await this.llm.invoke([
      ['system', SYSTEM_PROMPT],
      ['human', level2Prompt],
    ]);
    const level2 = JSON.parse(level2Response.content as string);

    // Level 3
    const level3Prompt = LEVEL3_PROMPT
      .replace('{problem}', problem)
      .replace('{difficulty}', String(difficulty))
      .replace('{steps}', JSON.stringify(level2.steps));

    const level3Response = await this.llm.invoke([
      ['system', SYSTEM_PROMPT],
      ['human', level3Prompt],
    ]);
    const level3 = JSON.parse(level3Response.content as string);

    return {
      title: problem.slice(0, 50),
      level_1: Level1Schema.parse(level1),
      level_2: Level2Schema.parse(level2),
      level_3: QuizSchema.parse(level3),
    };
  }

  /**
   * 验证学生回答
   */
  async verifyAnswer(
    studentAnswer: string,
    correctApproach: string
  ): Promise<z.infer<typeof VerificationFeedbackSchema>> {
    if (!this.llm) {
      throw new Error('AI model not configured');
    }

    const prompt = VERIFY_PROMPT
      .replace('{student_answer}', studentAnswer)
      .replace('{correct_approach}', correctApproach);

    const response = await this.llm.invoke([
      ['system', SYSTEM_PROMPT],
      ['human', prompt],
    ]);

    return VerificationFeedbackSchema.parse(JSON.parse(response.content as string));
  }

  /**
   * 检查是否配置了AI
   */
  isConfigured(): boolean {
    return this.llm !== null;
  }
}

// 导出单例
export const socratesEngine = new SocratesEngine();
