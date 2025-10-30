// 导入所需模块
import express from 'express';                                    // Express框架
import { HistoryController } from '../controllers/historyController';  // 历史记录控制器

// 创建路由实例
const router = express.Router();
// 创建历史记录控制器实例
const historyController = new HistoryController();

// 定义历史记录相关的API路由

// GET /api/history/images - 获取图片生成历史记录接口
// 调用historyController的getImageHistory方法获取图片历史记录
router.get('/images', historyController.getImageHistory);

// GET /api/history/videos - 获取视频生成历史记录接口
// 调用historyController的getVideoHistory方法获取视频历史记录
router.get('/videos', historyController.getVideoHistory);

// GET /api/history/all - 获取所有历史记录接口
// 调用historyController的getAllHistory方法获取所有类型的歷史記錄
router.get('/all', historyController.getAllHistory);

// 导出路由实例供其他模块使用
export default router;