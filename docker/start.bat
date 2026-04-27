@echo off
echo ========================================
echo 苏格拉底AI教练 - 一键启动
echo ========================================
echo.

echo [1/4] 检查Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 请先安装Docker: https://docker.com
    pause
    exit /b 1
)

echo [2/4] 检查Docker Compose...
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 请先安装Docker Compose
    pause
    exit /b 1
)

echo [3/4] 启动服务...
docker-compose up -d --build

echo.
echo [4/4] 等待服务启动...
timeout /t 10 /nobreak >nul

echo.
echo ========================================
echo 启动完成！
echo.
echo 前端地址: http://localhost:3000
echo 后端API: http://localhost:3001
echo API文档: http://localhost:3001/docs
echo.
echo 初始账号: teacher_demo / password
echo ========================================

pause
