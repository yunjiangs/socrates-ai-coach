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

**苏格拉底AI教练的核心理念：不给答案，只给思维。**

---

## 🎯 产品定位

| 功能 | 传统OJ | 苏格拉底AI教练 |
|------|--------|---------------|
| 判题 | ✅ | ❌ |
| 题目拆解 | ❌ | ✅ |
| 给答案 | ✅ | ❌ |
| 给思路 | ❌ | ✅ |

---

## 🔥 核心功能

### 题目三段式拆解

```
第一层：逻辑建模层
└─ 用生活类比解释问题背景
   例："用排队领糖果解释队列"

第二层：算法拆解层  
└─ 把大问题拆成小任务

第三层：代码提示层
└─ 只给提示，不给答案
```

### 懂没懂验证

学生必须自己输出思路，AI验证通过后才能解锁下一步。

### 老师后台

一目了然看到哪个学生在哪一步卡住了。

---

## 🚀 快速开始

### 方式一：Docker一键部署（推荐）

```bash
# 克隆项目
git clone https://github.com/yunjiangs/socrates-ai-coach.git
cd socrates-ai-coach

# 配置环境变量
copy env.md .env
# 编辑 .env，填入数据库密码和AI密钥

# 启动服务
cd docker
docker-compose up -d

# 访问
# 前端: http://localhost:3000
# 后端: http://localhost:3001
```

### 方式二：手动部署

**前置要求：**
- Node.js 18+
- MySQL 8.0
- (可选) OpenAI 或 Anthropic API Key

**安装依赖：**
```bash
# 自动安装
./install.sh

# 或手动
cd backend && npm install
cd ../frontend && npm install
```

**启动：**
```bash
# 启动后端
cd backend && npm run dev

# 启动前端（新窗口）
cd frontend && npm run dev
```

---

## 👤 演示账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 老师 | demo_teacher | demo123 |
| 学生 | demo_student1 | demo123 |

---

## ⚙️ 配置AI（可选）

### 获取API Key

**OpenAI (GPT-4):**
1. 注册: https://platform.openai.com
2. 创建API Key
3. 在 `.env` 中设置 `OPENAI_API_KEY=sk-...`

**Anthropic (Claude):**
1. 注册: https://console.anthropic.com
2. 创建API Key
3. 在 `.env` 中设置 `ANTHROPIC_API_KEY=sk-ant-...`

> 💡 不配置AI也可以运行，但题目拆解功能将使用预设模板。

---

## 🐛 常见问题

### Docker启动失败

**检查1: Docker是否运行**
```bash
docker --version
docker ps
```

**检查2: 端口是否被占用**
```bash
# Windows
netstat -ano | findstr "3306 3000 3001"

# 或修改 docker-compose.yml 中的端口映射
```

**检查3: 查看日志**
```bash
docker-compose logs
docker-compose logs db
docker-compose logs backend
```

### 数据库连接失败

**症状:** `Connection refused`

**解决:**
1. 等待MySQL启动完成（约30秒）
2. 检查 `docker-compose.yml` 中的密码配置
3. 重启: `docker-compose restart`

### 页面打不开

**检查:**
1. Docker容器是否运行: `docker ps`
2. 端口是否冲突: `docker-compose ps`
3. 浏览器缓存: 尝试 Ctrl+F5 强制刷新

---

## 📂 项目结构

```
socrates-ai-coach/
├── frontend/                # React前端
│   └── src/
│       ├── pages/          # 页面组件
│       └── App.tsx
│
├── backend/                # Fastify后端
│   └── src/
│       ├── routes/         # API路由
│       ├── ai/            # AI拆解引擎
│       └── index.ts
│
├── database/               # 数据库
│   └── init.sql           # 初始化脚本(含演示数据)
│
├── docker/                 # Docker部署
│   ├── docker-compose.yml
│   └── start.bat
│
├── .env.example            # 环境变量示例
├── install.sh             # 依赖安装脚本
└── README.md
```

---

## 📡 API 路由

| 方法 | 路由 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/register` | 注册 |
| GET | `/api/tasks` | 获取题目列表 |
| GET | `/api/tasks/:id` | 获取题目详情 |
| POST | `/api/progress/verify` | 验证答案 |
| GET | `/api/stats/student/:id` | 学生思维数据 |

完整API文档: http://localhost:3001/docs

---

## 👥 适用人群

- **信息学奥赛老师** - 减轻讲题压力
- **少儿编程机构** - 提高自学能力
- **自学编程的学生** - 24小时AI助教

---

## 📅 路线图

- [x] MVP完成 - 三级拆解 + Docker部署
- [x] 演示数据
- [ ] AI深度接入
- [ ] 历年真题库
- [ ] 移动端App

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License - 完全开源，可自由使用、修改和商用。

---

## 📧 联系

**GitHub:** https://github.com/yunjiangs/socrates-ai-coach

**Gitee:** https://gitee.com/yun_jiang/socrates-ai-coach

---

<div align="center">

**"判题平台练的是'招式'**
**我的平台练的是'心法'"**

</div>
