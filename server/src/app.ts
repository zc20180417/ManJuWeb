// 导入所需的模块和库
import express from 'express';          // Express框架，用于构建Web应用
import cors from 'cors';               // 跨域资源共享中间件
import mongoose from 'mongoose';       // MongoDB数据库操作库
import http from 'http';               // Node.js内置HTTP模块
import { Server } from 'socket.io';    // Socket.IO实时通信库
import imageRoutes from './routes/imageRoutes';    // 图片相关路由
import videoRoutes from './routes/videoRoutes';    // 视频相关路由
import historyRoutes from './routes/historyRoutes'; // 历史记录相关路由
import { DATABASE_CONFIG } from './config/database'; // 数据库配置

// 创建Express应用实例和HTTP服务器实例
const app = express();
const server = http.createServer(app);

// 创建Socket.IO服务器实例，配置跨域选项
const io = new Server(server, {
  cors: {
    origin: "*",           // 允许所有来源的跨域请求
    methods: ["GET", "POST"]  // 允许的HTTP方法
  }
});

// 中间件配置
// 使用CORS中间件处理跨域请求
app.use(cors());
// 解析JSON格式的请求体，限制大小为50MB
app.use(express.json({ limit: '50mb' }));
// 解析URL编码的请求体，限制大小为50MB
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务配置
// 将/uploads路径映射到服务器的uploads目录，用于访问上传的文件
app.use('/uploads', express.static('uploads'));

// 路由配置
// 挂载图片相关API路由到/api/images路径
app.use('/api/images', imageRoutes);
// 挂载视频相关API路由到/api/videos路径
app.use('/api/videos', videoRoutes);
// 挂载历史记录相关API路由到/api/history路径
app.use('/api/history', historyRoutes);

// Socket.io 连接处理
// 监听客户端连接事件
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);  // 输出连接用户的Socket ID
  
  // 监听客户端断开连接事件
  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id);  // 输出断开连接用户的Socket ID
  });
});

// 数据库连接配置
console.log('正在连接到MongoDB数据库...');
mongoose.connect(DATABASE_CONFIG.uri, DATABASE_CONFIG.options as any).then(() => {
  console.log('成功连接到MongoDB数据库');
}).catch((error) => {
  console.error('MongoDB连接失败:', error);
  console.log('请确保MongoDB服务正在运行，或者在环境变量中设置正确的MONGODB_URI');
  console.log('您可以通过以下方式之一解决此问题：');
  console.log('1. 启动本地MongoDB服务');
  console.log('2. 设置环境变量MONGODB_URI指向正确的MongoDB实例');
  console.log('3. 修改config/database.ts中的默认连接字符串');
});

// 错误处理中间件
// 捕获应用中的异常错误并返回统一格式的错误响应
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);  // 在控制台输出错误堆栈信息
  res.status(500).json({ 
    success: false,            // 标识请求失败
    message: '服务器内部错误'   // 返回错误信息
  });
});

// 404 处理中间件
// 当请求的路由不存在时返回404状态码和统一格式的响应
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ 
    success: false,           // 标识请求失败
    message: '接口不存在'      // 返回错误信息
  });
});

// 服务器端口配置
// 从环境变量获取端口号，如果没有设置则默认使用3002端口（避免与3001端口冲突）
const PORT = process.env.PORT || 3002;

// 启动服务器并监听指定端口
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);  // 服务器启动成功时输出日志
});

// 导出应用实例和Socket.IO实例，供其他模块使用
export { app, io };