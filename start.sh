#!/bin/bash

# JHSec WMS 一键启动脚本

echo "================================="
echo "   JHSec WMS 一键启动脚本"
echo "================================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "错误: 未找到 Node.js，请先安装 Node.js"
    read -p "按任意键退出..."
    exit 1
fi

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "错误: 未找到 npm，请检查 Node.js 安装"
    read -p "按任意键退出..."
    exit 1
fi

echo "Node.js 版本:"
node --version
echo "npm 版本:"
npm --version
echo ""

# 启动后端
echo "================================="
echo "   启动后端服务..."
echo "================================="
cd backend

echo "正在检查并安装后端依赖..."
npm install

if [ $? -ne 0 ]; then
    echo "错误: 后端依赖安装失败"
    cd ..
    read -p "按任意键退出..."
    exit 1
fi

echo "后端依赖安装完成"

# 启动后端服务（后台运行）
echo "后端服务已在后台启动"
nohup npm run dev > backend.log 2>&1 &
BACKEND_PID=$!

# 返回项目根目录
cd ..

echo ""
echo "================================="
echo "   启动前端服务..."
echo "================================="
echo "正在检查并安装前端依赖..."

npm install

if [ $? -ne 0 ]; then
    echo "错误: 前端依赖安装失败"
    kill $BACKEND_PID 2>/dev/null
    read -p "按任意键退出..."
    exit 1
fi

echo "前端依赖安装完成"

# 启动前端服务
echo "前端服务已启动"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "================================="
echo "   所有服务启动完成！"
echo "================================="
echo ""
echo "前端服务地址: http://localhost:5173"
echo "后端服务地址: http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# 等待用户中断
trap 'echo ""; echo "正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT

wait