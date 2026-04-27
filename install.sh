#!/bin/bash
# Socrates Coach - 一键安装依赖脚本
# 支持: Linux / macOS / Windows (Git Bash)

set -e

echo "========================================="
echo "  Socrates Coach - 依赖安装"
echo "========================================="

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查Node.js
check_node() {
    if ! command -v node &> /dev/null; then
        echo -e "${YELLOW}Node.js 未安装，正在引导安装...${NC}"
        echo "请访问 https://nodejs.org 下载安装"
        exit 1
    fi
    echo -e "${GREEN}✓ Node.js version: $(node --version)${NC}"
}

# 检查npm
check_npm() {
    if ! command -v npm &> /dev/null; then
        echo -e "${YELLOW}npm 未找到${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ npm version: $(npm --version)${NC}"
}

# 安装后端依赖
install_backend() {
    echo ""
    echo -e "${YELLOW}[1/2] 安装后端依赖...${NC}"
    cd backend
    npm install
    echo -e "${GREEN}✓ 后端依赖安装完成${NC}"
    cd ..
}

# 安装前端依赖
install_frontend() {
    echo ""
    echo -e "${YELLOW}[2/2] 安装前端依赖...${NC}"
    cd frontend
    npm install
    echo -e "${GREEN}✓ 前端依赖安装完成${NC}"
    cd ..
}

# 主流程
main() {
    echo "检查环境..."
    check_node
    check_npm
    
    echo ""
    echo -e "${GREEN}开始安装依赖...${NC}"
    
    install_backend
    install_frontend
    
    echo ""
    echo "========================================="
    echo -e "${GREEN}  依赖安装完成！${NC}"
    echo "========================================="
    echo ""
    echo "下一步："
    echo "  1. 复制 .env.example 为 .env"
    echo "  2. 配置数据库和AI API Key"
    echo "  3. 运行 docker-compose up -d"
    echo ""
}

main "$@"
