import React, { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { AuthContext } from '@/contexts/authContext';

// 定义视频历史记录接口
interface VideoHistory {
  id: string;
  prompt: string;
  videoUrl: string;
  aspectRatio: string;
  hd: boolean;
  duration: string;
  enhancePrompt: boolean; // VEO3特有参数
  enableUpsample: boolean; // VEO3特有参数
  model: string; // 添加模型信息
  sora2SubModel: string; // Sora2子模型
  veo3SubModel: string; // VEO3子模型
  createdAt: Date;
}

export default function TextToVideo() {
  const { isDark } = useTheme();
  const { apiKeys, setApiKey } = useContext(AuthContext);
  
  const [inputText, setInputText] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAPIKeyModal, setShowAPIKeyModal] = useState(false);
  const [currentApiKeyInput, setCurrentApiKeyInput] = useState('');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0); // 改为数字类型
  const [videoHistory, setVideoHistory] = useState<VideoHistory[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  
  // 新增的状态变量
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [hd, setHd] = useState(false);
  const [duration, setDuration] = useState('10');
  const [enhancePrompt, setEnhancePrompt] = useState(true); // VEO3特有参数
  const [enableUpsample, setEnableUpsample] = useState(true); // VEO3特有参数
  const [sora2SubModel, setSora2SubModel] = useState('sora-2'); // Sora2子模型
  const [veo3SubModel, setVeo3SubModel] = useState('veo3.1'); // VEO3子模型
  
  // Sora2 和 VEO3 模型配置
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
    const savedHistory = localStorage.getItem('text-to-video-history');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        // 转换日期字符串为Date对象，并清理URL中的空格
        const historyWithDates = parsedHistory.map((item: any) => ({
          ...item,
          videoUrl: item.videoUrl.replace(/\s/g, ''), // 清理URL中的空格
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
    localStorage.setItem('text-to-video-history', JSON.stringify(history));
  };

  // 添加新生成的视频到历史记录
  const addToHistory = (prompt: string, url: string) => {
    // 清理URL中的空格
    const cleanedUrl = url.replace(/\s/g, '');
    
    const newHistoryItem: VideoHistory = {
      id: Date.now().toString(),
      prompt,
      videoUrl: cleanedUrl,
      aspectRatio,
      hd,
      duration,
      enhancePrompt, // VEO3特有参数
      enableUpsample, // VEO3特有参数
      model: selectedModel, // 保存模型信息
      sora2SubModel, // 保存Sora2子模型
      veo3SubModel, // 保存VEO3子模型
      createdAt: new Date()
    };
    
    const updatedHistory = [newHistoryItem, ...videoHistory.slice(0, 9)]; // 保留最近10条记录
    setVideoHistory(updatedHistory);
    saveHistoryToLocalStorage(updatedHistory);
  };

  // 处理API密钥保存
  const handleSaveApiKey = () => {
    setApiKey(selectedModel, currentApiKeyInput);
    setShowAPIKeyModal(false);
    setCurrentApiKeyInput('');
    toast.success(`${aiModels.find(m => m.id === selectedModel)?.name || selectedModel} API密钥已保存`);
  };

  // 生成视频
  const handleGenerateVideo = async () => {
    if (!inputText.trim()) {
      toast.error('请输入文本内容');
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
    const modelName = aiModels.find(m => m.id === selectedModel)?.name || selectedModel;
    
    toast(`正在使用${modelName}生成视频...`, {
      duration: 0,
      description: `请求将发送到: ${aiModels.find(m => m.id === selectedModel)?.apiEndpoint}`
    });

    try {
      // 调用真实的Sora2 API 或 VEO3 API
      await callSora2Api();
    } catch (error) {
      setIsGenerating(false);
      
      toast.error(`视频生成失败: ${error instanceof Error ? error.message : '未知错误'}`, {
        duration: 5000
      });
    }
  };

  // 调用真实的Sora2 API 或 VEO3 API
  const callSora2Api = async (): Promise<void> => {
    const apiKey = apiKeys[selectedModel];
    
    if (!apiKey) {
      throw new Error('API密钥未设置');
    }

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${apiKey}`);
    myHeaders.append("Content-Type", "application/json");

    let raw;
    
    // 根据选择的模型构造不同的请求体
    if (selectedModel === SORA2_MODEL) {
      const requestBody: any = {
        "prompt": inputText,
        "model": sora2SubModel, // 使用子模型
        "aspect_ratio": aspectRatio
      };
      
      // 根据子模型添加特定参数
      if (sora2SubModel === 'sora-2-pro') {
        requestBody.hd = hd;
        requestBody.duration = duration;
      }
      // sora-2 不支持 hd 和 duration 参数
      
      raw = JSON.stringify(requestBody);
    } else if (selectedModel === VEO3_MODEL) {
      raw = JSON.stringify({
        "prompt": inputText,
        "model": veo3SubModel, // 使用VEO3子模型
        "aspect_ratio": aspectRatio,
        "enhance_prompt": enhancePrompt,
        "enable_upsample": enableUpsample
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
              addToHistory(inputText, cleanedUrl); // 添加到历史记录
              setIsGenerating(false);
              if (intervalId) clearInterval(intervalId);
              toast.success('视频生成成功！');
            }
          } else if (result.status === 'FAILED') {
            setIsGenerating(false);
            if (intervalId) clearInterval(intervalId);
            toast.error(`视频生成失败: ${result.fail_reason || '未知错误'}`);
          }
        } catch (error) {
          console.error('状态查询错误:', error);
          setIsGenerating(false);
          if (intervalId) clearInterval(intervalId);
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
  }, [taskId, apiKeys, selectedModel, inputText, aspectRatio, hd, duration, enhancePrompt, enableUpsample, sora2SubModel]);

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
      const cleanedUrl = selectedVideo.videoUrl.replace(/\s/g, '');
      
      setVideoUrl(cleanedUrl);
      setInputText(selectedVideo.prompt);
      setAspectRatio(selectedVideo.aspectRatio);
      setHd(selectedVideo.hd);
      setDuration(selectedVideo.duration);
      setEnhancePrompt(selectedVideo.enhancePrompt); // VEO3特有参数
      setEnableUpsample(selectedVideo.enableUpsample); // VEO3特有参数
      setSelectedModel(selectedVideo.model); // 设置模型
      setSora2SubModel(selectedVideo.sora2SubModel); // 设置Sora2子模型
      setVeo3SubModel(selectedVideo.veo3SubModel); // 设置VEO3子模型
      setSelectedHistoryId(videoId);
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
            <h1 className="text-xl font-bold">文生视频</h1>
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
          {/* 文本输入区域 */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold">文本输入</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">输入描述文本，AI将根据内容生成视频</p>
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

              {/* 子模型选择区域 - 独立一行显示 */}
              {(selectedModel === SORA2_MODEL || selectedModel === VEO3_MODEL) && (
                <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h3 className="font-medium mb-3">子模型选择</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Sora2子模型选择 */}
                    {selectedModel === SORA2_MODEL && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Sora2子模型</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSora2SubModel('sora-2')}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                              sora2SubModel === 'sora-2'
                                ? isDark ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                                : isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            sora-2
                          </button>
                          <button
                            onClick={() => setSora2SubModel('sora-2-pro')}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                              sora2SubModel === 'sora-2-pro'
                                ? isDark ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                                : isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            sora-2-pro
                          </button>
                        </div>
                        {/* 价格显示 */}
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <p>sora-2: 0.1/次 | sora-2-pro: 1.7/次</p>
                        </div>
                      </div>
                    )}
                    
                    {/* VEO3子模型选择 */}
                    {selectedModel === VEO3_MODEL && (
                      <div>
                        <label className="block text-sm font-medium mb-2">VEO3子模型</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setVeo3SubModel('veo3.1')}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                              veo3SubModel === 'veo3.1'
                                ? isDark ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                                : isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            veo3.1
                          </button>
                          <button
                            onClick={() => setVeo3SubModel('veo3.1-pro')}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                              veo3SubModel === 'veo3.1-pro'
                                ? isDark ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                                : isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            veo3.1-pro
                          </button>
                        </div>
                        {/* 子模型描述信息 */}
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {veo3SubModel === 'veo3.1' ? (
                            <p>Google最新的高级人工智能模型, veo3 快速 模式，支持视频自动配套音频生成，质量高价格很低，性价比最高的选择, 自适应首帧和文生视频</p>
                          ) : (
                            <p>Google最新的高级人工智能模型, veo3 高质量 模式，支持视频自动配套音频生成，质量超高，价格也超高，使用需注意, 自适应首帧和文生视频</p>
                          )}
                        </div>
                        {/* 价格显示 */}
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <p>veo3.1: 1.5/次 | veo3.1-pro: 3/次</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 参数设置区域 */}
              <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className="font-medium mb-3">视频参数设置</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            {duration === '25' && (
                              <p className="text-xs text-amber-500 dark:text-amber-400 mt-1">
                                提示：当时长为25秒时，高清选项将不起作用
                              </p>
                            )}
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
                              <button
                                onClick={() => setDuration('25')}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                                  duration === '25'
                                    ? isDark ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                                    : isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                25
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {/* 增强提示 - VEO3 特有 */}
                      <div>
                        <label className="block text-sm font-medium mb-2">增强提示</label>
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
                      
                      {/* 超分辨率 - VEO3 特有 */}
                      <div>
                        <label className="block text-sm font-medium mb-2">超分辨率</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEnableUpsample(true)}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                              enableUpsample
                                ? isDark ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                                : isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            开启
                          </button>
                          <button
                            onClick={() => setEnableUpsample(false)}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                              !enableUpsample
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

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className={`w-full h-64 p-4 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} border focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none`}
                placeholder="请输入视频描述文本，例如：一个美丽的日落场景，海浪轻拍着沙滩..."
                spellCheck={false}
              ></textarea>
              
              <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} shadow-sm`}>
                <h3 className="text-sm font-medium mb-2">使用提示：</h3>
                <ul className="text-sm space-y-1 list-disc pl-5 text-gray-600 dark:text-gray-300">
                  <li>输入详细的描述文本可以获得更好的视频生成效果</li>
                  <li>建议描述包含场景、动作、氛围等元素</li>
                  <li>需要设置Sora2模型的API密钥才能使用生成功能</li>
                  <li>API密钥仅保存在您的浏览器本地，确保安全</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* 视频展示区域 */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold">视频展示</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">生成的视频将在此处展示</p>
            </div>
            
            <div className="p-6">
              <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 aspect-video flex items-center justify-center">
                {isGenerating ? (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-purple-500 border-l-transparent animate-spin mb-4"></div>
                    <p className="text-lg font-medium">正在生成视频...</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">这可能需要几分钟时间</p>
                    {taskId && (
                      <div className="mt-4 w-full max-w-md">
                        <div className="flex justify-between text-xs mb-1">
                          <span>处理中...</span>
                          <span>{progress}%</span>
                        </div>
                        <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <motion.div 
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3 }}
                          ></motion.div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                          任务ID: {taskId}
                        </p>
                      </div>
                    )}
                  </div>
                ) : videoUrl ? (
                  <video
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                    loop
                  >
                    <source src={videoUrl} type="video/mp4" />
                    您的浏览器不支持视频播放
                  </video>
                ) : (
                  <div className="text-center p-8">
                    <i className={`fas fa-video-slash text-4xl mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}></i>
                    <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>尚未生成视频</p>
                    <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>在左侧输入文本并点击"生成视频"按钮开始</p>
                  </div>
                )}
              </div>
              
              {videoUrl && !isGenerating && (
                <div className="mt-6">
                  <h3 className="font-medium mb-2">视频信息</h3>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <p className="text-sm break-all">
                      <span className="font-medium">视频URL:</span> {videoUrl.replace(/\s/g, '')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* API密钥设置模态框 */}
      {showAPIKeyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={`w-full max-w-md rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl overflow-hidden`}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold">设置{aiModels.find(m => m.id === selectedModel)?.name || selectedModel} API密钥</h3>
              {aiModels.find(m => m.id === selectedModel)?.apiEndpoint && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  API端点: {aiModels.find(m => m.id === selectedModel)?.apiEndpoint}
                </p>
              )}
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">API密钥</label>
                <input
                  type="password"
                  placeholder={`请输入${aiModels.find(m => m.id === selectedModel)?.name || selectedModel}的API密钥`}
                  value={currentApiKeyInput}
                  onChange={(e) => setCurrentApiKeyInput(e.target.value)}
                  className={`w-full p-3 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} border focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  autoFocus
                />
              </div>
              
              <div className={`mb-6 p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <i className="fas fa-info-circle mr-2"></i>
                  API密钥将安全保存在您的浏览器本地，不会上传到我们的服务器。
                </p>
                <p className="text-sm text-amber-500 dark:text-amber-400 mt-2">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  请确保您输入的API密钥正确，错误的密钥将导致视频生成失败。
                </p>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAPIKeyModal(false)}
                  className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                >
                  取消
                </button>
                
                <button
                  onClick={handleSaveApiKey}
                  className={`px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 text-white transition-colors`}
                >
                  保存
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}