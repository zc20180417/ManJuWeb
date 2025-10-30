// 导入所需模块
import axios from 'axios';  // HTTP客户端库，用于发送HTTP请求

// 外部 API 配置
const API_CONFIG = {
  BASE_URL: 'https://api.bltcy.ai',  // API基础URL
  TIMEOUT: 30000                      // 请求超时时间（毫秒）
};

// 创建 axios 实例，配置基础URL、超时时间和默认请求头
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,      // 设置基础URL
  timeout: API_CONFIG.TIMEOUT,       // 设置请求超时时间
  headers: {
    'Content-Type': 'application/json'  // 设置默认请求头为JSON格式
  }
});

// 图片生成 API 调用函数
// 接收请求数据和API密钥作为参数
export const callImageGenerationAPI = async (data: any, apiKey: string) => {
  try {
    // 发送POST请求到图片生成接口
    const response = await apiClient.post('/v1/images/generations', data, {
      headers: {
        'Authorization': `Bearer ${apiKey}`  // 在请求头中添加API密钥认证
      }
    });
    return response.data;  // 返回响应数据
  } catch (error: any) {
    // 错误处理：抛出包含详细错误信息的错误
    throw new Error(`图片生成 API 调用失败: ${error.response?.data?.message || error.message}`);
  }
};

// 视频生成 API 调用函数
// 接收请求数据和API密钥作为参数
export const callVideoGenerationAPI = async (data: any, apiKey: string) => {
  try {
    // 发送POST请求到视频生成接口
    const response = await apiClient.post('/v2/videos/generations', data, {
      headers: {
        'Authorization': `Bearer ${apiKey}`  // 在请求头中添加API密钥认证
      }
    });
    return response.data;  // 返回响应数据
  } catch (error: any) {
    // 错误处理：抛出包含详细错误信息的错误
    throw new Error(`视频生成 API 调用失败: ${error.response?.data?.message || error.message}`);
  }
};

// 检查图片生成状态的 API 调用函数
// 接收任务ID和API密钥作为参数
export const checkImageStatus = async (taskId: string, apiKey: string) => {
  try {
    // 发送GET请求到图片生成状态查询接口
    const response = await apiClient.get(`/v1/images/generations/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`  // 在请求头中添加API密钥认证
      }
    });
    return response.data;  // 返回响应数据
  } catch (error: any) {
    // 错误处理：抛出包含详细错误信息的错误
    throw new Error(`图片状态检查失败: ${error.response?.data?.message || error.message}`);
  }
};

// 检查视频生成状态的 API 调用函数
// 接收任务ID和API密钥作为参数
export const checkVideoStatus = async (taskId: string, apiKey: string) => {
  try {
    // 发送GET请求到视频生成状态查询接口
    const response = await apiClient.get(`/v2/videos/generations/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`  // 在请求头中添加API密钥认证
      }
    });
    return response.data;  // 返回响应数据
  } catch (error: any) {
    // 错误处理：抛出包含详细错误信息的错误
    throw new Error(`视频状态检查失败: ${error.response?.data?.message || error.message}`);
  }
};

// 导出所有 API 函数，方便统一管理和使用
export const callExternalAPI = {
  imageGeneration: callImageGenerationAPI,   // 图片生成API
  videoGeneration: callVideoGenerationAPI,   // 视频生成API
  getImageStatus: checkImageStatus,          // 图片状态检查API
  getVideoStatus: checkVideoStatus           // 视频状态检查API
};