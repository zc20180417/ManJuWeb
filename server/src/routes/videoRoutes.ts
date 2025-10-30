// 导入所需模块
import express from 'express';                           // Express框架
import { VideoController } from '../controllers/videoController';  // 视频控制器
import { imageUpload } from '../services/storageService';          // 图片上传中间件（视频生成也需要上传图片）

// 创建路由实例
const router = express.Router();
// 创建视频控制器实例
const videoController = new VideoController();

// 定义视频相关的API路由

// POST /api/videos/generate - 生成视频接口
// 使用imageUpload中间件处理上传的图片文件（视频生成通常需要图片作为输入）
// 调用videoController的generate方法处理视频生成请求
router.post('/generate', imageUpload.array('images'), videoController.generate);

// POST /api/videos/status/:taskId - 检查视频生成状态接口
// :taskId是路由参数，表示任务ID
// 调用videoController的checkStatus方法检查生成状态
router.post('/status/:taskId', videoController.checkStatus);

// GET /api/videos/history - 获取视频生成历史记录接口
// 调用videoController的getHistory方法获取历史记录
router.get('/history', videoController.getHistory);

// GET /api/videos/:id - 根据ID获取视频记录接口
// :id是路由参数，表示视频记录的ID
// 调用videoController的getRecordById方法根据ID获取记录
router.get('/:id', videoController.getRecordById);

// 导出路由实例供其他模块使用
export default router;