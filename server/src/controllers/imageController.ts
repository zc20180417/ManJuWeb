// 导入所需模块
import { Request, Response } from 'express';               // Express请求和响应类型
import { ImageService } from '../services/imageService';   // 图片服务类
import { imageUpload } from '../services/storageService';  // 图片上传中间件

// 创建图片服务实例
const imageService = new ImageService();

// 导出图片控制器类
export class ImageController {
  // 生成图片接口处理方法
  // 接收请求和响应对象作为参数
  async generate(req: Request, res: Response) {
    try {
      // 从请求体中解构获取参数
      const { 
        prompt,        // 生成图片的提示词
        model,         // 使用的AI模型
        aspectRatio,   // 图片宽高比
        style,         // 图片风格
        apiKey         // API密钥
      } = req.body;
      
      // 获取上传的图片base64数据
      const images: string[] = [];
      // 检查是否有上传的文件
      if (req.files && Array.isArray(req.files)) {
        // 处理 multer 上传的文件
        for (const file of req.files) {
          // 将文件转换为base64
          // 注意：这里应该从原始请求中获取base64数据，而不是从文件路径读取
          // 为了简化，我们假设前端已经发送了base64数据
        }
      }
      
      // 如果body中有images数据，直接使用
      let imageData: string[] = [];
      if (req.body.images) {
        imageData = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
      }
      
      // 调用图片服务的generateImage方法生成图片
      const result = await imageService.generateImage({
        prompt,        // 提示词
        model,         // 模型
        aspectRatio,   // 宽高比
        style,         // 风格
        images: imageData,  // 图片数据
        apiKey         // API密钥
      });
      
      // 返回成功响应
      res.json({ 
        success: true,           // 标识请求成功
        data: result,            // 返回生成结果
        message: '图片生成任务已提交'  // 返回提示信息
      });
    } catch (error) {
      // 错误处理：返回500状态码和错误信息
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : '未知错误'  // 如果是Error实例则返回错误信息，否则返回'未知错误'
      });
    }
  }
  
  // 检查图片生成状态接口处理方法
  // 接收请求和响应对象作为参数
  async checkStatus(req: Request, res: Response) {
    try {
      // 从路由参数中获取任务ID
      const { taskId } = req.params;
      // 从请求体中获取API密钥
      const { apiKey } = req.body;
      
      // 调用图片服务的checkImageStatus方法检查生成状态
      const status = await imageService.checkImageStatus(taskId, apiKey);
      
      // 返回成功响应
      res.json({ 
        success: true,  // 标识请求成功
        data: status    // 返回状态信息
      });
    } catch (error) {
      // 错误处理：返回500状态码和错误信息
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : '未知错误'  // 如果是Error实例则返回错误信息，否则返回'未知错误'
      });
    }
  }
  
  // 获取图片生成历史记录接口处理方法
  // 接收请求和响应对象作为参数
  async getHistory(req: Request, res: Response) {
    try {
      // 从查询参数中获取分页信息，如果没有则使用默认值
      const { page = 1, limit = 10 } = req.query;
      
      // 调用图片服务的getHistory方法获取历史记录
      const history = await imageService.getHistory(Number(page), Number(limit));
      
      // 返回成功响应
      res.json({ 
        success: true,  // 标识请求成功
        data: history   // 返回历史记录数据
      });
    } catch (error) {
      // 错误处理：返回500状态码和错误信息
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : '未知错误'  // 如果是Error实例则返回错误信息，否则返回'未知错误'
      });
    }
  }
  
  // 根据ID获取图片记录接口处理方法
  // 接收请求和响应对象作为参数
  async getRecordById(req: Request, res: Response) {
    try {
      // 从路由参数中获取记录ID
      const { id } = req.params;
      
      // 调用图片服务的getRecordById方法根据ID获取记录
      const record = await imageService.getRecordById(id);
      
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
    } catch (error) {
      // 错误处理：返回500状态码和错误信息
      return res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : '未知错误'  // 如果是Error实例则返回错误信息，否则返回'未知错误'
      });
    }
  }
}