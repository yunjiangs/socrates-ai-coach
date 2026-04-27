# 🎯 Socrates Coach - 苏格拉底AI教练

> **不做判题机，做高价值"解惑师"**
>
> 让学生在思考中敲代码，不是在敲代码中放弃思考

[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-green.svg)](https://reactjs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-4.x-cyan.svg)](https://www.fastify.dev/)

---

## 📌 项目简介

带竞赛最怕学生：
- 😰 **一看就废** - 盯着题目发呆，不知道从哪里下手
- 🤯 **一写就崩** - 对着题解抄代码，换个说法就不会
- 📉 **效率低下** - 老师讲3遍，还是不懂

市面上已有的平台（Luogu, Codeforces）只告诉你"对"或"错"，但学生真正需要的是**理解**。

**苏格拉底AI教练的核心理念：不给答案，只给思维。**

---

## 🎯 产品定位

| 功能 | 传统OJ | 苏格拉底AI教练 |
|------|--------|---------------|
| 判题 | ✅ | ❌ |
| 题目拆解 | ❌ | ✅ |
| 给答案 | ✅ | ❌ |
| 给思路 | ❌ | ✅ |
| 看结果 | ✅ | ❌ |
| 看过程 | ❌ | ✅ |

---

## 🔥 核心功能

### 1. 📚 题目三段式拆解

```
┌─────────────────────────────────────────────────┐
│            第一层：逻辑建模层                    │
│  用生活类比解释问题背景                         │
│  例："用排队领糖果解释队列 Queue"               │
├─────────────────────────────────────────────────┤
│            第二层：算法拆解层                    │
│  把大问题拆成3-5个小任务                        │
│  例：                                           │
│  1. 如何读入数据？                              │
│  2. 如何判断边界条件？                          │
│  3. 如何状态转移？                              │
├─────────────────────────────────────────────────┤
│            第三层：代码提示层                    │
│  只给伪代码/关键函数签名                        │
│  留核心逻辑让学生自己填空                        │
└─────────────────────────────────────────────────┘
```

### 2. ✅ "懂没懂"验证开关

- 学生必须输入正确思路，AI判定通过后才能解锁下一步
- 如果卡住，AI主动反向Push引导
- 强制学生思考，而不是被动看答案

### 3. 📊 思维图谱报告

完成后生成《思维图谱报告》：
- 薄弱知识点
- 掌握知识点
- AI学习建议

### 4. 🚨 老师预警看板

老师后台可以看到：
- 哪个学生在哪一步卡住了
- 停留了多长时间
- 建议面谈指导

---

## 🛠️ 技术架构

```
┌─────────────────────────────────────────┐
│         前端 React 18 + Vite            │
│     赛博修仙风格 + TailwindCSS          │
├─────────────────────────────────────────┤
│         后端 Fastify + TypeScript       │
│        LangChain + Zod 结构化            │
├─────────────────────────────────────────┤
│              MySQL 8.0                  │
├─────────────────────────────────────────┤
│         AI 模型 (GPT-4 / Claude)        │
└─────────────────────────────────────────┘

部署方式：Docker Compose 一键部署
```

---

## 🚀 快速开始

### 前置要求

- Docker & Docker Compose

### 一键启动

```bash
# 克隆项目
git clone https://github.com/yunjiangs/socrates-ai-coach.git
cd socrates-ai-coach/docker

# 启动服务
docker-compose up -d

# 访问
# 前端: http://localhost:3000
# 后端API: http://localhost:3001
# API文档: http://localhost:3001/docs
```

### 配置AI（可选）

创建 `.env` 文件：

```bash
# OpenAI
OPENAI_API_KEY=sk-xxx

# 或 Anthropic
ANTHROPIC_API_KEY=sk-ant-xxx
AI_PROVIDER=anthropic
```

---

## 📂 项目结构

```
socrates-ai-coach/
├── frontend/                # React前端
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   ├── components/    # 通用组件
│   │   └── App.tsx        # 主应用
│   ├── tailwind.config.js # Tailwind配置
│   └── Dockerfile
│
├── backend/                # Fastify后端
│   ├── src/
│   │   ├── routes/        # API路由
│   │   ├── ai/            # AI拆解引擎
│   │   └── index.ts        # 主入口
│   ├── package.json
│   └── Dockerfile
│
├── database/              # 数据库
│   └── init.sql           # 初始化脚本
│
├── docker/                 # Docker部署
│   ├── docker-compose.yml
│   └── README.md
│
└── shared/                # 共享类型
    └── types.ts
```

---

## 📡 API 路由

| 方法 | 路由 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册用户 |
| POST | `/api/auth/login` | 登录 |
| GET | `/api/auth/me` | 获取当前用户 |
| POST | `/api/tasks/ingest` | 摄入题目 + AI拆解 |
| GET | `/api/tasks/:id` | 获取题目详情 |
| GET | `/api/tasks` | 获取题目列表 |
| POST | `/api/progress/verify` | 验证学生答案 |
| GET | `/api/progress/student/:id` | 获取学生进度 |
| GET | `/api/stats/student/:id` | 学生思维雷达图 |
| GET | `/api/stats/class/:id` | 班级整体数据 |
| POST | `/api/ai/breakdown` | 直接调用AI拆解 |

---

## 👥 适用人群

- **信息学奥赛老师** - 减轻讲题压力，让学生真正理解
- **少儿编程机构** - 提高学生自学能力
- **自学编程的学生** - 有个24小时AI助教
- **家有编程娃的家长** - 不用报班也能陪孩子学

---

## 📅 路线图

- [x] MVP完成 - 三级拆解 + 验证逻辑 + Docker部署
- [ ] AI接入GPT-4/Claude深度优化
- [ ] 历年CSP-J/S真题库
- [ ] 移动端App（Capacitor）
- [ ] 多语言支持

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License - 完全开源，可自由使用、修改和商用。

---

## 📧 联系

<div align="center">

**GitHub**: https://github.com/yunjiangs/socrates-ai-coach

**Gitee**: https://gitee.com/yun_jiang/socrates-ai-coach

</div>

---

<div align="center">

**"判题平台练的是'招式'（代码量）**
**我的平台练的是'心法'（逻辑拆解）"**

</div>
