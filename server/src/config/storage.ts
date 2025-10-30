/// <reference types="node" />

// 存储配置对象
// 包含本地存储和云存储的配置信息
export const STORAGE_CONFIG = {
  // 本地存储配置
  local: {
    // 基础URL，用于构建文件访问地址
    // 如果环境变量中有BASE_URL则使用环境变量的值，否则使用默认值
    baseUrl: process.env.BASE_URL || 'http://localhost:3001/uploads',
    // 图片存储路径
    imagePath: './uploads/images',
    // 视频存储路径
    videoPath: './uploads/videos'
  },
  
  // 云存储配置示例（实际使用时需要替换为真实的云存储配置）
  cloud: {
    // 云存储基础URL
    baseUrl: process.env.CLOUD_STORAGE_URL || 'https://your-cdn-domain.com/media',
    // 图片云存储URL
    imageBaseUrl: process.env.CLOUD_IMAGE_URL || 'https://your-cdn-domain.com/media/images',
    // 视频云存储URL
    videoBaseUrl: process.env.CLOUD_VIDEO_URL || 'https://your-cdn-domain.com/media/videos'
  },
  
  // 文件路径结构配置
  pathStructure: {
    // 图片路径结构
    images: {
      // 输入图片路径
      input: 'images/input',
      // 结果图片路径
      results: 'images/results'
    },
    // 视频路径结构
    videos: {
      // 输入视频路径
      input: 'videos/input',
      // 结果视频路径
      results: 'videos/results'
    }
  }
};