# JHSec WMS 一键启动指南

## 快速启动

### Windows 用户

#### 方法一：使用批处理脚本（推荐）
```bash
# 双击或在命令行运行
start.bat
```

#### 方法二：使用 PowerShell 脚本
```bash
# 右键选择"使用 PowerShell 运行"
start.ps1
```

### Linux/Mac 用户

```bash
# 给脚本执行权限
chmod +x start.sh

# 运行脚本
./start.sh
```

## 手动启动

如果需要分别启动前后端，可以按照以下步骤：

### 启动后端

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 启动后端服务
npm run dev
```

### 启动前端

```bash
# 在项目根目录安装依赖
npm install

# 启动前端服务
npm run dev
```

## 服务地址

- 前端服务：http://localhost:5173
- 后端服务：http://localhost:3000

## 停止服务

使用脚本启动时：
- Windows: 关闭弹出的命令行窗口
- Linux/Mac: 按 Ctrl+C

手动启动时：
- 前后端分别使用 Ctrl+C 停止

## 常见问题

1. **端口占用**：确保 5173 和 3000 端口未被占用
2. **Node.js 未安装**：请先安装 Node.js (LTS 版本)
3. **依赖安装失败**：检查网络连接，尝试删除 node_modules 重新安装

## 项目结构

```
jhsecWMS/
├── src/                 # 前端代码
├── backend/             # 后端代码
├── start.bat            # Windows 启动脚本
├── start.ps1            # PowerShell 启动脚本
├── start.sh             # Linux/Mac 启动脚本
├── sql.txt              # 数据库结构
└── README.md            # 项目说明
```