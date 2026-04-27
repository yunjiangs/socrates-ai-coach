# 苏格拉底AI教练 - 一键启动脚本
# Socrates AI Coach - One-Click Startup Script

@echo off
echo ========================================
echo 苏格拉底AI教练 - 一键启动
echo ========================================
echo.

echo [1/3] 检查Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 请先安装Docker: https://docker.com
    pause
    exit /b 1
)

echo [2/3] 检查Docker Compose...
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 请先安装Docker Compose
    pause
    exit /b 1
)

echo [3/3] 启动服务...
echo.
docker-compose up -d

echo.
echo ========================================
echo 启动完成！
echo.
echo 前端地址: http://localhost:3000
echo 后端API: http://localhost:8000
echo API文档: http://localhost:8000/docs
echo.
echo 初始账号: admin / admin123
echo ========================================

pause
