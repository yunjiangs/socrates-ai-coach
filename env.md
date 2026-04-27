# Socrates Coach - 环境变量配置
# 复制此文件为 .env 并填入实际值

# ========== 数据库配置 ==========
DB_HOST=localhost
DB_PORT=3306
DB_USER=socrates
DB_PASSWORD=ChangeThisPassword123!
DB_NAME=socrates_db

# ========== JWT密钥 ==========
# 请修改为随机字符串
JWT_SECRET=change-this-to-a-random-string-in-production

# ========== AI配置（二选一） ==========

# 方案1: OpenAI (GPT-4)
# 注册地址: https://platform.openai.com
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-api-key-here

# 方案2: Anthropic (Claude)
# 注册地址: https://console.anthropic.com
# AI_PROVIDER=anthropic
# ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here

# ========== 服务器配置 ==========
PORT=3001
NODE_ENV=production
