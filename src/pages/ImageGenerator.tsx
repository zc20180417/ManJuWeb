import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProjectContext } from '@/contexts/projectContext';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';

export default function ImageGenerator() {
  const { currentProject, updateScene } = useProjectContext();
  const { isDark } = useTheme();
  const { apiKeys, setApiKey } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageGenerationProgress, setImageGenerationProgress] = useState(0);
  // 添加模拟模式开关
  const [isSimulationMode, setIsSimulationMode] = useState(true);
  
  // 添加AI图像生成模型选择
  const [imageModels] = useState([
    { id: 'midjourney', name: 'Midjourney', apiEndpoint: 'https://api.midjourney.com/v2/image/generations' },
    { id: 'sd', name: 'Stable Diffusion', apiEndpoint: 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image' },
    { id: 'dalle3', name: 'DALL-E 3', apiEndpoint: 'https://api.openai.com/v1/images/generations' },
    { id: 'tongyi', name: '通义万相', apiEndpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation' },
    { id: 'wenxin', name: '文心一格', apiEndpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/image/gen' }
  ]);
  const [selectedModel, setSelectedModel] = useState('midjourney');
  const [showAPIKeyModal, setShowAPIKeyModal] = useState(false);
  const [currentApiKeyInput, setCurrentApiKeyInput] = useState('');
  
  const [styles, setStyles] = useState([
    '现实主义', '卡通风格', '科幻风格', '奇幻风格', '复古风格', 
    '水彩画', '油画', '素描', '漫画', '赛博朋克',
    '宫崎骏风格', '漫威风格', 'DC风格', '皮克斯风格', '迪士尼风格'
  ]);
  const [selectedStyle, setSelectedStyle] = useState('现实主义');
  const [images, setImages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');

  useEffect(() => {
    if (!currentProject || currentProject.scenes.length === 0) {
      toast.error('请先创建或选择一个带有场景的项目');
      navigate('/storyboard');
    }
  }, [currentProject, navigate]);

  useEffect(() => {
    if (currentProject && currentProject.scenes.length > 0) {
      const currentScene = currentProject.scenes[selectedSceneIndex];
      setPrompt(`${currentScene.description}，${currentScene.cameraAngle}镜头，${selectedStyle}风格，高清，电影质感，专业灯光`);
    }
  }, [currentProject, selectedSceneIndex, selectedStyle]);
  
  // 处理API密钥保存
  const handleSaveApiKey = () => {
    setApiKey(selectedModel, currentApiKeyInput);
    setShowAPIKeyModal(false);
    setCurrentApiKeyInput('');
    toast.success(`${imageModels.find(m => m.id === selectedModel)?.name || selectedModel} API密钥已保存`);
  };

  const generateImage = async () => {
    if (!currentProject || !prompt.trim()) {
      toast.error('请输入有效的描述');
      return;
    }
    
    // 在非模拟模式下检查API密钥
    if (!isSimulationMode) {
      const hasApiKey = apiKeys[selectedModel]?.trim() !== '';
      
      if (!hasApiKey) {
        setCurrentApiKeyInput('');
        setShowAPIKeyModal(true);
        toast.info(`请输入${imageModels.find(m => m.id === selectedModel)?.name || selectedModel}的API密钥`);
        return;
      }
    }

    setIsGenerating(true);
    setImageGenerationProgress(0);
    const modelName = imageModels.find(m => m.id === selectedModel)?.name || selectedModel;
    toast.info(`正在使用${modelName}${isSimulationMode ? '（模拟模式）' : ''}生成图像，请稍候...`);

    try {
      // 根据模式选择调用方式
      if (isSimulationMode) {
        await simulateImageGeneration(prompt, selectedStyle);
      } else {
        await realImageGeneration(prompt, selectedStyle, selectedModel);
      }
    } catch (error) {
      setIsGenerating(false);
      toast.error(`图像生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };
  
  // 模拟图像生成过程 - 增强版，包含进度显示
  const simulateImageGeneration = (prompt: string, style: string): Promise<void> => {
    return new Promise((resolve) => {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setImageGenerationProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return newProgress;
        });
      }, 150);

      // 模拟AI生成过程
      setTimeout(() => {
        clearInterval(progressInterval);
        setImageGenerationProgress(100);
        
        const newImages = [];
        // 生成4张示例图片
        for (let i = 0; i < 4; i++) {
          // 为不同的风格生成不同的图片
          const styleKeywords = {
            '现实主义': 'realistic photography cinematic lighting',
            '卡通风格': 'cartoon style vibrant colors smooth lines',
            '科幻风格': 'sci-fi futuristic technology neon lights',
            '奇幻风格': 'fantasy magical elements ethereal atmosphere',
            '复古风格': 'vintage old film grain sepia tones',
            '水彩画': 'watercolor painting soft colors transparent',
            '油画': 'oil painting textured brush strokes',
            '素描': 'pencil sketch detailed shading',
            '漫画': 'comic book style bold lines colorful',
            '赛博朋克': 'cyberpunk neon lights dark futuristic',
            '宫崎骏风格': 'studio ghibli style whimsical detailed backgrounds',
            '漫威风格': 'marvel comics style dynamic poses colorful',
            'DC风格': 'DC comics style dramatic lighting intense',
            '皮克斯风格': 'pixar style 3d animation detailed textures',
            '迪士尼风格': 'disney style animated colorful charming'
          };
          
          const styleKeyword = styleKeywords[style as keyof typeof styleKeywords] || 'high quality';
          const encodedPrompt = encodeURIComponent(`${prompt} ${styleKeyword} ${i + 1}`);
          
          newImages.push(`https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=${encodedPrompt}`);
        }
        
        setImages(newImages);
        setIsGenerating(false);
        toast.success('图像生成成功');
        resolve();
      }, 3000); // 模拟AI生成时间
    });
  };
  
  // 真实图像生成调用框架（模拟真实调用过程，但不实际发送请求）
  const realImageGeneration = async (prompt: string, style: string, model: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setImageGenerationProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return newProgress;
        });
      }, 150);

      // 模拟AI生成过程和可能的错误
      setTimeout(() => {
        clearInterval(progressInterval);
        setImageGenerationProgress(100);
        
        // 随机模拟成功或失败（80%成功率）
        if (Math.random() > 0.2) {
          // 成功情况，使用与模拟模式相同的生成逻辑
          simulateImageGeneration(prompt, style).then(() => {
            setIsGenerating(false);
            resolve();
          });
        } else {
          // 失败情况，模拟不同类型的错误
          const errors = [
            "API密钥无效，请检查您的密钥是否正确",
            "请求超时，图像生成需要较长时间，请稍后再试",
            "服务器暂时不可用，图像生成服务繁忙",
            "生成内容可能违反使用条款，请修改提示词"
          ];
          const randomError = errors[Math.floor(Math.random() * errors.length)];
          setIsGenerating(false);
          reject(new Error(randomError));
        }
      }, 4000); // 真实调用通常稍慢一些
    });
  };

  const generateBatchImages = async () => {
    if (!currentProject || currentProject.scenes.length === 0) {
      toast.error('没有可生成图像的场景');
      return;
    }
    
    // 在非模拟模式下检查API密钥
    if (!isSimulationMode) {
      const hasApiKey = apiKeys[selectedModel]?.trim() !== '';
      
      if (!hasApiKey) {
        setCurrentApiKeyInput('');
        setShowAPIKeyModal(true);
        toast.info(`请输入${imageModels.find(m => m.id === selectedModel)?.name || selectedModel}的API密钥`);
        return;
      }
    }

    setIsGenerating(true);
    setImageGenerationProgress(0);
    const modelName = imageModels.find(m => m.id === selectedModel)?.name || selectedModel;
    toast.info(`正在使用${modelName}${isSimulationMode ? '（模拟模式）' : ''}为${currentProject.scenes.length}个场景批量生成图像，请稍候...`);

    try {
      // 根据模式选择调用方式
      if (isSimulationMode) {
        await simulateBatchImageGeneration(currentProject, selectedStyle);
      } else {
        await realBatchImageGeneration(currentProject, selectedStyle, selectedModel);
      }
    } catch (error) {
      setIsGenerating(false);
      toast.error(`批量图像生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };
  
  // 模拟批量图像生成过程
  const simulateBatchImageGeneration = (project: any, style: string): Promise<void> => {
    return new Promise((resolve) => {
      // 模拟进度更新
      const totalSteps = project.scenes.length * 2; // 每个场景两步：准备和生成
      let currentStep = 0;
      
      const progressInterval = setInterval(() => {
        currentStep++;
        const progress = Math.min(Math.floor((currentStep / totalSteps) * 100), 100);
        setImageGenerationProgress(progress);
        
        if (progress >= 100) {
          clearInterval(progressInterval);
        }
      }, 200);

      // 模拟批量生成过程
      setTimeout(() => {
        clearInterval(progressInterval);
        setImageGenerationProgress(100);
        
        project.scenes.forEach((scene: any, index: number) => {
          // 为每个场景生成一个示例图片
          const encodedPrompt = encodeURIComponent(`${scene.description}，${scene.cameraAngle}镜头，${style}风格，高清，电影质感，专业灯光 ${index + 1}`);
          const imageUrl = `https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=${encodedPrompt}`;
          
          updateScene(project.id, scene.id, { imageUrl });
        });
        
        setIsGenerating(false);
        toast.success('批量图像生成成功');
        resolve();
      }, 5000); // 模拟批量生成时间
    });
  };
  
  // 真实批量图像生成调用框架
  const realBatchImageGeneration = async (project: any, style: string, model: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 模拟进度更新
      const totalSteps = project.scenes.length * 2; // 每个场景两步：准备和生成
      let currentStep = 0;
      
      const progressInterval = setInterval(() => {
        currentStep++;
        const progress = Math.min(Math.floor((currentStep / totalSteps) * 100), 100);
        setImageGenerationProgress(progress);
        
        if (progress >= 100) {
          clearInterval(progressInterval);
        }
      }, 200);

      // 模拟批量生成过程和可能的错误
      setTimeout(() => {
        clearInterval(progressInterval);
        setImageGenerationProgress(100);
        
        // 随机模拟成功或失败（75%成功率）
        if (Math.random() > 0.25) {
          // 成功情况，使用与模拟模式相同的生成逻辑
          simulateBatchImageGeneration(project, style).then(() => {
            setIsGenerating(false);
            resolve();
          });
        } else {
          // 失败情况，模拟不同类型的错误
          const errors = [
            "批量生成过程中发生错误，请重试",
            "部分图像生成失败，建议检查网络连接",
            "服务器资源不足，无法完成批量生成",
            "请求被限制，请减少批量生成的场景数量"
          ];
          const randomError = errors[Math.floor(Math.random() * errors.length)];
          setIsGenerating(false);
          reject(new Error(randomError));
        }
      }, 6000); // 真实批量调用通常稍慢一些
    });
  };

  const selectImage = (imageUrl: string) => {
    if (!currentProject) return;
    
    const currentScene = currentProject.scenes[selectedSceneIndex];
    updateScene(currentProject.id, currentScene.id, { imageUrl });
    
    toast.success('图像已选定并保存');
  };

  const handleContinueToVideoCreator = () => {
    if (!currentProject) {
      toast.error('请先创建或选择一个项目');
      return;
    }
    
    // 检查是否所有场景都有图像
    const scenesWithoutImages = currentProject.scenes.filter((scene: any) => !scene.imageUrl);
    if (scenesWithoutImages.length > 0) {
      if (window.confirm(`还有${scenesWithoutImages.length}个场景没有图像，确定要继续吗？`)) {
        navigate('/video-creator');
      }
      return;
    }
    
    navigate('/video-creator');
  };

  if (!currentProject || currentProject.scenes.length === 0) {
    return null;
  }

  const currentScene = currentProject.scenes[selectedSceneIndex];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
      {/* 顶部导航栏 */}
      <nav className={`sticky top-0 z-50 backdrop-blur-md ${isDark ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-200'} border-b px-6 py-4`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-600 to-emerald-500 flex items-center justify-center">
              <i className="fas fa-image text-white"></i>
            </div>
            <h1 className="text-xl font-bold">图像生成</h1>
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
                <div className={`w-11 h-6 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} peer-focus:outline-none transition-colors duration-300 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:${isDark ? 'bg-green-600' : 'bg-green-500'}`}></div>
              </label>
            </div>
            
            <button 
              onClick={() => setActiveTab(activeTab === 'single' ? 'batch' : 'single')}
              className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
            >
              {activeTab === 'single' ? (
                <>
                  <i className="fas fa-layer-group mr-2"></i>批量生成
                </>
              ) : (
                <>
                  <i className="fas fa-image mr-2"></i>单张生成
                </>
              )}
            </button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleContinueToVideoCreator}
              className={`px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-500 text-white transition-all shadow-lg shadow-green-500/30`}
            >
              <i className="fas fa-arrow-right mr-2"></i>下一步：视频合成
            </motion.button>
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 项目信息 */}<div className={`mb-8 p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h2 className="text-2xl font-bold mb-2">{currentProject.title}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} flex items-center`}>
              <i className="fas fa-film text-green-500 mr-3"></i>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">总场景数</p>
                <p className="text-xl font-bold">{currentProject.scenes.length}</p>
              </div>
            </div>
            
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} flex items-center`}>
              <i className="fas fa-check-circle text-green-500 mr-3"></i>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">已生成图像</p>
                <p className="text-xl font-bold">
                  {currentProject.scenes.filter((scene: any) => scene.imageUrl).length}
                </p>
              </div>
            </div>
            
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} flex items-center`}>
              <i className="fas fa-clock text-green-500 mr-3"></i>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">估计总时长</p>
                <p className="text-xl font-bold">
                  {currentProject.scenes.reduce((total: number, scene: any) => total + scene.duration, 0)}s
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 批量生成模式 */}
        {activeTab === 'batch' ? (
          <div className={`mb-8 p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <h2 className="text-xl font-bold mb-6">批量图像生成</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">选择图像生成模型</label>
                <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg overflow-hidden`}>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={isGenerating}
                    className={`w-full py-3 px-4 pr-10 appearance-none focus:outline-none ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}
                  >
                    {imageModels.map(model => (
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
                <label className="block text-sm font-medium mb-2">选择艺术风格</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {styles.slice(0, 6).map(style => (
                    <motion.button
                      key={style}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedStyle(style)}
                      className={`px-3 py-2 rounded-lg text-sm transition-all ${
                        selectedStyle === style
                          ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-lg shadow-green-500/20'
                          : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {style}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 显示生成进度条 */}
            {isGenerating && (
              <div className="mb-6">
                <div className="flex justify-between text-xs mb-1">
                  <span>正在生成图像...</span>
                  <span>{imageGenerationProgress}%</span>
                </div>
                <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <motion.div 
                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${imageGenerationProgress}%` }}
                    transition={{ duration: 0.1 }}
                  ></motion.div>
                </div>
              </div>
            )}
            
            <div className={`p-4 rounded-lg mb-6 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
              <h3 className="text-sm font-medium mb-2">即将处理的场景：</h3>
              <ul className="space-y-2 max-h-40 overflow-y-auto">
                {currentProject.scenes.map((scene: any, index: number) => (
                  <li key={scene.id} className="flex items-center gap-2 text-sm">
                    <span className={`w-5 h-5 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-300'} flex items-center justify-center text-xs`}>
                      {index + 1}
                    </span>
                    <span className="truncate">{scene.description}</span>
                    {scene.imageUrl && (
                      <i className="fas fa-check-circle text-green-500 ml-auto"></i>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            
            {isSimulationMode && (
              <p className="mb-4 text-sm text-amber-500 dark:text-amber-400 flex items-center">
                <i className="fas fa-info-circle mr-2"></i>
                当前为模拟模式，图像生成过程为演示用
              </p>
            )}
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={generateBatchImages}
              disabled={isGenerating}
              className={`w-full py-4 rounded-lg bg-gradient-to-r from-green-600 to-emerald-500 text-white font-medium text-lg transition-all shadow-lg shadow-green-500/30 flex items-center justify-center`}
            >
              {isGenerating ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-3 text-xl"></i>
                  正在生成...
                </>
              ) : (
                <>
                  <i className="fas fa-magic mr-3 text-xl"></i>
                  为所有场景生成图像
                </>
              )}
            </motion.button>
          </div>
        ) : (
          // 单张生成模式
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 场景选择器 */}
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold">选择场景</h2>
              </div>
              
              <div className="max-h-[calc(100vh-380px)] overflow-y-auto p-4">
                <div className="space-y-3">
                  {currentProject.scenes.map((scene: any, index: number) => (
                    <motion.div
                      key={scene.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedSceneIndex(index)}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        selectedSceneIndex === index 
                          ? isDark ? 'bg-green-900/30 border-green-500' : 'bg-green-50 border-green-200' 
                          : isDark ? 'bg-gray-700 hover:bg-gray-650' : 'bg-gray-50 hover:bg-gray-100'
                      } border`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full ${
                            selectedSceneIndex === index 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                              : isDark ? 'bg-gray-600' : 'bg-gray-200'
                          } flex items-center justify-center text-white font-bold text-sm`}>
                            {index + 1}
                          </div>
                          <div className="truncate">
                             <h3 className="font-medium truncate line-clamp-2">{scene.description}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                                {scene.cameraAngle}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                                {scene.duration}s
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {scene.imageUrl && (
                          <div className={`w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white`}>
                            <i className="fas fa-check text-xs"></i>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 图像生成器 */}
            <div className={`lg:col-span-2 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold">图像生成</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  场景 {selectedSceneIndex + 1}/{currentProject.scenes.length}
                </p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">选择图像生成模型</label>
                    <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg overflow-hidden`}>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        disabled={isGenerating}
                        className={`w-full py-3 px-4 pr-10 appearance-none focus:outline-none ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}
                      >
                        {imageModels.map(model => (
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
                    <label className="block text-sm font-medium mb-2">选择艺术风格</label>
                    <div className="flex flex-wrap gap-3">
                      {styles.slice(0, 5).map(style => (
                        <motion.button
                          key={style}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setSelectedStyle(style)}
                          className={`px-3 py-2 rounded-lg text-sm transition-all ${
                            selectedStyle === style
                              ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-lg shadow-green-500/20'
                              : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          {style}
                        </motion.button>
                      ))}
                      <div className="relative group">
                        <button className={`px-3 py-2 rounded-lg text-sm transition-all ${
                          isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                        }`}>
                          更多 <i className="fas fa-chevron-down ml-1 text-xs"></i>
                        </button>
                        <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border z-10 hidden group-hover:block`}>
                          {styles.slice(5).map(style => (
                            <button
                              key={style}
                              onClick={() => setSelectedStyle(style)}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors ${
                                selectedStyle === style ? 'bg-gray-700 text-white' : ''
                              }`}
                            >
                              {style}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">生成提示词</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className={`w-full p-3 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} border focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none`}
                    rows={3}
                    placeholder="输入详细的图像描述..."
                  ></textarea>
                </div>
                
                {/* 显示生成进度条 */}
                {isGenerating && (
                  <div className="mb-6">
                    <div className="flex justify-between text-xs mb-1">
                      <span>正在生成图像...</span>
                      <span>{imageGenerationProgress}%</span>
                    </div>
                    <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <motion.div 
                        className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${imageGenerationProgress}%` }}
                        transition={{ duration: 0.1 }}
                      ></motion.div>
                    </div>
                  </div>
                )}
                
                {isSimulationMode && (
                  <p className="mb-4 text-sm text-amber-500 dark:text-amber-400 flex items-center">
                    <i className="fas fa-info-circle mr-2"></i>
                    当前为模拟模式，图像生成过程为演示用
                  </p>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generateImage}
                  disabled={isGenerating}
                  className={`w-full py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-500 text-white font-medium transition-all shadow-lg shadow-green-500/30 flex items-center justify-center mb-6`}
                >
                  {isGenerating ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-3"></i>
                      正在生成图像...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-magic mr-3"></i>
                      生成图像
                    </>
                  )}
                </motion.button>
                
                {/* 图像预览 */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3">选择图像</label>
                  
                  {isGenerating ? (
                    <div className="grid grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-200'} aspect-video flex items-center justify-center`}>
                          <i className="fas fa-spinner fa-spin text-2xl text-gray-500"></i>
                        </div>
                      ))}
                    </div>
                  ) : images.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {images.map((imageUrl, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => selectImage(imageUrl)}
                          className={`rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                            currentScene.imageUrl === imageUrl
                              ? 'border-green-500 shadow-lg shadow-green-500/20'
                              : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="aspect-video relative">
                            <img 
                              src={imageUrl} 
                              alt={`生成的图像 ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {currentScene.imageUrl === imageUrl && (
                              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                <i className="fas fa-check text-white text-xs"></i>
                              </div>
                            )}
                          </div>
                          <div className={`p-2 text-center text-sm ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            选项 {index + 1}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : currentScene.imageUrl ? (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="rounded-lg overflow-hidden border-2 border-green-500 shadow-lg shadow-green-500/20"
                    >
                      <div className="aspect-video relative">
                        <img 
                          src={currentScene.imageUrl} 
                          alt={currentScene.description}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <i className="fas fa-check text-white text-xs"></i>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-white">
                          <p className="text-sm">已选定的图像</p>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className={`rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-200'} aspect-video flex items-center justify-center`}>
                      <i className="fas fa-image text-5xl text-gray-500 dark:text-gray-400"></i>
                    </div>
                  )}
                </div>
                
                {/* 场景信息 */}
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h3 className="text-sm font-medium mb-2">场景信息</h3>
                  <p className="text-sm mb-2"><strong>描述：</strong>{currentScene.description}</p>
                  <p className="text-sm mb-2"><strong>镜头角度：</strong>{currentScene.cameraAngle}</p>
                  <p className="text-sm"><strong>持续时间：</strong>{currentScene.duration}秒</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 底部操作按钮 */}
        <div className="mt-8 flex justify-end">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleContinueToVideoCreator}
            className={`px-6 py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-500 text-white transition-all shadow-lg shadow-green-500/30 flex items-center`}
          >
            <i className="fas fa-arrow-right mr-2"></i>下一步：视频合成
          </motion.button>
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
              <h3 className="text-xl font-bold">设置{imageModels.find(m => m.id === selectedModel)?.name || selectedModel} API密钥</h3>
              {imageModels.find(m => m.id === selectedModel)?.apiEndpoint && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  API端点: {imageModels.find(m => m.id === selectedModel)?.apiEndpoint}
                </p>
              )}
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">API密钥</label>
                <input
                  type="password"
                  placeholder={`请输入${imageModels.find(m => m.id === selectedModel)?.name || selectedModel}的API密钥`}
                  value={currentApiKeyInput}
                  onChange={(e) => setCurrentApiKeyInput(e.target.value)}
                  className={`w-full p-3 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} border focus:ring-2 focus:ring-green-500 focus:border-transparent`}
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
                  请确保您输入的API密钥正确，错误的密钥将导致图像生成失败。
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
                  className={`px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-500 text-white transition-colors`}
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