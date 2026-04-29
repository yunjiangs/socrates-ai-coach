/**
 * 批量重建题目AI内容
 * 运行: node rebuild_tasks.js
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import mysql from 'mysql2/promise';

const client = new Anthropic({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_API_BASE || 'https://api.minimaxi.com/anthropic',
});

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
要求：類比要貼近中小學生的日常生活，不要用編程術語，用生活語言`;

const LEVEL2_PROMPT = `題目：{problem}
難度：{difficulty}
請把解題過程拆成3-5個步驟，每步包含：標題、具體要做什麼、卡住時的提示、涉及的知識點。
用JSON格式：
{"steps":[{"id":1,"title":"步驟標題","content":"具體要做什麼","hint":"卡住時的提示","knowledge_point":"知識點"}]}`;

const LEVEL3_PROMPT = `題目：{problem}
難度：{difficulty}
算法步驟：{steps}
請生成一個互動驗證題，檢查學生是否真正理解算法核心邏輯。
JSON格式：{"question":"驗證問題","options":["選項1","選項2","選項3","選項4"],"correct_index":0,"explanation":"解析"}`;

async function aiCall(prompt) {
  const response = await client.messages.create({
    model: 'MiniMax-M2.7',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });
  let text = '';
  for (const block of response.content) {
    if (block.type === 'text') text += block.text;
  }
  return text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
}

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'socrates',
    password: process.env.DB_PASSWORD || 'socrates_pass_2024',
    database: process.env.DB_NAME || 'socrates_db',
    charset: 'utf8mb4',
  });

  const [tasks] = await pool.query(
    'SELECT id, title, content, difficulty_level, knowledge_tags FROM tasks'
  );

  console.log(`找到 ${tasks.length} 道題目，開始AI拆解...\n`);

  for (const task of tasks) {
    const tags = typeof task.knowledge_tags === 'string'
      ? JSON.parse(task.knowledge_tags).join(',')
      : (task.knowledge_tags || '基礎算法');

    console.log(`[${task.id}] ${task.title}`);
    console.log(`  難度: ${task.difficulty_level} | 知識點: ${tags}`);

    try {
      // 清理旧内容
      const empty = !task.level_1_model || task.level_1_model === '';

      if (empty) {
        console.log('  生成 L1 邏輯建模...');
        const l1 = await aiCall(
          LEVEL1_PROMPT
            .replace('{problem}', task.content)
            .replace('{difficulty}', task.difficulty_level)
            .replace('{knowledge_points}', tags)
        );

        console.log('  生成 L2 算法拆解...');
        const l2 = await aiCall(
          LEVEL2_PROMPT
            .replace('{problem}', task.content)
            .replace('{difficulty}', task.difficulty_level)
        );

        console.log('  生成 L3 互動驗證題...');
        const l3 = await aiCall(
          LEVEL3_PROMPT
            .replace('{problem}', task.content)
            .replace('{difficulty}', task.difficulty_level)
            .replace('{steps}', l2)
        );

        await pool.query(
          'UPDATE tasks SET level_1_model = ?, level_2_pseudo = ?, level_3_quiz = ? WHERE id = ?',
          [l1, l2, l3, task.id]
        );
        console.log(`  ✅ 完成`);
      } else {
        console.log('  ⏭️ 已有內容，跳過');
      }
    } catch (err) {
      console.error(`  ❌ 失敗: ${err.message}`);
    }

    // 避免API限流
    await new Promise(r => setTimeout(r, 1500));
    console.log('');
  }

  console.log('全部完成！');
  await pool.end();
  process.exit(0);
}

main().catch(err => {
  console.error('執行錯誤:', err);
  process.exit(1);
});
