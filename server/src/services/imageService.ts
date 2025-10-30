// 导入所需模块
import { ImageRecord } from '../models/ImageRecord';        // 图片记录模型
import { callExternalAPI } from '../utils/apiClient';      // 外部API调用工具
import { saveBase64Image, getCurrentDatePath, buildFileUrl } from '../utils/fileUtils';  // 文件处理工具
import { STORAGE_CONFIG } from '../config/storage';        // 存储配置
import path from 'path';                                   // 路径处理模块
import { v4 as uuidv4 } from 'uuid';                       // UUID生成器

// 导出图片服务类
export class ImageService {
  // 处理图片生成请求的方法
  async generateImage(data: {
    prompt: string;        // 生成图片的提示词
    model: string;         // 使用的AI模型
    aspectRatio: string;   // 图片宽高比
    style: string;         // 图片风格
    images?: string[];     // base64编码的图片（可选）
    apiKey: string;        // API密钥
  }) {
    try {
      // 1. 保存上传的图片到服务器并获取文件名
      const imageFileNames = await this.saveImagesAndGetFileNames(data.images);
      
      // 2. 构建公网可访问的URL
      const imageUrls = imageFileNames.map(name => 
        buildFileUrl(STORAGE_CONFIG.local.baseUrl, 'images', name)  // 根据配置构建文件访问URL
      );
      
      // 3. 调用外部API生成图片
      const apiRequestData = {
        prompt: data.prompt,        // 提示词
        model: data.model,          // 模型
        aspect_ratio: data.aspectRatio,  // 宽高比
        style: data.style,          // 风格
        images: imageUrls           // 使用公网URL
      };
      
      // 调用外部API的图片生成接口
      const apiResponse = await callExternalAPI.imageGeneration(apiRequestData, data.apiKey);
      
      // 4. 保存记录到数据库 (只存储文件名，不存储完整URL)
      const record = new ImageRecord({
        prompt: data.prompt,           // 提示词
        model: data.model,             // 模型
        aspectRatio: data.aspectRatio, // 宽高比
        style: data.style,             // 风格
        inputImageNames: imageFileNames, // 只存储文件名
        taskId: apiResponse.task_id,   // 任务ID
        status: 'processing'           // 初始状态为处理中
      });
      
      // 保存记录到数据库
      await record.save();
      
      // 返回任务ID和记录ID
      return { taskId: apiResponse.task_id, recordId: record._id };
    } catch (error: unknown) {
      // 错误处理：提取错误信息并抛出新的错误
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`图片生成失败: ${errorMessage}`);
    }
  }
  
  // 轮询检查图片生成状态的方法
  async checkImageStatus(taskId: string, apiKey: string) {
    try {
      // 调用外部API检查图片生成状态
      const statusResponse = await callExternalAPI.getImageStatus(taskId, apiKey);
      
      // 根据任务ID查找数据库中的记录
      const record = await ImageRecord.findOne({ taskId });
      if (record) {
        // 更新记录状态
        record.status = statusResponse.status;
        // 如果生成成功，保存结果图片
        if (statusResponse.status === 'success') {
          // 保存结果图片并获取文件名
          const resultFileName = await this.saveResultImage(statusResponse.data[0].url);
          record.resultImageName = resultFileName; // 只存储文件名
        }
        // 保存更新后的记录
        await record.save();
      }
      
      // 返回状态信息
      return statusResponse;
    } catch (error: unknown) {
      // 错误处理：提取错误信息并抛出新的错误
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`状态检查失败: ${errorMessage}`);
    }
  }
  
  // 保存结果图片到服务器并返回文件名的私有方法
  private async saveResultImage(url: string): Promise<string> {
    try {
      // 构建保存路径
      const datePath = getCurrentDatePath();  // 获取当前日期路径
      const saveDir = path.join(STORAGE_CONFIG.local.imagePath, 'results', datePath);  // 构建结果图片保存目录
      const fileName = await saveBase64Image(url, saveDir);  // 保存图片并获取文件名
      return fileName;
    } catch (error: unknown) {
      // 错误处理：提取错误信息并抛出新的错误
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`保存结果图片失败: ${errorMessage}`);
    }
  }
  
  // 保存上传图片并返回文件名的私有方法
  private async saveImagesAndGetFileNames(images: string[] = []): Promise<string[]> {
    const fileNames: string[] = [];  // 存储文件名的数组
    // 遍历所有上传的图片
    for (let i = 0; i < images.length; i++) {
      try {
        // 构建保存路径
        const datePath = getCurrentDatePath();  // 获取当前日期路径
        const saveDir = path.join(STORAGE_CONFIG.local.imagePath, 'input', datePath);  // 构建输入图片保存目录
        const fileName = await saveBase64Image(images[i], saveDir);  // 保存图片并获取文件名
        fileNames.push(fileName);  // 将文件名添加到数组中
      } catch (error: unknown) {
        // 错误处理：提取错误信息并抛出新的错误
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`保存上传图片失败: ${errorMessage}`);
      }
    }
    return fileNames;  // 返回文件名数组
  }
  
  // 获取图片生成历史记录的方法
  async getHistory(page: number = 1, limit: number = 10) {
    try {
      // 从数据库中查找图片记录，按创建时间倒序排列，支持分页
      const records = await ImageRecord.find()
        .sort({ createdAt: -1 })      // 按创建时间倒序排列
        .limit(limit)                 // 限制返回记录数
        .skip((page - 1) * limit);    // 跳过前面的记录实现分页
      
      // 获取总记录数
      const total = await ImageRecord.countDocuments();
      
      // 返回记录和分页信息
      return {
        records,        // 图片记录数组
        pagination: {
          page,         // 当前页码
          limit,        // 每页记录数
          total         // 总记录数
        }
      };
    } catch (error: unknown) {
      // 错误处理：提取错误信息并抛出新的错误
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`获取历史记录失败: ${errorMessage}`);
    }
  }
  
  // 根据ID获取单个图片记录的方法
  async getRecordById(id: string) {
    try {
      // 根据ID从数据库中查找图片记录
      const record = await ImageRecord.findById(id);
      return record;  // 返回找到的记录
    } catch (error: unknown) {
      // 错误处理：提取错误信息并抛出新的错误
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`获取记录失败: ${errorMessage}`);
    }
  }
}