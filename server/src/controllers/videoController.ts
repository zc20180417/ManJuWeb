// 导入所需模块
import { Request, Response } from 'express';               // Express请求和响应类型
import { VideoService } from '../services/videoService';   // 视频服务类

// 创建视频服务实例
const videoService = new VideoService();

// 导出视频控制器类
export class VideoController {
  // 生成视频接口处理方法
  // 接收请求和响应对象作为参数
  async generate(req: Request, res: Response) {
    try {
      // 从请求体中解构获取参数
      const { 
        prompt,          // 生成视频的提示词
        model,           // 使用的AI模型
        aspectRatio,     // 视频宽高比
        hd,              // 是否高清
        duration,        // 视频时长
        enhancePrompt,   // 是否增强提示词
        watermark,       // 是否添加水印
        apiKey           // API密钥
      } = req.body;
      
      // 获取上传的图片base64数据
      let imageData: string[] = [];
      // 如果请求体中有图片数据，则使用这些数据
      if (req.body.images) {
        imageData = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
      }
      
      // 调用视频服务的generateVideo方法生成视频
      const result = await videoService.generateVideo({
        prompt,          // 提示词
        model,           // 模型
        images: imageData,  // 图片数据
        aspectRatio,     // 宽高比
        hd: hd === 'true' || hd === true,           // 转换为布尔值
        duration,        // 时长
        enhancePrompt: enhancePrompt === 'true' || enhancePrompt === true,  // 转换为布尔值
        watermark: watermark === 'true' || watermark === true,  // 转换为布尔值
        apiKey           // API密钥
      });
      
      // 返回成功响应
      res.json({ 
        success: true,            // 标识请求成功
        data: result,             // 返回生成结果
        message: '视频生成任务已提交'   // 返回提示信息
      });
    } catch (error: any) {
      // 错误处理：返回500状态码和错误信息
      res.status(500).json({ 
        success: false, 
        message: error.message  // 返回错误信息
      });
    }
  }
  
  // 检查视频生成状态接口处理方法
  // 接收请求和响应对象作为参数
  async checkStatus(req: Request, res: Response) {
    try {
      // 从路由参数中获取任务ID
      const { taskId } = req.params;
      // 从请求体中获取API密钥
      const { apiKey } = req.body;
      
      // 调用视频服务的checkVideoStatus方法检查生成状态
      const status = await videoService.checkVideoStatus(taskId, apiKey);
      
      // 返回成功响应
      res.json({ 
        success: true,  // 标识请求成功
        data: status    // 返回状态信息
      });
    } catch (error: any) {
      // 错误处理：返回500状态码和错误信息
      res.status(500).json({ 
        success: false, 
        message: error.message  // 返回错误信息
      });
    }
  }
  
  // 获取视频生成历史记录接口处理方法
  // 接收请求和响应对象作为参数
  async getHistory(req: Request, res: Response) {
    try {
      // 从查询参数中获取分页信息，如果没有则使用默认值
      const { page = 1, limit = 10 } = req.query;
      
      // 调用视频服务的getHistory方法获取历史记录
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
  
  // 根据ID获取视频记录接口处理方法
  // 接收请求和响应对象作为参数
  async getRecordById(req: Request, res: Response) {
    try {
      // 从路由参数中获取记录ID
      const { id } = req.params;
      
      // 调用视频服务的getRecordById方法根据ID获取记录
      const record = await videoService.getRecordById(id);
      
      // 如果记录不存在，返回404状态码
      if (!record) {
        return res.status(404).json({ 
          success: false, 
          message: '记录不存在'  // 返回错误信息
        });
      }
      
      // 返回成功响应
      return res.json({ 
        success: true,  // 标识请求成功
        data: record    // 返回记录数据
      });
    } catch (error: any) {
      // 错误处理：返回500状态码和错误信息
      return res.status(500).json({ 
        success: false, 
        message: error.message  // 返回错误信息
      });
    }
  }
}