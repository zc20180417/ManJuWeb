// 导入所需模块
import multer from 'multer';              // 文件上传中间件
import path from 'path';                  // 路径处理模块
import { v4 as uuidv4 } from 'uuid';     // UUID生成器，用于生成唯一文件名
import { ensureDirExists } from '../utils/fileUtils';  // 确保目录存在的工具函数
import { STORAGE_CONFIG } from '../config/storage';    // 存储配置

// 确保存储目录存在，避免后续文件保存时出错
ensureDirExists(STORAGE_CONFIG.local.imagePath);  // 确保图片存储目录存在
ensureDirExists(STORAGE_CONFIG.local.videoPath);  // 确保视频存储目录存在

// 配置图片文件存储策略
const imageStorage = multer.diskStorage({
  // 设置文件存储目录
  destination: (req, file, cb) => {
    // 构建图片上传路径，按日期组织文件夹
    const uploadPath = path.join(STORAGE_CONFIG.local.imagePath, 'input', getCurrentDatePath());
    ensureDirExists(uploadPath);  // 确保上传目录存在
    cb(null, uploadPath);         // 回调函数返回上传目录路径
  },
  // 设置文件名
  filename: (req, file, cb) => {
    // 生成唯一文件名，保留原始文件扩展名
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);  // 回调函数返回唯一文件名
  }
});

// 配置视频文件存储策略
const videoStorage = multer.diskStorage({
  // 设置文件存储目录
  destination: (req, file, cb) => {
    // 构建视频上传路径，按日期组织文件夹
    const uploadPath = path.join(STORAGE_CONFIG.local.videoPath, 'input', getCurrentDatePath());
    ensureDirExists(uploadPath);  // 确保上传目录存在
    cb(null, uploadPath);         // 回调函数返回上传目录路径
  },
  // 设置文件名
  filename: (req, file, cb) => {
    // 生成唯一文件名，保留原始文件扩展名
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);  // 回调函数返回唯一文件名
  }
});

// 创建图片上传的 multer 实例
export const imageUpload = multer({ 
  storage: imageStorage,  // 使用上面定义的图片存储策略
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制文件大小为10MB
  },
  fileFilter: (req, file, cb) => {
    // 文件过滤器，只允许图片文件上传
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);  // 允许上传
    } else {
      cb(new Error('只允许上传图片文件'));  // 拒绝上传并返回错误信息
    }
  }
});

// 创建视频上传的 multer 实例
export const videoUpload = multer({ 
  storage: videoStorage,  // 使用上面定义的视频存储策略
  limits: {
    fileSize: 100 * 1024 * 1024 // 限制文件大小为100MB
  },
  fileFilter: (req, file, cb) => {
    // 文件过滤器，只允许视频文件上传
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);  // 允许上传
    } else {
      cb(new Error('只允许上传视频文件'));  // 拒绝上传并返回错误信息
    }
  }
});

// 获取当前日期路径的私有函数
// 返回格式为"年/月"的路径字符串，用于按日期组织文件
const getCurrentDatePath = (): string => {
  const now = new Date();  // 获取当前日期
  return path.join(
    now.getFullYear().toString(),                           // 年份
    (now.getMonth() + 1).toString().padStart(2, '0')       // 月份（补零）
  );
};