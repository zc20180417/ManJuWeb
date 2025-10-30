// 导入所需模块
import fs from 'fs';        // 文件系统模块，用于文件操作
import path from 'path';    // 路径处理模块
import { v4 as uuidv4 } from 'uuid';  // UUID生成器，用于生成唯一文件名

// 确保目录存在的函数
// 检查指定路径的目录是否存在，如果不存在则递归创建
export const ensureDirExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {  // 检查目录是否存在
    fs.mkdirSync(dirPath, { recursive: true });  // 递归创建目录
  }
};

// 保存 base64 图片到文件的异步函数
// 接收base64数据和上传目录作为参数，返回保存的文件名
export const saveBase64Image = async (base64Data: string, uploadDir: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 移除 base64 前缀（如"data:image/png;base64,"）
    const base64Image = base64Data.split(';base64,').pop();
    // 如果没有有效的base64数据，则拒绝Promise
    if (!base64Image) {
      reject(new Error('Invalid base64 data'));
      return;
    }
    
    // 生成唯一文件名，使用UUID确保文件名唯一性
    const fileName = `${uuidv4()}.png`;
    // 构建完整的文件路径
    const filePath = path.join(uploadDir, fileName);
    
    // 确保目录存在
    ensureDirExists(uploadDir);
    
    // 将base64数据写入文件
    fs.writeFile(filePath, base64Image, { encoding: 'base64' }, (err) => {
      if (err) {
        // 如果写入失败，拒绝Promise并返回错误
        reject(err);
      } else {
        // 如果写入成功，解析Promise并返回文件名
        resolve(fileName);
      }
    });
  });
};

// 获取当前日期路径的函数 (用于文件夹组织)
// 返回格式为"年/月"的路径字符串，用于按日期组织文件
export const getCurrentDatePath = (): string => {
  const now = new Date();  // 获取当前日期
  return path.join(
    now.getFullYear().toString(),                           // 年份
    (now.getMonth() + 1).toString().padStart(2, '0')       // 月份（补零）
  );
};

// 构建文件访问 URL 的函数
// 接收基础URL、文件类型、文件名和是否为结果文件等参数，返回完整的文件访问URL
export const buildFileUrl = (baseUrl: string, fileType: 'images' | 'videos', fileName: string, isResult: boolean = false): string => {
  const datePath = getCurrentDatePath();                    // 获取日期路径
  const typePath = isResult ? 'results' : 'input';         // 根据是否为结果文件确定路径
  // 构建完整的文件访问URL
  return `${baseUrl}/${fileType}/${typePath}/${datePath}/${fileName}`;
};

// 下载远程文件并保存的异步函数
// 接收文件URL和保存路径作为参数，返回保存的文件名
export const downloadAndSaveFile = async (url: string, savePath: string): Promise<string> => {
  // 这里应该实现实际的文件下载逻辑
  // 为简化起见，我们返回一个模拟的文件名
  const fileName = `${uuidv4()}.${getFileExtension(url)}`;  // 生成带扩展名的文件名
  return fileName;
};

// 获取文件扩展名的私有函数
// 从URL中提取文件扩展名
const getFileExtension = (url: string): string => {
  // 从URL中提取扩展名部分，并转换为小写
  const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase();
  return ext || 'png';  // 如果没有扩展名则默认为png
};