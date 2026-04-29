@echo off
chcp 65001 >nul
title Socrates Coach - 赛博修仙信奥导学平台

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║     🦞 Socrates Coach  一键启动                      ║
echo  ║     赛博修仙 · 信奥AI导学平台                         ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo [1/3] 检查环境...
where node >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装，请先安装 Node.js 18+
    pause
    exit /b 1
)

echo [2/3] 启动前端开发服务器...
start "SocratesCoach-前端" cmd /c "title SocratesCoach-前端 && npm run dev"

echo [3/3] 启动后端API服务...
start "SocratesCoach-后端" cmd /c "title SocratesCoach-后端 && npm run dev"

echo.
echo ✅ 启动完成！
echo.
echo 📍 访问地址:
echo    前端:  http://localhost:5173
echo    后端:  http://localhost:3001
echo.
echo 📋 快捷入口:
echo    原型演示: frontend\prototype.html (直接用浏览器打开)
echo.
echo 💡 提示: 首次启动需要安装依赖，请先运行: npm install
echo.
pause
