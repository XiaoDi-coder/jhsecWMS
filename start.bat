@echo off
echo =================================
echo   JHSec WMS 一键启动脚本
echo =================================
echo.

REM 检查 Node.js 是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

echo 检测到 Node.js 版本:
node --version

echo.

REM 检查 npm 是否安装
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到 npm，请检查 Node.js 安装
    pause
    exit /b 1
)

echo 检测到 npm 版本:
npm --version

echo.

REM 进入后端目录并安装依赖
echo =================================
echo   启动后端服务...
echo =================================
cd backend

echo 正在检查并安装后端依赖...
npm install

if %errorlevel% neq 0 (
    echo 错误: 后端依赖安装失败
    cd ..
    pause
    exit /b 1
)

echo 后端依赖安装完成

REM 在新窗口启动后端服务
start "Backend Server" cmd /k "echo 后端服务启动中... && npm run dev"

echo 后端服务已启动

REM 返回项目根目录
cd ..

echo.
echo =================================
echo   启动前端服务...
echo =================================
echo 正在检查并安装前端依赖...
npm install

if %errorlevel% neq 0 (
    echo 错误: 前端依赖安装失败
    pause
    exit /b 1
)

echo 前端依赖安装完成

REM 在新窗口启动前端服务
start "Frontend Server" cmd /k "echo 前端服务启动中... && npm run dev"

echo.
echo =================================
echo   所有服务启动完成！
echo =================================
echo.
echo 前端服务地址: http://localhost:5173
echo 后端服务地址: http://localhost:3000
echo.
echo 按任意键关闭此窗口...
pause >nul