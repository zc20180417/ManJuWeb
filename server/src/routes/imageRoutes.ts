// 导入所需模块
import express from 'express';                           // Express框架
import { ImageController } from '../controllers/imageController';  // 图片控制器
import { imageUpload } from '../services/storageService';          // 图片上传中间件

// 创建路由实例
const router = express.Router();
// 创建图片控制器实例
const imageController = new ImageController();

// 定义图片相关的API路由

// POST /api/images/generate - 生成图片接口
// 使用imageUpload中间件处理上传的图片文件
// 调用imageController的generate方法处理图片生成请求
router.post('/generate', imageUpload.array('images'), imageController.generate);

// POST /api/images/status/:taskId - 检查图片生成状态接口
// :taskId是路由参数，表示任务ID
// 调用imageController的checkStatus方法检查生成状态
router.post('/status/:taskId', imageController.checkStatus);

// GET /api/images/history - 获取图片生成历史记录接口
// 调用imageController的getHistory方法获取历史记录
router.get('/history', imageController.getHistory);

// GET /api/images/:id - 根据ID获取图片记录接口
// :id是路由参数，表示图片记录的ID
// 调用imageController的getRecordById方法根据ID获取记录
router.get('/:id', imageController.getRecordById);

// 导出路由实例供其他模块使用
export default router;