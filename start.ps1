# JHSec WMS 一键启动脚本 (PowerShell)

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "   JHSec WMS 一键启动脚本" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js
if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "错误: 未找到 Node.js，请先安装 Node.js" -ForegroundColor Red
    Read-Host "按任意键退出"
    exit 1
}

# 检查 npm
if (-not (Get-Command "npm" -ErrorAction SilentlyContinue)) {
    Write-Host "错误: 未找到 npm，请检查 Node.js 安装" -ForegroundColor Red
    Read-Host "按任意键退出"
    exit 1
}

Write-Host "Node.js 版本:" -ForegroundColor Green
node --version
Write-Host "npm 版本:" -ForegroundColor Green
npm --version
Write-Host ""

# 启动后端
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "   启动后端服务..." -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Set-Location -Path "backend"

Write-Host "正在检查并安装后端依赖..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -neq 0) {
    Write-Host "错误: 后端依赖安装失败" -ForegroundColor Red
    Set-Location -Path ".."
    Read-Host "按任意键退出"
    exit 1
}

Write-Host "后端依赖安装完成" -ForegroundColor Green

# 在后台启动后端
Start-Job -Name "Backend" -ScriptBlock {
    Set-Location -Path "backend"
    npm run dev
}

Write-Host "后端服务已在后台启动" -ForegroundColor Green

# 返回项目根目录
Set-Location -Path ".."

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "   启动前端服务..." -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "正在检查并安装前端依赖..." -ForegroundColor Yellow

npm install

if ($LASTEXITCODE -neq 0) {
    Write-Host "错误: 前端依赖安装失败" -ForegroundColor Red
    Read-Host "按任意键退出"
    exit 1
}

Write-Host "前端依赖安装完成" -ForegroundColor Green

# 在后台启动前端
Start-Job -Name "Frontend" -ScriptBlock {
    npm run dev
}

Write-Host "前端服务已在后台启动" -ForegroundColor Green

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "   所有服务启动完成！" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "前端服务地址: http://localhost:5173" -ForegroundColor Green
Write-Host "后端服务地址: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "按任意键查看服务日志..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# 显示所有服务日志
Write-Host ""
Write-Host "===== 后端服务日志 =====" -ForegroundColor Cyan
Write-Host ""
Receive-Job -Job (Get-Job -Name "Backend") | Out-Host

Write-Host ""
Write-Host "===== 前端服务日志 =====" -ForegroundColor Cyan
Write-Host ""
Receive-Job -Job (Get-Job -Name "Frontend") | Out-Host

# 清理作业
Remove-Job -Name "Backend" -Force
Remove-Job -Name "Frontend" -Force

Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")