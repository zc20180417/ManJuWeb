import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useProjectContext } from '@/contexts/projectContext';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';

export default function VideoCreator() {
  const { currentProject, updateProject } = useProjectContext();
  const { isDark } = useTheme();
  const { apiKeys, setApiKey } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [backgroundMusic, setBackgroundMusic] = useState('');
  const [transitions, setTransitions] = useState([
    '无', '淡入淡出', '滑动', '缩放', '旋转', '擦除', '溶解'
  ]);
  const [selectedTransition, setSelectedTransition] = useState('淡入淡出');
  const [audioVolume, setAudioVolume] = useState(0.5);
  const [videoGenerationProgress, setVideoGenerationProgress] = useState(0);
  // 添加模拟模式开关
  const [isSimulationMode, setIsSimulationMode] = useState(true);
  
  // 添加AI视频生成模型选择
  const [videoModels] = useState([
    { id: 'runway', name: 'Runway Gen-2', apiEndpoint: 'https://api.runwayml.com/v1/generate/video' },
    { id: 'pika', name: 'Pika', apiEndpoint: 'https://api.pika.art/v1/videos/generate' },
    { id: 'sora', name: 'Sora (模拟)', apiEndpoint: 'https://api.openai.com/v1/videos/generate' },
    { id: 'modelscope', name: 'ModelScope', apiEndpoint: 'https://modelscope.cn/api/v1/services/arn:acs:modelscope:cn-beijing:2653929979746646:model/video-generation/v1/generate' },
    { id: 'jianying', name: '剪映AI', apiEndpoint: 'https://api.capcut.com/v1/ai/video/generate' }
  ]);
  const [selectedModel, setSelectedModel] = useState('runway');
  const [showAPIKeyModal, setShowAPIKeyModal] = useState(false);
  const [currentApiKeyInput, setCurrentApiKeyInput] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!currentProject) {
      toast.error('请先创建或选择一个项目');
      navigate('/script-writer');
    }
  }, [currentProject, navigate]);

  useEffect(() => {
    if (currentProject?.videoUrl) {
      setVideoUrl(currentProject.videoUrl);
    }
    
    // 清理动画
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentProject]);
  
  // 处理API密钥保存
  const handleSaveApiKey = () => {
    setApiKey(selectedModel, currentApiKeyInput);
    setShowAPIKeyModal(false);
    setCurrentApiKeyInput('');
    toast.success(`${videoModels.find(m => m.id === selectedModel)?.name || selectedModel} API密钥已保存`);
  };

  const generateVideo = async () => {
    if (!currentProject) {
      toast.error('请先创建或选择一个项目');
      return;
    }
    
    // 检查是否所有场景都有图像
    const scenesWithoutImages = currentProject.scenes.filter((scene: any) => !scene.imageUrl);
    if (scenesWithoutImages.length > 0) {
      toast.error(`还有${scenesWithoutImages.length}个场景没有图像，请先完成图像生成`);
      return;
    }
    
    // 在非模拟模式下检查API密钥
    if (!isSimulationMode) {
      const hasApiKey = apiKeys[selectedModel]?.trim() !== '';
      
      if (!hasApiKey) {
        setCurrentApiKeyInput('');
        setShowAPIKeyModal(true);
        toast.info(`请输入${videoModels.find(m => m.id === selectedModel)?.name || selectedModel}的API密钥`);
        return;
      }
    }

    setIsGenerating(true);
    setVideoGenerationProgress(0);
    const modelName = videoModels.find(m => m.id === selectedModel)?.name || selectedModel;
    toast.info(`正在使用${modelName}${isSimulationMode ? '（模拟模式）' : ''}生成视频，请稍候...`);

    try {
      // 根据模式选择调用方式
      if (isSimulationMode) {
        await simulateVideoGeneration(currentProject);
      } else {
        await realVideoGeneration(currentProject, selectedModel);
      }
    } catch (error) {
      setIsGenerating(false);
      toast.error(`视频生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };
  
  // 模拟视频生成过程 - 增强版，包含进度显示
  const simulateVideoGeneration = (project: any): Promise<void> => {
    return new Promise((resolve) => {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setVideoGenerationProgress(prev => {
          const newProgress = prev + 2;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return newProgress;
        });
      }, 160);

      // 模拟视频生成过程
      setTimeout(() => {
        clearInterval(progressInterval);
        setVideoGenerationProgress(100);
        
        // 生成示例视频URL
        const encodedPrompt = encodeURIComponent(`${project.title} ${project.description}`);
        const generatedVideoUrl = `https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=${encodedPrompt}_video_thumbnail`;
        
        setVideoUrl(generatedVideoUrl);
        
        // 更新项目中的视频URL
        updateProject({
          ...project,
          videoUrl: generatedVideoUrl
        });
        
        setIsGenerating(false);
        toast.success('视频生成成功');
        resolve();
      }, 8000); // 模拟较长的处理时间
    });
  };
  
  // 真实视频生成调用框架（模拟真实调用过程，但不实际发送请求）
  const realVideoGeneration = async (project: any, model: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setVideoGenerationProgress(prev => {
          const newProgress = prev + 2;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return newProgress;
        });
      }, 160);

      // 模拟视频生成过程和可能的错误
      setTimeout(() => {
        clearInterval(progressInterval);
        setVideoGenerationProgress(100);
        
        // 随机模拟成功或失败（70%成功率）
        if (Math.random() > 0.3) {
          // 成功情况，使用与模拟模式相同的生成逻辑
          simulateVideoGeneration(project).then(() => {
            setIsGenerating(false);
            resolve();
          });
        } else {
          // 失败情况，模拟不同类型的错误
          const errors = [
            "视频生成失败，处理资源不足，请尝试减少场景数量或降低质量",
            "API调用超时，视频生成需要较长时间，请稍后再试",
            "服务器暂时不可用，请稍后再试",
            "请求被限制，免费账户有生成次数限制"
          ];
          const randomError = errors[Math.floor(Math.random() * errors.length)];
          setIsGenerating(false);
          reject(new Error(randomError));
        }
      }, 9000); // 真实调用通常稍慢一些
    });
  };

  const playPreview = () => {
    if (!currentProject || currentProject.scenes.length === 0) {
      return;
    }
    
    setIsPlaying(true);
    startTimeRef.current = Date.now();
    
    const animate = () => {
      if (!isPlaying) return;
      
      const elapsed = (Date.now() - startTimeRef.current) / 1000 * playbackSpeed;
      let totalDuration = 0;
      
      for (let i = 0; i < currentProject.scenes.length; i++) {
        totalDuration += currentProject.scenes[i].duration;
        if (elapsed < totalDuration) {
          setCurrentSceneIndex(i);
          break;
        }
      }
      
      // 如果播放完毕，循环播放
      if (elapsed >= totalDuration) {
        startTimeRef.current = Date.now();
        setCurrentSceneIndex(0);
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  const pausePreview = () => {
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handleDownloadVideo = () => {
    if (!videoUrl) {
      toast.error('没有可下载的视频');
      return;
    }
    
    // 模拟下载过程
    toast.info('正在准备下载...');
    
    setTimeout(() => {
      toast.success('视频下载已开始');
      // 在实际应用中，这里会触发真实的文件下载
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = `${currentProject?.title || 'storyvision'}_video.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 1000);
  };

  const handleShareVideo = () => {
    if (!videoUrl) {
      toast.error('没有可分享的视频');
      return;
    }
    
    // 模拟分享功能
    toast.info('分享链接已复制到剪贴板');
    navigator.clipboard.writeText(videoUrl).catch(() => {
      toast.error('复制失败，请手动复制链接');
    });
  };

  if (!currentProject) {
    return null;
  }

  const currentScene = currentProject.scenes[currentSceneIndex];
  const totalDuration = currentProject.scenes.reduce((sum: number, scene: any) => sum + scene.duration, 0);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
      {/* 顶部导航栏 */}
      <nav className={`sticky top-0 z-50 backdrop-blur-md ${isDark ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-200'} border-b px-6 py-4`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center">
              <i className="fas fa-video text-white"></i>
            </div>
            <h1 className="text-xl font-bold">视频合成</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* 添加模式切换开关 */}
            <div className="flex items-center">
              <span className={`text-sm mr-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {isSimulationMode ? '模拟模式' : '真实API模式'}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  value={!isSimulationMode} 
                  onChange={() => setIsSimulationMode(!isSimulationMode)}
                  className="sr-only peer" 
                  disabled={isGenerating}
                />
                <div className={`w-11 h-6 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} peer-focus:outline-none transition-colors duration-300 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:${isDark ? 'bg-amber-600' : 'bg-amber-500'}`}></div>
              </label>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShareVideo}
              disabled={!videoUrl || isGenerating}
              className={`px-4 py-2 rounded-lg transition-colors ${
                !videoUrl || isGenerating
                  ? isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'
                  : isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              <i className="fas fa-share-alt mr-2"></i>分享
            </motion.button>
            
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
              <i className="fas fa-download mr-2"></i>下载
            </motion.button>
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 项目信息 */}
        <div className={`mb-8 p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h2 className="text-2xl font-bold mb-2">{currentProject.title}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} flex items-center`}>
              <i className="fas fa-film text-amber-500 mr-3"></i>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">场景数</p>
                 <p className="text-xl font-bold">{currentProject.scenes.length}个</p>
              </div>
            </div>
            
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} flex items-center`}>
              <i className="fas fa-clock text-amber-500 mr-3"></i>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">视频时长</p>
                <p className="text-xl font-bold">{totalDuration}秒</p>
              </div>
            </div>
            
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} flex items-center`}>
              <i className="fas fa-music text-amber-500 mr-3"></i>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">背景音乐</p><p className="text-xl font-bold">{backgroundMusic ? '已添加' : '未添加'}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 视频预览 */}
          <div className={`lg:col-span-2 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold">视频预览</h2>
            </div>
            
            <div className="p-6">
              <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 aspect-video mb-6">
                {isGenerating ? (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full border-4 border-t-amber-500 border-r-transparent border-b-amber-500 border-l-transparent animate-spin mb-4"></div>
                    <p className="text-lg font-medium">正在生成视频...</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">这可能需要几分钟时间</p>
                    
                    {/* 显示视频生成进度条 */}
                    <div className="w-full max-w-md mt-6 px-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span>处理中...</span>
                        <span>{videoGenerationProgress}%</span>
                      </div>
                      <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <motion.div 
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${videoGenerationProgress}%` }}
                          transition={{ duration: 0.1 }}
                        ></motion.div>
                      </div>
                    </div>
                  </div>
                ) : videoUrl ? (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-contain"
                    controls
                  >
                    <source src={videoUrl} type="video/mp4" />
                    您的浏览器不支持视频播放
                  </video>
                ) : (
                  <>
                    {currentScene && currentScene.imageUrl && (
                      <img
                        src={currentScene.imageUrl}
                        alt={currentScene.description}
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {/* 场景预览控制 */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-white">
                          <p className="font-medium">{currentScene?.description}</p>
                          <p className="text-sm text-gray-300">场景 {currentSceneIndex + 1}/{currentProject.scenes.length}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={isPlaying ? pausePreview : playPreview}
                            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                          >
                            {isPlaying ? (
                              <i className="fas fa-pause"></i>
                            ) : (
                              <i className="fas fa-play"></i>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {/* 进度条 */}
                      <div className="w-full bg-white/30 rounded-full h-1.5 mb-2">
                        <div 
                          className="bg-amber-500 h-1.5 rounded-full transition-all"
                          style={{ 
                            width: `${(currentSceneIndex / (currentProject.scenes.length - 1)) * 100}%` 
                          }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-xs text-white/80">
                        <span>{currentSceneIndex > 0 ? currentProject.scenes.slice(0, currentSceneIndex).reduce((sum: number, scene: any) => sum + scene.duration, 0) : 0}s</span>
                        <span>{totalDuration}s</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {/* 预览控制 */}
              {!isGenerating && !videoUrl && (
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setCurrentSceneIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentSceneIndex === 0}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentSceneIndex === 0
                        ? isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'
                        : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <i className="fas fa-chevron-left mr-2"></i>上一个场景
                  </button>
                  
                  <button
                    onClick={() => setCurrentSceneIndex(prev => Math.min(currentProject.scenes.length - 1, prev + 1))}
                    disabled={currentSceneIndex === currentProject.scenes.length - 1}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentSceneIndex === currentProject.scenes.length - 1
                        ? isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'
                        : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    下一个场景<i className="fas fa-chevron-right ml-2"></i>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* 视频设置 */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold">视频设置</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">选择视频生成模型</label>
                <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg overflow-hidden`}>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={isGenerating}
                    className={`w-full py-3 px-4 pr-10 appearance-none focus:outline-none ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}
                  >
                    {videoModels.map(model => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <i className={`fas fa-chevron-down ${isDark ? 'text-gray-400' : 'text-gray-500'}`}></i>
                  </div>
                </div>
                
                {!isSimulationMode && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setCurrentApiKeyInput(apiKeys[selectedModel] || '');
                      setShowAPIKeyModal(true);
                    }}
                    className={`mt-2 px-3 py-2 rounded-lg ${
                      apiKeys[selectedModel]?.trim() !== ''
                        ? isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                        : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                    } text-white transition-colors flex items-center`}
                    title={apiKeys[selectedModel]?.trim() !== '' ? '修改API密钥' : '设置API密钥'}
                  >
                    <i className={apiKeys[selectedModel]?.trim() !== '' ? 'fas fa-key' : 'fas fa-lock-open'}></i>
                    <span className="ml-2 text-sm">API密钥</span>
                  </motion.button>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">转场效果</label>
                <select
                  value={selectedTransition}
                  onChange={(e) => setSelectedTransition(e.target.value)}
                  className={`w-full p-3 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} border focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none`}
                >
                  {transitions.map(transition => (
                    <option key={transition} value={transition}>{transition}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">背景音乐</label>
                <div className="space-y-3">
                  {['无', '紧张', '欢快', '悲伤', '悬疑', '史诗'].map(music => (
                    <div 
                      key={music}
                      onClick={() => setBackgroundMusic(music === '无' ? '' : music)}
                      className={`p-3 rounded-lg cursor-pointer transition-all flex items-center justify-between ${
                        (backgroundMusic === music || (!backgroundMusic && music === '无'))
                          ? isDark ? 'bg-amber-900/30 border-amber-500' : 'bg-amber-50 border-amber-200'
                          : isDark ? 'bg-gray-700 hover:bg-gray-650' : 'bg-gray-50 hover:bg-gray-100'
                      } border`}
                    >
                      <div className="flex items-center gap-3">
                        {music === '无' ? (
                          <i className={`fas fa-volume-mute text-xl ${isDark ? 'text-gray-400' : 'text-gray-500'}`}></i>
                        ) : (
                          <i className={`fas fa-music text-xl ${isDark ? 'text-amber-400' : 'text-amber-500'}`}></i>
                        )}
                        <span>{music}</span>
                      </div>
                      {(backgroundMusic === music || (!backgroundMusic && music === '无')) && (
                        <i className={`fas fa-check-circle ${isDark ? 'text-amber-400' : 'text-amber-500'}`}></i>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {backgroundMusic && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">音量</label>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{Math.round(audioVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={audioVolume}
                    onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-2">播放速度</label>
                <div className="flex gap-2">
                  {[0.5, 1, 1.5, 2].map(speed => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                        playbackSpeed === speed
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20'
                          : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
              
              {isSimulationMode && (
                <p className="text-sm text-amber-500 dark:text-amber-400 flex items-center">
                  <i className="fas fa-info-circle mr-2"></i>
                  当前为模拟模式，视频生成过程为演示用
                </p>
              )}
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generateVideo}
                disabled={isGenerating || currentProject.scenes.filter((scene: any) => !scene.imageUrl).length > 0}
                className={`w-full py-4 rounded-lg transition-all font-medium text-lg ${
                  isGenerating || currentProject.scenes.filter((scene: any) => !scene.imageUrl).length > 0
                    ? isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-300 text-gray-500'
                    : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30'
                } flex items-center justify-center`}
              >
                {isGenerating ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-3 text-xl"></i>
                    正在生成视频...
                  </>
                ) : (
                  <>
                    <i className="fas fa-magic mr-3 text-xl"></i>
                    生成最终视频
                  </>
                )}
              </motion.button>
              
              {currentProject.scenes.filter((scene: any) => !scene.imageUrl).length > 0 && (
                <div className={`p-3 rounded-lg ${isDark ? 'bg-red-900/20' : 'bg-red-50'} border ${isDark ? 'border-red-800' : 'border-red-100'}`}>
                  <p className="text-sm text-red-500 flex items-center">
                    <i className="fas fa-exclamation-circle mr-2"></i>
                    还有{currentProject.scenes.filter((scene: any) => !scene.imageUrl).length}个场景没有图像，请先完成图像生成
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 底部操作按钮 */}
        {!isGenerating && videoUrl && (
          <div className="mt-8 flex justify-center">
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleShareVideo}
                className={`px-6 py-3 rounded-lg ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors flex items-center`}
              >
                <i className="fas fa-share-alt mr-2"></i>分享视频
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleDownloadVideo}
                className={`px-6 py-3 rounded-lg ${isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white transition-colors flex items-center`}
              >
                <i className="fas fa-download mr-2"></i>下载视频
              </motion.button>
            </div>
          </div>
        )}
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
              <h3 className="text-xl font-bold">设置{videoModels.find(m => m.id === selectedModel)?.name || selectedModel} API密钥</h3>
              {videoModels.find(m => m.id === selectedModel)?.apiEndpoint && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  API端点: {videoModels.find(m => m.id === selectedModel)?.apiEndpoint}
                </p>
              )}
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">API密钥</label>
                <input
                  type="password"
                  placeholder={`请输入${videoModels.find(m => m.id === selectedModel)?.name || selectedModel}的API密钥`}
                  value={currentApiKeyInput}
                  onChange={(e) => setCurrentApiKeyInput(e.target.value)}
                  className={`w-full p-3 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} border focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
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
                  className={`px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white transition-colors`}
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