import { Project, Scene } from '@/contexts/projectContext';

/**
 * 本地文件系统管理器
 * 用于处理项目数据的本地存储和检索
 */

// 项目文件结构接口
export interface ProjectFileStructure {
  project: Project;
  assets: {
    images: { [key: string]: string }; // sceneId: imageDataUrl
    videos: { [key: string]: string }; // projectId: videoDataUrl
  };
}

/**
 * 将项目数据保存到本地文件
 * @param project 项目数据
 * @param images 图像数据（sceneId到图像数据URL的映射）
 * @param videoUrl 视频URL（如果有）
 */
export const saveProjectToLocalFile = async (
  project: Project,
  images: { [key: string]: string } = {},
  videoUrl?: string
): Promise<void> => {
  try {
    // 创建项目文件结构
    const projectData: ProjectFileStructure = {
      project,
      assets: {
        images,
        videos: videoUrl ? { [project.id]: videoUrl } : {}
      }
    };

    // 将项目数据转换为JSON字符串
    const projectJson = JSON.stringify(projectData, null, 2);
    
    // 创建Blob对象
    const blob = new Blob([projectJson], { type: 'application/json;charset=utf-8' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title || 'project'}-${project.id}.storyvision`;
    
    // 触发下载
    document.body.appendChild(a);
    a.click();
    
    // 清理
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('保存项目到本地文件失败:', error);
    throw new Error('保存项目到本地文件失败');
  }
};

/**
 * 从本地文件加载项目数据
 * @param file 本地项目文件
 * @returns 项目文件结构
 */
export const loadProjectFromFile = async (file: File): Promise<ProjectFileStructure> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const projectData: ProjectFileStructure = JSON.parse(content);
        resolve(projectData);
      } catch (error) {
        console.error('解析项目文件失败:', error);
        reject(new Error('项目文件格式不正确'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('读取项目文件失败'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * 保存图像到本地文件
 * @param imageData 图像数据URL
 * @param filename 文件名
 */
export const saveImageToLocalFile = async (imageData: string, filename: string): Promise<void> => {
  try {
    // 将数据URL转换为Blob
    const blob = await dataUrlToBlob(imageData);
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    
    // 触发下载
    document.body.appendChild(a);
    a.click();
    
    // 清理
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('保存图像到本地文件失败:', error);
    throw new Error('保存图像到本地文件失败');
  }
};

/**
 * 批量保存项目中的所有图像
 * @param project 项目数据
 * @param images 图像数据映射
 */
export const saveAllProjectImages = async (
  project: Project,
  images: { [key: string]: string }
): Promise<void> => {
  try {
    // 创建项目文件夹
    const projectFolderName = `${project.title || 'project'}_images`;
    
    // 保存每个场景的图像
    for (const scene of project.scenes) {
      if (images[scene.id]) {
        const filename = `${projectFolderName}/${scene.id}_${sanitizeFilename(scene.description.substring(0, 30))}.png`;
        await saveImageToLocalFile(images[scene.id], filename);
      }
    }
  } catch (error) {
    console.error('批量保存图像失败:', error);
    throw new Error('批量保存图像失败');
  }
};

/**
 * 保存视频到本地文件
 * @param videoData 视频数据URL
 * @param filename 文件名
 */
export const saveVideoToLocalFile = async (videoData: string, filename: string): Promise<void> => {
  try {
    // 将数据URL转换为Blob
    const blob = await dataUrlToBlob(videoData);
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    
    // 触发下载
    document.body.appendChild(a);
    a.click();
    
    // 清理
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('保存视频到本地文件失败:', error);
    throw new Error('保存视频到本地文件失败');
  }
};

/**
 * 将数据URL转换为Blob对象
 * @param dataUrl 数据URL
 * @returns Blob对象
 */
const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const response = await fetch(dataUrl);
  return await response.blob();
};

/**
 * 清理文件名中的非法字符
 * @param filename 原始文件名
 * @returns 清理后的文件名
 */
const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim();
};

/**
 * 创建项目导出包（包含所有数据和资源）
 * @param project 项目数据
 * @param images 图像数据映射
 * @param videoUrl 视频URL（如果有）
 */
export const createProjectExportPackage = async (
  project: Project,
  images: { [key: string]: string } = {},
  videoUrl?: string
): Promise<void> => {
  try {
    // 创建一个包含所有项目数据的ZIP文件（简化实现）
    // 在实际应用中，您可能需要使用JSZip等库来创建真正的ZIP文件
    
    // 保存项目主文件
    await saveProjectToLocalFile(project, images, videoUrl);
    
    // 保存所有图像
    await saveAllProjectImages(project, images);
    
    // 如果有视频，保存视频
    if (videoUrl) {
      await saveVideoToLocalFile(videoUrl, `${project.title || 'project'}_video.mp4`);
    }
    
    console.log('项目导出包创建完成');
  } catch (error) {
    console.error('创建项目导出包失败:', error);
    throw new Error('创建项目导出包失败');
  }
};