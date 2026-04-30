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
难度：{difficulty}
知识点：{knowledge_points}

请生成"逻辑建模层"內容，用JSON格式：
{
  "core_model": "核心模型分析(50字内)",
  "analogy": "一个生活类比解释这个问题的背景",
  "real_world_example": "一个现实世界的例子",
  "key_terms": ["关键术语1", "关键术语2"]
}
要求：类比要贴近中小学生的日常生活，不要用编程术语，用生活语言`;

const LEVEL2_PROMPT = `題目：{problem}
难度：{difficulty}
请把解题过程拆成3 5个步骤，每步包含：标题、具体要做什么、卡住时的提示、涉及的知识点。
用JSON格式：
{"steps":[{"id":1,"title":"步骤标题","content":"具体要做什么","hint":"卡住时的提示","knowledge point":"知识点"}]}`;

const LEVEL3_PROMPT = `題目：{problem}
难度：{difficulty}
算法步骤：{steps}
请生成一个互动验证题，检查学生是否真正理解算法核心逻辑。
json格式：{"question":"验证问题","options":["选项1","选项2","选项3","选项4"],"correct index":0,"explanation":"解析"}`;
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

  console.log(`找到 ${tasks.length} 道题目，开始AI拆解...\n`);

  for (const task of tasks) {
    const tags = typeof task.knowledge_tags === 'string'
      ? JSON.parse(task.knowledge_tags).join(',')
      : (task.knowledge_tags || '基础算法');

    console.log(`[${task.id}] ${task.title}`);
    console.log(`  难度: ${task.difficulty_level} | 知识点: ${tags}`);

    try {
      // 清理旧内容
      const empty = !task.level_1_model || task.level_1_model === '';

      if (empty) {
        console.log('  生成 L1 逻辑建模...');
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

        console.log('  生成 L3 互动验证题...');
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
        console.log('  ⏭️ 已有內容，跳过');
      }
    } catch (err) {
      console.error(`  ❌ 失败: ${err.message}`);
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
  console.error('执行错误:', err);
  process.exit(1);
});
