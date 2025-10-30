// 导入所需模块
import mongoose, { Document, Schema } from 'mongoose';  // Mongoose库用于MongoDB操作

// 定义图片记录接口，继承自Document但排除model方法以避免与我们的model属性冲突
// 使用 Omit 排除 Document 中的 model 方法，避免与我们的 model 属性冲突
export interface IImageRecord extends Omit<Document, 'model'> {
  prompt: string;              // 生成图片的提示词
  model: string;               // 使用的AI模型名称
  aspectRatio: string;         // 图片宽高比
  style: string;               // 图片风格
  // 只存储文件名，不存储完整文件内容
  inputImageNames: string[];   // 存储上传图片的文件名数组
  resultImageName?: string;    // 存储结果图片的文件名（可选）
  taskId: string;              // 任务ID，用于查询生成状态
  status: 'pending' | 'processing' | 'success' | 'failed';  // 任务状态
  createdAt: Date;             // 记录创建时间
  updatedAt: Date;             // 记录更新时间
}

// 定义图片记录的Mongoose Schema
const ImageRecordSchema: Schema = new Schema({
  // 提示词字段，字符串类型，必填
  prompt: { type: String, required: true },
  // 模型字段，字符串类型，必填
  model: { type: String, required: true },
  // 宽高比字段，字符串类型，必填
  aspectRatio: { type: String, required: true },
  // 风格字段，字符串类型，必填
  style: { type: String, required: true },
  // 存储文件名而不是完整URL
  // 输入图片文件名数组，每个元素为字符串类型
  inputImageNames: [{ type: String }],
  // 结果图片文件名，字符串类型，可选
  resultImageName: { type: String },
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

// 创建并导出图片记录模型
export const ImageRecord = mongoose.model<IImageRecord>('ImageRecord', ImageRecordSchema);