// 导入所需模块
import { Request, Response } from 'express';               // Express请求和响应类型
import { ImageService } from '../services/imageService';   // 图片服务类
import { VideoService } from '../services/videoService';   // 视频服务类

// 创建图片服务实例
const imageService = new ImageService();
// 创建视频服务实例
const videoService = new VideoService();

// 导出历史记录控制器类
export class HistoryController {
  // 获取图片历史记录接口处理方法
  // 接收请求和响应对象作为参数
  async getImageHistory(req: Request, res: Response) {
    try {
      // 从查询参数中获取分页信息，如果没有则使用默认值
      const { page = 1, limit = 10 } = req.query;
      
      // 调用图片服务的getHistory方法获取图片历史记录
      const history = await imageService.getHistory(Number(page), Number(limit));
      
      // 返回成功响应
      res.json({ 
        success: true,  // 标识请求成功
        data: history   // 返回历史记录数据
      });
    } catch (error: any) {
      // 错误处理：返回500状态码和错误信息
      res.status(500).json({ 
        success: false, 
        message: error.message  // 返回错误信息
      });
    }
  }
  
  // 获取视频历史记录接口处理方法
  // 接收请求和响应对象作为参数
  async getVideoHistory(req: Request, res: Response) {
    try {
      // 从查询参数中获取分页信息，如果没有则使用默认值
      const { page = 1, limit = 10 } = req.query;
      
      // 调用视频服务的getHistory方法获取视频历史记录
      const history = await videoService.getHistory(Number(page), Number(limit));
      
      // 返回成功响应
      res.json({ 
        success: true,  // 标识请求成功
        data: history   // 返回历史记录数据
      });
    } catch (error: any) {
      // 错误处理：返回500状态码和错误信息
      res.status(500).json({ 
        success: false, 
        message: error.message  // 返回错误信息
      });
    }
  }
  
  // 获取所有历史记录 (混合图片和视频)接口处理方法
  // 接收请求和响应对象作为参数
  async getAllHistory(req: Request, res: Response) {
    try {
      // 从查询参数中获取分页信息，如果没有则使用默认值
      const { page = 1, limit = 10 } = req.query;
      
      // 分别获取图片和视频的历史记录
      const imageHistory = await imageService.getHistory(Number(page), Number(limit));
      const videoHistory = await videoService.getHistory(Number(page), Number(limit));
      
      // 合并图片和视频记录并按创建时间倒序排序
      const allRecords = [
        // 将图片记录添加type字段标识为image
        ...imageHistory.records.map(record => ({ ...record.toObject(), type: 'image' })),
        // 将视频记录添加type字段标识为video
        ...videoHistory.records.map(record => ({ ...record.toObject(), type: 'video' }))
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());  // 按创建时间倒序排序
      
      // 返回成功响应
      res.json({ 
        success: true, 
        data: {
          records: allRecords,         // 合并后的所有记录
          pagination: imageHistory.pagination  // 分页信息（使用图片的分页信息）
        }
      });
    } catch (error: any) {
      // 错误处理：返回500状态码和错误信息
      res.status(500).json({ 
        success: false, 
        message: error.message  // 返回错误信息
      });
    }
  }
}