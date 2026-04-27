# 🎯 Socrates AI Coach - 苏格拉底AI教练

> **不做判题机，做高价值"解惑师"**
>
> 让学生在思考中敲代码，不是在敲代码中放弃思考

[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![Vue3](https://img.shields.io/badge/Vue3-3.x-green.svg)](https://vuejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-cyan.svg)](https://fastapi.tiangolo.com/)

[🇨🇳 中文](./README.md) | [🇺🇸 English](./README_EN.md)

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

- 学生必须输入正确思路
- AI判定"逻辑通过"后，才解锁下一步
- 如果卡住，AI主动反向Push

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
│              前端 Vue3 + Vite            │
│         闯关式UI + TailwindCSS          │
├─────────────────────────────────────────┤
│              后端 FastAPI               │
│        Python 3.9+ + SQLAlchemy         │
├─────────────────────────────────────────┤
│              数据库 MySQL 8.0            │
├─────────────────────────────────────────┤
│              AI 模型 (可选)              │
│       GPT-4 / Claude / 本地模型         │
└─────────────────────────────────────────┘

部署方式：Docker 一键部署，5分钟上线
```

---

## 🚀 快速开始

### 前置要求

- Docker & Docker Compose
- 或 Python 3.9+ / Node.js 18+ / MySQL 8.0

### 方式一：Docker一键部署（推荐）

```bash
# 克隆项目
git clone https://github.com/yunjiangs/socrates-ai-coach.git
cd socrates-ai-coach/docker

# 一键启动
# Windows
./start.bat
# 或
docker-compose up -d

# 访问
# 前端: http://localhost:3000
# 后端: http://localhost:8000
# API文档: http://localhost:8000/docs
```

### 方式二：手动部署

**后端**
```bash
cd backend
pip install -r requirements.txt
# 配置环境变量 DATABASE_URL
python main.py
```

**前端**
```bash
cd frontend
npm install
npm run dev
```

---

## 📦 开源内容

```
├── backend/              # FastAPI后端完整源码
├── frontend/             # Vue3前端完整源码
├── database/             # MySQL数据库脚本
├── docker/               # Docker部署配置
├── prompts/              # AI Prompt模板
└── docs/                 # 完整文档
```

**核心开源，允许商用，无需授权。**

---

## 🎁 部署福利

**加群免费领取：**
- ✅ Docker一键部署包
- ✅ MySQL数据库脚本
- ✅ Vue3前端源码
- ✅ FastAPI后端源码
- ✅ AI Prompt调教指南
- ✅ 各年级课件模板

**入群方式：See Contact**

---

## 💰 盈利模式（供开发者参考）

| 服务 | 价格 | 说明 |
|------|------|------|
| 代部署服务 | ¥299/次 | 不会部署的老师/机构 |
| 专业版插件 | ¥99-299 | 多校区管理、家长端 |
| 技术保障包 | ¥599/年 | 一年期运维+更新 |
| 定制二开 | 面议 | 学校/教育局对接 |

---

## 👥 适用人群

- **信息学奥赛老师** - 减轻讲题压力，让学生会思考
- **少儿编程机构** - 提高学生自学能力，减少助教依赖
- **自学编程的学生** - 有个24小时AI助教，不懂就问
- **家有编程娃的家长** - 不用报班也能陪孩子学

---

## 📅 路线图

- [x] MVP完成 - AI拆解引擎 + 数据库 + Docker部署
- [ ] AI拆解引擎接入GPT/Claude
- [ ] 历年CSP-J/S真题库
- [ ] 移动端App（Capacitor）
- [ ] 多语言支持

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License - 可商用，无需授权

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
