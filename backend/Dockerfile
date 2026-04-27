# Socrates Coach Backend - Dockerfile
FROM node:20-alpine

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源码
COPY . .

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["npm", "run", "dev"]
