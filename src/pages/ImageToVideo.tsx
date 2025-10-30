import React, { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { AuthContext } from '@/contexts/authContext';

// 定义视频历史记录接口
interface VideoHistory {
  id: string;
  prompt: string;
  firstFrame: string;
  lastFrame: string;
  videoUrl: string;
  aspectRatio: string;
  hd: boolean;
  duration: string;
  enhancePrompt: boolean;
  model: string;
  sora2SubModel: string;
  veo3SubModel: string;
  watermark: boolean;
  createdAt: Date;
}

export default function ImageToVideo() {
  const { isDark } = useTheme();
  const { apiKeys, setApiKey } = useContext(AuthContext);
  
  const [prompt, setPrompt] = useState('');
  const [firstFrame, setFirstFrame] = useState('');
  const [lastFrame, setLastFrame] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAPIKeyModal, setShowAPIKeyModal] = useState(false);
  const [currentApiKeyInput, setCurrentApiKeyInput] = useState('');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [videoHistory, setVideoHistory] = useState<VideoHistory[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false); // 添加错误状态
  
  // 新增的状态变量
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [hd, setHd] = useState(false);
  const [duration, setDuration] = useState('10');
  const [enhancePrompt, setEnhancePrompt] = useState(true);
  const [watermark, setWatermark] = useState(false);
  const [sora2SubModel, setSora2SubModel] = useState('sora-2'); // Sora2子模型
  const [veo3SubModel, setVeo3SubModel] = useState('veo3.1'); // VEO3子模型
  
  // 模型配置
  const SORA2_MODEL = 'sora2';
  const VEO3_MODEL = 'veo3';
  const SORA2_API_ENDPOINT = 'https://api.bltcy.ai/v2/videos/generations';
  const VEO3_API_ENDPOINT = 'https://api.bltcy.ai/v2/videos/generations';
  const SORA2_STATUS_ENDPOINT = 'https://api.bltcy.ai/v2/videos/generations/';
  const VEO3_STATUS_ENDPOINT = 'https://api.bltcy.ai/v2/videos/generations/';
  
  const [selectedModel, setSelectedModel] = useState(SORA2_MODEL);
  
  const aiModels = [
    { id: SORA2_MODEL, name: 'Sora2', apiEndpoint: SORA2_API_ENDPOINT },
    { id: VEO3_MODEL, name: 'VEO3', apiEndpoint: VEO3_API_ENDPOINT }
  ];

  // 页面加载时从localStorage加载历史记录
  useEffect(() => {
    const savedHistory = localStorage.getItem('image-to-video-history');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        // 转换日期字符串为Date对象，并清理URL中的空格
        const historyWithDates = parsedHistory.map((item: any) => ({
          ...item,
          firstFrame: item.firstFrame?.replace(/\s/g, '') || '',
          lastFrame: item.lastFrame?.replace(/\s/g, '') || '',
          videoUrl: item.videoUrl?.replace(/\s/g, '') || '',
          createdAt: new Date(item.createdAt)
        }));
        setVideoHistory(historyWithDates);
      } catch (error) {
        console.error('解析历史记录失败:', error);
      }
    }
  }, []);

  // 保存历史记录到localStorage
  const saveHistoryToLocalStorage = (history: VideoHistory[]) => {
    localStorage.setItem('image-to-video-history', JSON.stringify(history));
  };

  // 添加新生成的视频到历史记录
  const addToHistory = (prompt: string, firstFrame: string, lastFrame: string, url: string) => {
    // 清理URL中的空格
    const cleanedFirstFrame = firstFrame?.replace(/\s/g, '') || '';
    const cleanedLastFrame = lastFrame?.replace(/\s/g, '') || '';
    const cleanedUrl = url?.replace(/\s/g, '') || '';
    
    const newHistoryItem: VideoHistory = {
      id: Date.now().toString(),
      prompt,
      firstFrame: cleanedFirstFrame,
      lastFrame: cleanedLastFrame,
      videoUrl: cleanedUrl,
      aspectRatio,
      hd,
      duration,
      enhancePrompt,
      model: selectedModel,
      sora2SubModel,
      veo3SubModel,
      watermark,
      createdAt: new Date()
    };
    
    const updatedHistory = [newHistoryItem, ...videoHistory.slice(0, 9)]; // 保留最近10条记录
    setVideoHistory(updatedHistory);
    saveHistoryToLocalStorage(updatedHistory);
    setHasError(false); // 重置错误状态
  };

  // 处理API密钥保存
  const handleSaveApiKey = () => {
    setApiKey(selectedModel, currentApiKeyInput);
    setShowAPIKeyModal(false);
    setCurrentApiKeyInput('');
    setHasError(false); // 重置错误状态
    toast.success(`${aiModels.find(m => m.id === selectedModel)?.name || selectedModel} API密钥已保存`);
  };

  // 生成视频
  const handleGenerateVideo = async () => {
    if (!prompt.trim()) {
      toast.error('请输入提示词');
      return;
    }

    if (!firstFrame.trim()) {
      toast.error('请上传首帧图片');
      return;
    }

    // 检查是否有API密钥
    const hasApiKey = apiKeys[selectedModel]?.trim() !== '';
    
    // 如果没有API密钥，提示用户输入
    if (!hasApiKey) {
      setCurrentApiKeyInput('');
      setShowAPIKeyModal(true);
      toast.info(`请输入${aiModels.find(m => m.id === selectedModel)?.name || selectedModel}的API密钥`);
      return;
    }
    
    setIsGenerating(true);
    setVideoUrl('');
    setTaskId(null);
    setProgress(0);
    setHasError(false); // 重置错误状态
    const modelName = aiModels.find(m => m.id === selectedModel)?.name || selectedModel;
    
    toast(`正在使用${modelName}生成视频...`, {
      duration: 0,
      description: `请求将发送到: ${aiModels.find(m => m.id === selectedModel)?.apiEndpoint}`
    });

    try {
      // 调用图生视频API
      await callImageToVideoApi();
    } catch (error) {
      setIsGenerating(false);
      setTaskId(null); // 清除taskId，确保显示错误信息
      setHasError(true); // 设置错误状态
      
      toast.error(`视频生成失败: ${error instanceof Error ? error.message : '未知错误'}`, {
        duration: 5000
      });
    }
  };

  // 将文件转换为base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // 保留完整的base64数据URL，包括前缀
          resolve(reader.result);
        } else {
          reject(new Error('文件读取失败'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  // 处理首帧图片上传
  const handleFirstFrameUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    // 检查文件大小（限制为10MB）
    if (file.size > 10 * 1024 * 1024) {
      toast.error('图片文件大小不能超过10MB');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setFirstFrame(base64);
      toast.success('首帧图片上传成功');
    } catch (error) {
      toast.error('图片上传失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 处理尾帧图片上传
  const handleLastFrameUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      // 如果没有选择文件，清空尾帧
      setLastFrame('');
      return;
    }

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    // 检查文件大小（限制为10MB）
    if (file.size > 10 * 1024 * 1024) {
      toast.error('图片文件大小不能超过10MB');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setLastFrame(base64);
      toast.success('尾帧图片上传成功');
    } catch (error) {
      toast.error('图片上传失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 调用图生视频API
  const callImageToVideoApi = async (): Promise<void> => {
    const apiKey = apiKeys[selectedModel];
    
    if (!apiKey) {
      throw new Error('API密钥未设置');
    }

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${apiKey}`);
    myHeaders.append("Content-Type", "application/json");

    let raw;
    
    // 构造images数组，首帧是必需的，尾帧是可选的
    const images = [firstFrame];
    if (lastFrame) {
      images.push(lastFrame);
    }
    
    // 根据选择的模型构造不同的请求体
    if (selectedModel === SORA2_MODEL) {
      const requestBody: any = {
        "prompt": prompt,
        "model": sora2SubModel,
        "images": images, // 使用base64数据
        "aspect_ratio": aspectRatio
      };
      
      // 根据子模型添加特定参数
      if (sora2SubModel === 'sora-2-pro') {
        requestBody.hd = hd;
        requestBody.duration = duration;
        requestBody.watermark = watermark;
      }
      // sora-2 不支持 hd、duration 和 watermark 参数
      
      raw = JSON.stringify(requestBody);
    } else if (selectedModel === VEO3_MODEL) {
      raw = JSON.stringify({
        "prompt": prompt,
        "model": veo3SubModel,
        "enhance_prompt": enhancePrompt,
        "images": images // 使用base64数据
      });
    }

    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
    };

    // 根据选择的模型使用不同的API端点
    const apiEndpoint = selectedModel === SORA2_MODEL ? SORA2_API_ENDPOINT : VEO3_API_ENDPOINT;

    try {
      const response = await fetch(apiEndpoint, requestOptions);
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // 检查是否有task_id
      if (result.task_id) {
        setTaskId(result.task_id);
        toast.info('视频生成任务已提交，正在处理中...');
      } else {
        throw new Error('API响应中未找到task_id');
      }
    } catch (error) {
      console.error('API调用错误:', error);
      throw error;
    }
  };

  // 轮询查询视频生成状态
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    
    if (taskId) {
      intervalId = setInterval(async () => {
        try {
          const apiKey = apiKeys[selectedModel];
          if (!apiKey) {
            throw new Error('API密钥未设置');
          }

          const myHeaders = new Headers();
          myHeaders.append("Authorization", `Bearer ${apiKey}`);

          const requestOptions = {
            method: 'GET',
            headers: myHeaders,
          };

          // 根据选择的模型使用不同的状态查询端点
          const statusEndpoint = selectedModel === SORA2_MODEL ? SORA2_STATUS_ENDPOINT : VEO3_STATUS_ENDPOINT;
          
          const response = await fetch(`${statusEndpoint}${taskId}`, requestOptions);
          
          if (!response.ok) {
            throw new Error(`状态查询失败: ${response.status} ${response.statusText}`);
          }
          
          const result = await response.json();
          
          // 更新进度
          if (result.progress) {
            // 解析进度百分比
            const progressMatch = result.progress.match(/(\d+)%/);
            if (progressMatch) {
              setProgress(parseInt(progressMatch[1], 10));
            } else {
              setProgress(0);
            }
          }
          
          // 检查状态
          if (result.status === 'SUCCESS') {
            if (result.data && result.data.output) {
              // 清理URL中的空格
              const cleanedUrl = result.data.output.replace(/\s/g, '');
              setVideoUrl(cleanedUrl);
              addToHistory(prompt, firstFrame, lastFrame, cleanedUrl); // 添加到历史记录
              setIsGenerating(false);
              setHasError(false); // 重置错误状态
              if (intervalId) clearInterval(intervalId);
              setTaskId(null); // 清除taskId，防止重复触发
              toast.success('视频生成成功！');
            }
          } else if (result.status === 'FAILURE') {
            setIsGenerating(false);
            setHasError(true); // 设置错误状态
            if (intervalId) clearInterval(intervalId);
            setTaskId(null); // 清除taskId，确保显示错误信息
            toast.error(`视频生成失败: ${result.fail_reason || '未知错误'}`);
          }
        } catch (error) {
          console.error('状态查询错误:', error);
          setIsGenerating(false);
          setHasError(true); // 设置错误状态
          if (intervalId) clearInterval(intervalId);
          setTaskId(null); // 清除taskId，确保显示错误信息
          toast.error(`状态查询失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }, 5000); // 每5秒查询一次
    }
    
    // 清理函数
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [taskId, apiKeys, selectedModel, prompt, firstFrame, lastFrame]); // 更新依赖数组

  // 下载视频
  const handleDownloadVideo = async () => {
    if (!videoUrl) {
      toast.error('没有可下载的视频');
      return;
    }
    
    toast.info('正在准备下载...');
    
    try {
      // 获取视频数据
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error('视频下载失败');
      }
      
      // 转换为 blob
      const blob = await response.blob();
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `generated_video_${new Date().getTime()}.mp4`;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      
      // 清理
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('视频下载成功！');
    } catch (error) {
      console.error('下载失败:', error);
      toast.error(`下载失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 从历史记录中选择视频
  const handleSelectFromHistory = (videoId: string) => {
    const selectedVideo = videoHistory.find(video => video.id === videoId);
    if (selectedVideo) {
      // 清理URL中的空格
      const cleanedFirstFrame = selectedVideo.firstFrame?.replace(/\s/g, '') || '';
      const cleanedLastFrame = selectedVideo.lastFrame?.replace(/\s/g, '') || '';
      const cleanedUrl = selectedVideo.videoUrl?.replace(/\s/g, '') || '';
      
      setPrompt(selectedVideo.prompt);
      setFirstFrame(cleanedFirstFrame);
      setLastFrame(cleanedLastFrame);
      setVideoUrl(cleanedUrl);
      setAspectRatio(selectedVideo.aspectRatio);
      setHd(selectedVideo.hd);
      setDuration(selectedVideo.duration);
      setEnhancePrompt(selectedVideo.enhancePrompt);
      setSelectedModel(selectedVideo.model);
      setSora2SubModel(selectedVideo.sora2SubModel);
      setVeo3SubModel(selectedVideo.veo3SubModel);
      setWatermark(selectedVideo.watermark);
      setSelectedHistoryId(videoId);
      setHasError(false); // 重置错误状态
      toast.info('已从历史记录加载视频');
    }
  };

  // 获取选中的历史记录详情
  const selectedHistory = videoHistory.find(video => video.id === selectedHistoryId) || null;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
      {/* 顶部导航栏 */}
      <nav className={`sticky top-0 z-50 backdrop-blur-md ${isDark ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-200'} border-b px-6 py-4`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 flex items-center justify-center">
              <i className="fas fa-video text-white"></i>
            </div>
            <h1 className="text-xl font-bold">图生视频</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownloadVideo}
              disabled={!videoUrl || isGenerating}
              className={`px-4 py-2 rounded-lg transition-colors ${
                !videoUrl || isGenerating
                  ? isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'
                  : isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
              } text-white`}
            >
              <i className="fas fa-download mr-2"></i>下载视频
            </motion.button>
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {videoHistory.length > 0 && (
          <div className={`mb-8 rounded-xl shadow-lg overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold">历史记录</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">选择之前生成的视频记录</p>
            </div>
            <div className="p-6">
              <div className={`rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4`}>
                <label className="block text-sm font-medium mb-2">选择历史记录</label>
                <select
                  value={selectedHistoryId || ''}
                  onChange={(e) => handleSelectFromHistory(e.target.value)}
                  className={`w-full p-3 rounded-lg ${isDark ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'} border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                >
                  <option value="">请选择一条历史记录</option>
                  {videoHistory.map((video) => (
                    <option key={video.id} value={video.id}>
                      {video.prompt.substring(0, 50)}{video.prompt.length > 50 ? '...' : ''} - {new Date(video.createdAt).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 输入区域 */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold">图生视频</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">上传首帧和尾帧图片，AI将根据内容生成视频</p>
            </div>
            
            <div className="p-6">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <div className="flex flex-grow max-w-md gap-2">
                  <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg overflow-hidden flex-grow`}>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className={`w-full py-3 px-4 pr-10 appearance-none focus:outline-none ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}
                    >
                      {aiModels.map(model => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <i className={`fas fa-chevron-down ${isDark ? 'text-gray-400' : 'text-gray-500'}`}></i>
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setCurrentApiKeyInput(apiKeys[selectedModel] || '');
                      setShowAPIKeyModal(true);
                    }}
                    className={`p-3 rounded-lg ${
                      apiKeys[selectedModel]?.trim() !== ''
                        ? isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                        : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                    } text-white transition-colors`}
                    title={apiKeys[selectedModel]?.trim() !== '' ? '修改API密钥' : '设置API密钥'}
                  >
                    <i className={apiKeys[selectedModel]?.trim() !== '' ? 'fas fa-key' : 'fas fa-lock-open'}></i>
                  </motion.button>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGenerateVideo}
                  disabled={isGenerating}
                  className={`px-5 py-3 rounded-lg flex items-center ${isDark ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'} text-white transition-colors shadow-md shadow-purple-500/20`}
                >
                  {isGenerating ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>生成中...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-magic mr-2"></i>生成视频
                    </>
                  )}
                </motion.button>
              </div>

              {/* 子模型选择区域 */}
              {(selectedModel === SORA2_MODEL || selectedModel === VEO3_MODEL) && (
                <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h3 className="font-medium mb-3">子模型选择</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Sora2子模型选择 */}
                    {selectedModel === SORA2_MODEL && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Sora2子模型</label>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => setSora2SubModel('sora-2')}
                              className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors flex items-center justify-between ${
                                sora2SubModel === 'sora-2'
                                  ? isDark ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                                  : isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              <span>sora-2</span>
                              <span className="text-xs ml-2">💰0.1/次</span>
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => setSora2SubModel('sora-2-pro')}
                              className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors flex items-center justify-between ${
                                sora2SubModel === 'sora-2-pro'
                                  ? isDark ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                                  : isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              <span>sora-2-pro</span>
                              <span className="text-xs ml-2">💰1.7/次</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* VEO3子模型选择 */}
                    {selectedModel === VEO3_MODEL && (
                      <div>
                        <label className="block text-sm font-medium mb-2">VEO3子模型</label>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => setVeo3SubModel('veo3.1')}
                              className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors flex items-center justify-between ${
                                veo3SubModel === 'veo3.1'
                                  ? isDark ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                                  : isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              <span>veo3.1</span>
                              <span className="text-xs ml-2">💰1.5/次</span>
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => setVeo3SubModel('veo3.1-pro')}
                              className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors flex items-center justify-between ${
                                veo3SubModel === 'veo3.1-pro'
                                  ? isDark ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                                  : isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              <span>veo3.1-pro</span>
                              <span className="text-xs ml-2">💰3/次</span>
                            </button>
                          </div>
                        </div>
                        {/* 子模型描述信息 */}
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {veo3SubModel === 'veo3.1' ? (
                            <p>Google最新的高级人工智能模型, veo3 快速 模式，支持视频自动配套音频生成，质量高价格很低，性价比最高的选择, 自适应首帧和文生视频</p>
                          ) : (
                            <p>Google最新的高级人工智能模型, veo3 高质量 模式，支持视频自动配套音频生成，质量超高，价格也超高，使用需注意, 自适应首帧和文生视频</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 参数设置区域 */}
              <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className="font-medium mb-3">视频参数设置</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 提示词输入 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">提示词</label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className={`w-full p-3 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} border focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none`}
                      placeholder="请输入提示词，描述你想要生成的视频内容..."
                      rows={3}
                    ></textarea>
                  </div>
                  
                  {/* 图片URL输入 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">图片上传</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 图片上传区域 - 首帧 */}
                      <div className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors relative overflow-hidden ${
                        isDark 
                          ? 'border-gray-600 hover:border-purple-500 bg-gray-800' 
                          : 'border-gray-300 hover:border-purple-400 bg-gray-50'
                      }`}
                      onClick={() => document.getElementById('first-frame-upload')?.click()}
                      >
                        <input
                          id="first-frame-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleFirstFrameUpload}
                          className="hidden"
                        />
                        {firstFrame ? (
                          <div className="flex flex-col items-center w-full h-full">
                            <img 
                              src={firstFrame} 
                              alt="首帧图片" 
                              className="max-w-full max-h-32 object-contain mb-2"
                            />
                            <p className="text-sm">首帧图片已上传</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-2">
                              <i className="fas fa-upload text-gray-500 dark:text-gray-400"></i>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">点击上传首帧图片</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">支持 JPG, PNG 格式，最大10MB</p>
                          </div>
                        )}
                      </div>
                      
                      {/* 图片上传区域 - 尾帧（可选） */}
                      <div className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors relative overflow-hidden ${
                        isDark 
                          ? 'border-gray-600 hover:border-purple-500 bg-gray-800' 
                          : 'border-gray-300 hover:border-purple-400 bg-gray-50'
                      }`}
                      onClick={() => document.getElementById('last-frame-upload')?.click()}
                      >
                        <input
                          id="last-frame-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleLastFrameUpload}
                          className="hidden"
                        />
                        {lastFrame ? (
                          <div className="flex flex-col items-center w-full h-full">
                            <img 
                              src={lastFrame} 
                              alt="尾帧图片" 
                              className="max-w-full max-h-32 object-contain mb-2"
                            />
                            <p className="text-sm">尾帧图片已上传</p>
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLastFrame('');
                              }}
                              className="mt-1 text-xs text-red-500 hover:text-red-700"
                            >
                              移除
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-2">
                              <i className="fas fa-plus text-gray-500 dark:text-gray-400"></i>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">点击上传尾帧图片（可选）</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">支持 JPG, PNG 格式，最大10MB</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* 画面比例选择 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">画面比例</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAspectRatio('16:9')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                          aspectRatio === '16:9'
                            ? isDark ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                            : isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        16:9
                      </button>
                      <button
                        onClick={() => setAspectRatio('9:16')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                          aspectRatio === '9:16'
                            ? isDark ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                            : isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        9:16
                      </button>
                      {selectedModel !== SORA2_MODEL && (
                        <button
                          onClick={() => setAspectRatio('1:1')}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                            aspectRatio === '1:1'
                              ? isDark ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                              : isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          1:1
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* 根据模型显示不同的参数 */}
                  {selectedModel === SORA2_MODEL ? (
                    <>
                      {/* 根据子模型显示不同的参数 */}
                      {sora2SubModel === 'sora-2' ? (
                        <>
                          {/* 时长选择 - sora-2 特有 */}
                          <div>
                            <label className="block text-sm font-medium mb-2">时长(秒)</label>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setDuration('10')}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                                  duration === '10'
                                    ? isDark ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                                    : isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                10
                              </button>
                              <button
                                onClick={() => setDuration('15')}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                                  duration === '15'
                                    ? isDark ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                                    : isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                15
                              </button>
                            </div>
                          </div>
                          
                          {/* 水印选项 - 仅sora-2支持 */}
                          <div>
                            <label className="block text-sm font-medium mb-2">水印</label>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setWatermark(true)}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                                  watermark
                                    ? isDark ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                                    : isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                开启
                              </button>
                              <button
                                onClick={() => setWatermark(false)}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                                  !watermark
                                    ? isDark ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                                    : isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                关闭
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* HD选项 - sora-2-pro 特有 */}
                          <div>
                            <label className="block text-sm font-medium mb-2">高清</label>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setHd(true)}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                                  hd
                                    ? isDark ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                                    : isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                开启
                              </button>
                              <button
                                onClick={() => setHd(false)}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                                  !hd
                                    ? isDark ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                                    : isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                关闭
                              </button>
                            </div>
                          </div>
                          
                          {/* 时长选择 - sora-2-pro 特有 */}
                          <div>
                            <label className="block text-sm font-medium mb-2">时长(秒)</label>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setDuration('10')}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                                  duration === '10'
                                    ? isDark ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                                    : isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                10
                              </button>
                              <button
                                onClick={() => setDuration('15')}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                                  duration === '15'
                                    ? isDark ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                                    : isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                15
                              </button>
                            </div>
                          </div>
                          
                          {/* 水印选项 - sora-2-pro 特有 */}
                          <div>
                            <label className="block text-sm font-medium mb-2">水印</label>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setWatermark(true)}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                                  watermark
                                    ? isDark ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                                    : isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                开启
                              </button>
                              <button
                                onClick={() => setWatermark(false)}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                                  !watermark
                                    ? isDark ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                                    : isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                关闭
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {/* 提示词增强 - VEO3 特有 */}
                      <div>
                        <label className="block text-sm font-medium mb-2">提示词增强</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEnhancePrompt(true)}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                              enhancePrompt
                                ? isDark ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                                : isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            开启
                          </button>
                          <button
                            onClick={() => setEnhancePrompt(false)}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                              !enhancePrompt
                                ? isDark ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                                : isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            关闭
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* 预览区域 */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold">视频预览</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">生成的视频将在此处显示</p>
            </div>
            
            <div className="p-6">
              {videoUrl ? (
                <div className="space-y-4">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      src={videoUrl}
                      controls
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        console.error('视频加载失败:', e);
                        toast.error('视频加载失败，请尝试重新生成');
                      }}
                    />
                  </div>
                  
                  {selectedHistory && (
                    <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <h3 className="font-medium mb-2">视频信息</h3>
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">模型:</span> {selectedHistory.model === SORA2_MODEL ? 'Sora2' : 'VEO3'} ({selectedHistory.model === SORA2_MODEL ? selectedHistory.sora2SubModel : selectedHistory.veo3SubModel})</p>
                        <p><span className="font-medium">提示词:</span> {selectedHistory.prompt}</p>
                        <p><span className="font-medium">画面比例:</span> {selectedHistory.aspectRatio}</p>
                        <p><span className="font-medium">生成时间:</span> {new Date(selectedHistory.createdAt).toLocaleString()}</p>
                        {selectedHistory.model === SORA2_MODEL && selectedHistory.sora2SubModel === 'sora-2-pro' && (
                          <>
                            <p><span className="font-medium">高清:</span> {selectedHistory.hd ? '是' : '否'}</p>
                            <p><span className="font-medium">时长:</span> {selectedHistory.duration}秒</p>
                            <p><span className="font-medium">水印:</span> {selectedHistory.watermark ? '是' : '否'}</p>
                          </>
                        )}
                        {selectedHistory.model === VEO3_MODEL && (
                          <p><span className="font-medium">提示词增强:</span> {selectedHistory.enhancePrompt ? '是' : '否'}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`aspect-video rounded-lg flex flex-col items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="text-center p-8">
                    <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mx-auto mb-4">
                      <i className={`fas fa-video ${isDark ? 'text-gray-400' : 'text-gray-500'}`}></i>
                    </div>
                    <h3 className="text-lg font-medium mb-2">等待生成视频</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md">
                      上传首帧和尾帧图片，输入提示词，然后点击"生成视频"按钮开始创建视频内容
                    </p>
                  </div>
                </div>
              )}
              
              {/* 进度条移到视频预览框下面 */}
              {isGenerating && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between text-sm mb-2">
                    <span>视频生成中...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    ></motion.div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    视频生成可能需要几分钟时间，请耐心等待...
                  </p>
                </div>
              )}
              
              {/* 请求失败后的错误提示 */}
              {hasError && !isGenerating && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-red-500 text-center font-medium">
                    视频生成请求失败，请检查网络连接或API密钥设置后重试
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* API密钥设置模态框 */}
      {showAPIKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl max-w-md w-full p-6`}
          >
            <h2 className="text-xl font-bold mb-4">设置API密钥</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              请输入 {aiModels.find(m => m.id === selectedModel)?.name || selectedModel} 的API密钥
            </p>
            
            <input
              type="password"
              value={currentApiKeyInput}
              onChange={(e) => setCurrentApiKeyInput(e.target.value)}
              className={`w-full p-3 rounded-lg mb-4 ${
                isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'
              } border focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              placeholder="输入API密钥"
            />
            
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAPIKeyModal(false)}
                className={`p-3 rounded-lg ${
                  isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                } transition-colors`}
              >
                取消
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSaveApiKey}
                className={`p-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 text-white transition-colors`}
              >
                保存
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
