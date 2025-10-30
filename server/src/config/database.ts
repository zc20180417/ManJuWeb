// 数据库配置对象
// 包含MongoDB连接URI和连接选项
export const DATABASE_CONFIG = {
  // MongoDB连接URI
  // 如果环境变量中有MONGODB_URI则使用环境变量的值，否则使用默认的本地连接字符串
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/manju',
  // MongoDB连接选项
  options: {
    // useNewUrlParser: true,      // 使用新的URL解析器（新版本MongoDB已默认启用）
    // useUnifiedTopology: true,   // 使用统一的拓扑引擎（新版本MongoDB已默认启用）
    // 添加更多连接选项以提高连接稳定性
    serverSelectionTimeoutMS: 5000, // 服务器选择超时时间（毫秒）
    socketTimeoutMS: 45000,        // Socket超时时间（毫秒）
  }
};