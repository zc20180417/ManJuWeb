// 导入所需模块
import mongoose, { Document, Schema } from 'mongoose';  // Mongoose库用于MongoDB操作

// 定义视频记录接口，继承自Document但排除model方法以避免与我们的model属性冲突
// 使用 Omit 排除 Document 中的 model 方法，避免与我们的 model 属性冲突
export interface IVideoRecord extends Omit<Document, 'model'> {
  prompt: string;              // 生成视频的提示词
  model: string;               // 使用的AI模型名称
  inputImageNames: string[];   // 存储上传图片的文件名数组
  aspectRatio?: string;        // 视频宽高比（可选）
  hd?: boolean;                // 是否高清（可选）
  duration?: string;           // 视频时长（可选）
  enhancePrompt?: boolean;     // 是否增强提示词（可选）
  watermark?: boolean;         // 是否添加水印（可选）
  resultVideoName?: string;    // 存储结果视频的文件名（可选）
  taskId: string;              // 任务ID，用于查询生成状态
  status: 'pending' | 'processing' | 'success' | 'failed';  // 任务状态
  createdAt: Date;             // 记录创建时间
  updatedAt: Date;             // 记录更新时间
}

// 定义视频记录的Mongoose Schema
const VideoRecordSchema: Schema = new Schema({
  // 提示词字段，字符串类型，必填
  prompt: { type: String, required: true },
  // 模型字段，字符串类型，必填
  model: { type: String, required: true },
  // 输入图片文件名数组，每个元素为字符串类型
  inputImageNames: [{ type: String }],
  // 宽高比字段，字符串类型，可选
  aspectRatio: { type: String },
  // 是否高清字段，布尔类型，可选
  hd: { type: Boolean },
  // 视频时长字段，字符串类型，可选
  duration: { type: String },
  // 是否增强提示词字段，布尔类型，可选
  enhancePrompt: { type: Boolean },
  // 是否添加水印字段，布尔类型，可选
  watermark: { type: Boolean },
  // 结果视频文件名，字符串类型，可选
  resultVideoName: { type: String },
  // 任务ID字段，字符串类型，必填
  taskId: { type: String, required: true },
  // 状态字段，字符串类型，枚举值限定为四种状态，默认为'pending'
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'success', 'failed'],  // 状态枚举值
    default: 'pending'  // 默认状态为等待中
  }
}, {
  // 添加时间戳选项，自动管理createdAt和updatedAt字段
  timestamps: true
});

// 创建并导出视频记录模型
export const VideoRecord = mongoose.model<IVideoRecord>('VideoRecord', VideoRecordSchema);