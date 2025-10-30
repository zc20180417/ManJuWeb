# ManJu 服务器端

这是一个为 ManJu 项目提供后端服务的 Node.js 服务器，用于处理图片/视频生成、文件存储和历史记录管理。

## 项目结构

```
server/
├── src/
│   ├── controllers/          # 控制器层
│   ├── services/             # 业务逻辑层
│   ├── models/               # 数据模型
│   ├── routes/               # 路由定义
│   ├── middleware/           # 中间件
│   ├── utils/                # 工具函数
│   ├── config/               # 配置文件
│   └── app.ts                # 应用入口
├── uploads/                  # 上传文件存储目录
├── dist/                     # 编译后的代码
├── package.json
└── tsconfig.json
```

## 功能特性

1. 图片上传和存储管理
2. 视频生成任务处理
3. 结果文件存储和访问
4. 历史记录管理
5. API状态轮询
6. 数据库集成 (MongoDB)

## 技术栈

- Node.js + Express.js
- TypeScript
- MongoDB (Mongoose)
- Multer (文件上传)
- Socket.io (实时通信)

## 安装和运行

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 生产模式运行
npm start
```