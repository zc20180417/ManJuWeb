# 部署指南

## 环境要求

1. Node.js >= 16.x
2. MongoDB >= 4.4
3. pnpm (推荐) 或 npm

## 安装步骤

### 1. 克隆项目
```bash
git clone <项目地址>
cd server
```

### 2. 安装依赖
```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

### 3. 配置环境变量
创建 `.env` 文件:
```env
# MongoDB 连接字符串
MONGODB_URI=mongodb://localhost:27017/manju

# 服务器端口
PORT=3001

# 基础URL (用于文件访问)
BASE_URL=http://localhost:3001/uploads

# 云存储配置 (可选)
CLOUD_STORAGE_URL=https://your-cdn-domain.com/media
CLOUD_IMAGE_URL=https://your-cdn-domain.com/media/images
CLOUD_VIDEO_URL=https://your-cdn-domain.com/media/videos
```

### 4. 启动 MongoDB
确保 MongoDB 服务正在运行:
```bash
# 如果使用 Docker
docker run -d -p 27017:27017 --name mongodb mongo

# 或启动本地 MongoDB 服务
mongod
```

### 5. 启动服务器
```bash
# 开发模式
npm run dev

# 或生产模式
npm run build
npm start
```

## 目录结构说明

```
server/
├── src/                    # 源代码
│   ├── controllers/        # 控制器层
│   ├── services/           # 业务逻辑层
│   ├── models/             # 数据模型
│   ├── routes/             # 路由定义
│   ├── middleware/         # 中间件
│   ├── utils/              # 工具函数
│   ├── config/             # 配置文件
│   └── app.ts              # 应用入口
├── uploads/                # 上传文件存储目录
│   ├── images/             # 图片存储
│   │   ├── input/          # 用户上传的图片
│   │   └── results/        # 生成的图片结果
│   └── videos/             # 视频存储
│       ├── input/          # 用户上传的视频
│       └── results/        # 生成的视频结果
├── dist/                   # 编译后的代码
├── package.json            # 项目配置
└── tsconfig.json           # TypeScript 配置
```

## API 接口文档

### 图片生成相关接口

1. `POST /api/images/generate` - 生成图片
2. `POST /api/images/status/:taskId` - 检查图片生成状态
3. `GET /api/images/history` - 获取图片生成历史
4. `GET /api/images/:id` - 获取单个图片记录

### 视频生成相关接口

1. `POST /api/videos/generate` - 生成视频
2. `POST /api/videos/status/:taskId` - 检查视频生成状态
3. `GET /api/videos/history` - 获取视频生成历史
4. `GET /api/videos/:id` - 获取单个视频记录

### 历史记录相关接口

1. `GET /api/history/images` - 获取图片历史记录
2. `GET /api/history/videos` - 获取视频历史记录
3. `GET /api/history/all` - 获取所有历史记录

## 文件存储策略

1. 上传的文件存储在 `uploads/` 目录下
2. 文件按年月进行组织，例如: `uploads/images/input/2025/01/filename.png`
3. 数据库只存储文件名，不存储完整路径
4. 通过拼接基础URL和文件名来构建访问URL

## 生产环境部署

### 使用 PM2 管理进程
```bash
# 安装 PM2
npm install -g pm2

# 构建项目
npm run build

# 启动应用
pm2 start dist/app.js --name manju-server

# 设置开机自启
pm2 startup
pm2 save
```

### 使用 Nginx 反向代理
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /path/to/your/project/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 监控和日志

### 日志配置
日志文件存储在 `logs/` 目录下 (需要手动创建):
```bash
mkdir logs
```

### 错误监控
建议使用以下服务进行错误监控:
1. Sentry
2. LogRocket
3. 自建 ELK 栈

## 备份策略

### 数据库备份
```bash
# 备份 MongoDB
mongodump --db manju --out /backup/path

# 恢复 MongoDB
mongorestore --db manju /backup/path/manju
```

### 文件备份
定期备份 `uploads/` 目录到云存储或外部存储设备。