// 导入所需模块
import { VideoRecord } from '../models/VideoRecord';        // 视频记录模型
import { callExternalAPI } from '../utils/apiClient';      // 外部API调用工具
import { saveBase64Image, getCurrentDatePath, buildFileUrl } from '../utils/fileUtils';  // 文件处理工具
import { STORAGE_CONFIG } from '../config/storage';        // 存储配置
import path from 'path';                                   // 路径处理模块
import { v4 as uuidv4 } from 'uuid';                       // UUID生成器

// 导出视频服务类
export class VideoService {
  // 处理视频生成请求的方法
  async generateVideo(data: {
    prompt: string;        // 生成视频的提示词
    model: string;         // 使用的AI模型
    images?: string[];     // base64编码的图片（可选）
    aspectRatio?: string;  // 视频宽高比（可选）
    hd?: boolean;          // 是否高清（可选）
    duration?: string;     // 视频时长（可选）
    enhancePrompt?: boolean;  // 是否增强提示词（可选）
    watermark?: boolean;   // 是否添加水印（可选）
    apiKey: string;        // API密钥
  }) {
    try {
      // 1. 保存上传的图片到服务器并获取文件名
      const imageFileNames = await this.saveImagesAndGetFileNames(data.images);
      
      // 2. 构建公网可访问的URL
      const imageUrls = imageFileNames.map(name => 
        buildFileUrl(STORAGE_CONFIG.local.baseUrl, 'images', name)  // 根据配置构建文件访问URL
      );
      
      // 3. 构建API请求数据
      const apiRequestData: any = {
        prompt: data.prompt,   // 提示词
        model: data.model,     // 模型
        images: imageUrls      // 图片URL数组
      };
      
      // 添加可选参数到请求数据中
      if (data.aspectRatio) apiRequestData.aspect_ratio = data.aspectRatio;  // 宽高比
      if (data.hd !== undefined) apiRequestData.hd = data.hd;                // 是否高清
      if (data.duration) apiRequestData.duration = data.duration;            // 视频时长
      if (data.enhancePrompt !== undefined) apiRequestData.enhance_prompt = data.enhancePrompt;  // 是否增强提示词
      if (data.watermark !== undefined) apiRequestData.watermark = data.watermark;  // 是否添加水印
      
      // 4. 调用外部API生成视频
      const apiResponse = await callExternalAPI.videoGeneration(apiRequestData, data.apiKey);
      
      // 5. 保存记录到数据库 (只存储文件名，不存储完整URL)
      const record = new VideoRecord({
        prompt: data.prompt,           // 提示词
        model: data.model,             // 模型
        inputImageNames: imageFileNames,  // 输入图片文件名数组
        aspectRatio: data.aspectRatio, // 宽高比
        hd: data.hd,                   // 是否高清
        duration: data.duration,       // 视频时长
        enhancePrompt: data.enhancePrompt,  // 是否增强提示词
        watermark: data.watermark,     // 是否添加水印
        taskId: apiResponse.task_id,   // 任务ID
        status: 'processing'            // 初始状态为处理中
      });
      
      // 保存记录到数据库
      await record.save();
      
      // 返回任务ID和记录ID
      return { taskId: apiResponse.task_id, recordId: record._id };
    } catch (error) {
      // 错误处理：提取错误信息并抛出新的错误
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`视频生成失败: ${errorMessage}`);
    }
  }
  
  // 轮询检查视频生成状态的方法
  async checkVideoStatus(taskId: string, apiKey: string) {
    try {
      // 调用外部API检查视频生成状态
      const statusResponse = await callExternalAPI.getVideoStatus(taskId, apiKey);
      
      // 根据任务ID查找数据库中的记录
      const record = await VideoRecord.findOne({ taskId });
      if (record) {
        // 更新记录状态
        record.status = statusResponse.status;
        // 如果生成成功且有输出数据，保存结果视频
        if (statusResponse.status === 'success' && statusResponse.data?.output) {
          // 保存结果视频并获取文件名
          const resultFileName = await this.saveResultVideo(statusResponse.data.output);
          record.resultVideoName = resultFileName; // 只存储文件名
        }
        // 保存更新后的记录
        await record.save();
      }
      
      // 返回状态信息
      return statusResponse;
    } catch (error) {
      // 错误处理：提取错误信息并抛出新的错误
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`状态检查失败: ${errorMessage}`);
    }
  }
  
  // 保存结果视频到服务器并返回文件名的私有方法
  private async saveResultVideo(url: string): Promise<string> {
    try {
      // 这里应该实现实际的视频下载和保存逻辑
      // 为简化起见，我们生成一个模拟的文件名
      const fileName = `video_${uuidv4()}.mp4`;
      
      // 实际实现应该下载视频并保存到指定路径
      // const datePath = getCurrentDatePath();
      // const saveDir = path.join(STORAGE_CONFIG.local.videoPath, 'results', datePath);
      // const fileName = await downloadAndSaveFile(url, saveDir);
      
      return fileName;
    } catch (error) {
      // 错误处理：提取错误信息并抛出新的错误
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`保存结果视频失败: ${errorMessage}`);
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
      } catch (error) {
        // 错误处理：提取错误信息并抛出新的错误
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`保存上传图片失败: ${errorMessage}`);
      }
    }
    return fileNames;  // 返回文件名数组
  }
  
  // 获取视频生成历史记录的方法
  async getHistory(page: number = 1, limit: number = 10) {
    try {
      // 从数据库中查找视频记录，按创建时间倒序排列，支持分页
      const records = await VideoRecord.find()
        .sort({ createdAt: -1 })      // 按创建时间倒序排列
        .limit(limit)                 // 限制返回记录数
        .skip((page - 1) * limit);    // 跳过前面的记录实现分页
      
      // 获取总记录数
      const total = await VideoRecord.countDocuments();
      
      // 返回记录和分页信息
      return {
        records,        // 视频记录数组
        pagination: {
          page,         // 当前页码
          limit,        // 每页记录数
          total         // 总记录数
        }
      };
    } catch (error) {
      // 错误处理：提取错误信息并抛出新的错误
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`获取历史记录失败: ${errorMessage}`);
    }
  }
  
  // 根据ID获取单个视频记录的方法
  async getRecordById(id: string) {
    try {
      // 根据ID从数据库中查找视频记录
      const record = await VideoRecord.findById(id);
      return record;  // 返回找到的记录
    } catch (error) {
      // 错误处理：提取错误信息并抛出新的错误
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`获取记录失败: ${errorMessage}`);
    }
  }
}