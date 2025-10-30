import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { AuthContext } from '@/contexts/authContext';

// 定义历史记录接口
interface ImageHistory {
  id: string;
  prompt: string;
  imageUrl: string;
  aspectRatio: string;
  model: string;
  createdAt: Date;
}

export default function CreateImage() {
  const { isDark } = useTheme();
  const { apiKeys, setApiKey } = useContext(AuthContext);
  
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAPIKeyModal, setShowAPIKeyModal] = useState(false);
  const [currentApiKeyInput, setCurrentApiKeyInput] = useState('');
  const [imageHistory, setImageHistory] = useState<ImageHistory[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  
  // 新增的状态变量
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [selectedStyle, setSelectedStyle] = useState('现实主义'); // 新增风格状态
  const [showOriginalImage, setShowOriginalImage] = useState(false); // 控制原图模态框显示
  const [uploadedImages, setUploadedImages] = useState<string[]>([]); // 存储上传图片的base64数据
  
  // 模型配置
  const NANO_BANANA_MODEL = 'nano-banana';
  const GPT_IMAGE_1 = 'gpt-image-1';
  const NANO_BANANA_API_ENDPOINT = 'https://api.bltcy.ai/v1/images/generations';
  const GPT_IMAGE_1_API_ENDPOINT = 'https://api.bltcy.ai/v1/images/generations';
  
  const [selectedModel, setSelectedModel] = useState(NANO_BANANA_MODEL);
  
  // 定义风格选项
  const styles = [
    '现实主义', '卡通风格', '科幻风格', '奇幻风格', '复古风格', 
    '水彩画', '油画', '素描', '漫画', '赛博朋克',
    '宫崎骏风格', '漫威风格', 'DC风格', '皮克斯风格', '迪士尼风格','都市动漫风'
  ];
  
  const aiModels = [
    { id: NANO_BANANA_MODEL, name: 'Nano Banana', apiEndpoint: NANO_BANANA_API_ENDPOINT },
    { id: GPT_IMAGE_1, name: 'gpt-image-1', apiEndpoint: GPT_IMAGE_1_API_ENDPOINT },
  ];

  // 页面加载时从localStorage加载历史记录
  React.useEffect(() => {
    const savedHistory = localStorage.getItem('image-generator-history');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        // 转换日期字符串为Date对象，并清理URL中的空格
        const historyWithDates = parsedHistory.map((item: any) => ({
          ...item,
          imageUrl: item.imageUrl?.replace(/\s/g, '') || '',
          createdAt: new Date(item.createdAt)
        }));
        setImageHistory(historyWithDates);
      } catch (error) {
        console.error('解析历史记录失败:', error);
      }
    }
  }, []);

  // 保存历史记录到localStorage
  const saveHistoryToLocalStorage = (history: ImageHistory[]) => {
    localStorage.setItem('image-generator-history', JSON.stringify(history));
  };

  // 添加新生成的图片到历史记录
  const addToHistory = (prompt: string, url: string) => {
    // 清理URL中的空格
    const cleanedUrl = url?.replace(/\s/g, '') || '';
    
    const newHistoryItem: ImageHistory = {
      id: Date.now().toString(),
      prompt,
      imageUrl: cleanedUrl,
      aspectRatio,
      model: selectedModel,
      createdAt: new Date()
    };
    
    const updatedHistory = [newHistoryItem, ...imageHistory.slice(0, 9)]; // 保留最近10条记录
    setImageHistory(updatedHistory);
    saveHistoryToLocalStorage(updatedHistory);
  };

  // 处理API密钥保存
  const handleSaveApiKey = () => {
    setApiKey(selectedModel, currentApiKeyInput);
    setShowAPIKeyModal(false);
    setCurrentApiKeyInput('');
    toast.success(`${aiModels.find(m => m.id === selectedModel)?.name || selectedModel} API密钥已保存`);
  };

  // 生成图片
  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast.error('请输入提示词');
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
    setImageUrl('');
    const modelName = aiModels.find(m => m.id === selectedModel)?.name || selectedModel;
    
    toast(`正在使用${modelName}生成图片...`, {
      duration: 0,
      description: `请求将发送到: ${aiModels.find(m => m.id === selectedModel)?.apiEndpoint}`
    });

    try {
      // 调用图片生成API
      await callImageGenerationApi();
    } catch (error) {
      setIsGenerating(false);
      
      toast.error(`图片生成失败: ${error instanceof Error ? error.message : '未知错误'}`, {
        duration: 5000
      });
    }
  };

  // 调用图片生成API
  const callImageGenerationApi = async (): Promise<void> => {
    const apiKey = apiKeys[selectedModel];
    
    if (!apiKey) {
      throw new Error('API密钥未设置');
    }

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${apiKey}`);
    myHeaders.append("Content-Type", "application/json");

    // 构建请求body
    const requestBody: any = {
      "prompt": prompt,
      "model": selectedModel,
      "aspect_ratio": aspectRatio,
    };

    // 如果有上传的图片，添加到请求body中
    if (uploadedImages.length > 0) {
      requestBody.images = uploadedImages;
    }

    const raw = JSON.stringify(requestBody);

    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
    };

    const apiEndpoint = NANO_BANANA_API_ENDPOINT;

    try {
      const response = await fetch(apiEndpoint, requestOptions);
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // 检查是否有图片URL
      if (result.data && result.data[0] && result.data[0].url) {
        // 清理URL中的空格
        const cleanedUrl = result.data[0].url.replace(/\s/g, '');
        setImageUrl(cleanedUrl);
        addToHistory(prompt, cleanedUrl); // 添加到历史记录
        setIsGenerating(false);
        toast.success('图片生成成功！');
      } else {
        throw new Error('API响应中未找到图片URL');
      }
    } catch (error) {
      console.error('API调用错误:', error);
      throw error;
    }
  };

  // 下载图片
  const handleDownloadImage = async () => {
    if (!imageUrl) {
      toast.error('没有可下载的图片');
      return;
    }
    
    toast.info('正在准备下载...');
    
    try {
      // 获取图片数据
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('图片下载失败');
      }
      
      // 转换为 blob
      const blob = await response.blob();
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `generated_image_${new Date().getTime()}.png`;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      
      // 清理
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('图片下载成功！');
    } catch (error) {
      console.error('下载失败:', error);
      toast.error(`下载失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 从历史记录中选择图片
  const handleSelectFromHistory = (imageId: string) => {
    const selectedImage = imageHistory.find(image => image.id === imageId);
    if (selectedImage) {
      // 清理URL中的空格
      const cleanedUrl = selectedImage.imageUrl?.replace(/\s/g, '') || '';
      
      setPrompt(selectedImage.prompt);
      setImageUrl(cleanedUrl);
      setAspectRatio(selectedImage.aspectRatio);
      setSelectedModel(selectedImage.model);
      setSelectedHistoryId(imageId);
      toast.info('已从历史记录加载图片');
    }
  };

  // 获取选中的历史记录详情
  const selectedHistory = imageHistory.find(image => image.id === selectedHistoryId) || null;

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: string[] = [];
    let processedCount = 0;
    const len = files.length ;
    Array.from(files).forEach((file) => {
      // 检查文件类型
      if (!file.type.match('image.*')) {
        toast.error(`文件 ${file.name} 不是有效的图片格式`);
        return;
      }

      // 检查文件大小 (限制为10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`文件 ${file.name} 超过10MB大小限制`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          newImages.push(base64);
        }
        processedCount++;

        // 当所有文件都处理完毕时更新状态
        if (processedCount === len) {
          setUploadedImages(prev => [...prev, ...newImages]);
          toast.success(`成功上传 ${newImages.length} 张图片`);
        }
      };
      reader.readAsDataURL(file);
    });

    // 清空input值以便可以重复上传相同文件
    e.target.value = '';
  };

  // 移除上传的图片
  const removeUploadedImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    toast.info('图片已移除');
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
      {/* 顶部导航栏 */}
      <nav className={`sticky top-0 z-50 backdrop-blur-md ${isDark ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-200'} border-b px-6 py-4`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 flex items-center justify-center">
              <i className="fas fa-image text-white"></i>
            </div>
            <h1 className="text-xl font-bold">AI绘图</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownloadImage}
              disabled={!imageUrl || isGenerating}
              className={`px-4 py-2 rounded-lg transition-colors ${
                !imageUrl || isGenerating
                  ? isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'
                  : isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
              } text-white`}
            >
              <i className="fas fa-download mr-2"></i>下载图片
            </motion.button>
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {imageHistory.length > 0 && (
          <div className={`mb-8 rounded-xl shadow-lg overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold">历史记录</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">选择之前生成的图片记录</p>
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
                  {imageHistory.map((image) => (
                    <option key={image.id} value={image.id}>
                      {image.prompt.substring(0, 50)}{image.prompt.length > 50 ? '...' : ''} - {new Date(image.createdAt).toLocaleString()}
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
              <h2 className="text-xl font-bold">图片生成</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">输入提示词，AI将根据内容生成图片</p>
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
                  onClick={handleGenerateImage}
                  disabled={isGenerating}
                  className={`px-5 py-3 rounded-lg flex items-center ${isDark ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'} text-white transition-colors shadow-md shadow-purple-500/20`}
                >
                  {isGenerating ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>生成中...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-magic mr-2"></i>生成图片
                    </>
                  )}
                </motion.button>
              </div>

              {/* 参数设置区域 */}
              <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className="font-medium mb-3">图片参数设置</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 提示词输入 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">提示词</label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className={`w-full p-3 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} border focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none`}
                      placeholder="请输入提示词，描述你想要生成的图片内容..."
                      rows={3}
                    ></textarea>
                  </div>
                  
                  {/* 画面比例选择和风格选择 */}
                  <div className="md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 画面比例选择 */}
                      <div>
                        <label className="block text-sm font-medium mb-2">画面比例</label>
                        <div className="relative">
                          <select
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value)}
                            className={`w-full p-2 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                              isDark 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-gray-100 border-gray-200 text-gray-800'
                            } border`}
                          >
                            {['4:3', '3:4', '16:9', '9:16', '2:3', '3:2', '1:1', '4:5', '5:4', '21:9'].map((ratio) => (
                              <option key={ratio} value={ratio}>
                                {ratio}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <i className={`fas fa-chevron-down ${isDark ? 'text-gray-400' : 'text-gray-500'}`}></i>
                          </div>
                        </div>
                      </div>
                      
                      {/* 风格选择 */}
                      <div>
                        <label className="block text-sm font-medium mb-2">风格</label>
                        <div className="relative">
                          <select
                            value={selectedStyle}
                            onChange={(e) => setSelectedStyle(e.target.value)}
                            className={`w-full p-2 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                              isDark 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-gray-100 border-gray-200 text-gray-800'
                            } border`}
                          >
                            {styles.map((style) => (
                              <option key={style} value={style}>
                                {style}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <i className={`fas fa-chevron-down ${isDark ? 'text-gray-400' : 'text-gray-500'}`}></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 参考图片按钮 */}
                  <div className="md:col-span-2 mt-2">
                    <label className="block text-sm font-medium mb-2">参考图片</label>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-4 py-2 rounded-lg bg-purple-500 text-white cursor-pointer hover:bg-purple-600 transition-colors text-sm">
                        <i className="fas fa-image mr-2"></i>
                        选择参考图片
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      {uploadedImages.length > 0 && (
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          已选择 {uploadedImages.length} 张图片
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* 显示已上传的图片缩略图 */}
                  {uploadedImages.length > 0 && (
                    <div className="md:col-span-2 mt-2">
                      <div className="flex overflow-x-auto gap-2 py-2 scrollbar-hide">
                        {uploadedImages.map((image, index) => (
                          <div key={index} className="flex-shrink-0 relative">
                            <img
                              src={image}
                              alt={`上传图片 ${index + 1}`}
                              className="w-16 h-16 object-cover rounded-lg border border-gray-300"
                            />
                            <button
                              onClick={() => removeUploadedImage(index)}
                              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* 预览区域 */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold">图片预览</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">生成的图片将在此处显示</p>
            </div>
            
            <div className="p-6">
              {imageUrl ? (
                <div className="space-y-4">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                    <img
                      src={imageUrl}
                      alt="生成的图片"
                      className="max-w-full max-h-full object-contain cursor-pointer"
                      onError={(e) => {
                        console.error('图片加载失败:', e);
                        console.log('失败的图片URL:', imageUrl);
                        // 尝试清理URL并重新加载
                        const cleanedUrl = imageUrl.replace(/\s/g, '');
                        if (cleanedUrl !== imageUrl) {
                          // 如果清理后的URL不同，尝试重新设置
                          setImageUrl(cleanedUrl);
                        } else {
                          // 如果是网络连接问题，提示用户稍后重试
                          toast.error('图片加载失败，可能是网络连接问题，请稍后重试或重新生成');
                        }
                      }}
                      onLoad={() => {
                        console.log('图片加载成功');
                      }}
                      onClick={() => setShowOriginalImage(true)} // 点击显示原图
                    />
                  </div>
                  
                  {/* 添加重试按钮 */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        // 强制重新加载图片
                        const timestamp = new Date().getTime();
                        const urlWithTimestamp = imageUrl.includes('?') 
                          ? `${imageUrl}&t=${timestamp}` 
                          : `${imageUrl}?t=${timestamp}`;
                        setImageUrl(urlWithTimestamp);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm ${
                        isDark 
                          ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      } transition-colors`}
                    >
                      <i className="fas fa-redo mr-2"></i>重新加载图片
                    </button>
                  </div>
                  
                  {selectedHistory && (
                    <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <h3 className="font-medium mb-2">图片信息</h3>
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">模型:</span> {selectedHistory.model === NANO_BANANA_MODEL ? 'Nano Banana' : selectedHistory.model}</p>
                        <p><span className="font-medium">提示词:</span> {selectedHistory.prompt}</p>
                        <p><span className="font-medium">画面比例:</span> {selectedHistory.aspectRatio}</p>
                        <p><span className="font-medium">生成时间:</span> {new Date(selectedHistory.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`aspect-video rounded-lg flex flex-col items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="text-center p-8">
                    <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mx-auto mb-4">
                      <i className={`fas fa-image ${isDark ? 'text-gray-400' : 'text-gray-500'}`}></i>
                    </div>
                    <h3 className="text-lg font-medium mb-2">等待生成图片</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md">
                      输入提示词，选择画面比例，然后点击"生成图片"按钮开始创建图片内容
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
      
      {/* 原图显示模态框 */}
      {showOriginalImage && imageUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4 cursor-pointer"
          onClick={() => setShowOriginalImage(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()} // 防止点击图片时关闭模态框
          >
            <img 
              src={imageUrl} 
              alt="原图"
              className="max-w-full max-h-[90vh] object-contain"
            />
            <button
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-all"
              onClick={() => setShowOriginalImage(false)}
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}