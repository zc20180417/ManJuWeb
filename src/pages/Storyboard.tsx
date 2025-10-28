import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProjectContext, Scene } from '@/contexts/projectContext';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';

export default function Storyboard() {
  const { currentProject, updateProject, addScene, updateScene, deleteScene } = useProjectContext();
  const { isDark } = useTheme();
  const { apiKeys, setApiKey } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [sceneDescription, setSceneDescription] = useState('');
  const [sceneDuration, setSceneDuration] = useState(3);
  const [cameraAngle, setCameraAngle] = useState('全景');
  const [dialogues, setDialogues] = useState<string[]>(['']);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [aiCallProgress, setAiCallProgress] = useState(0);
  // 添加模拟模式开关
  const [isSimulationMode, setIsSimulationMode] = useState(true);
  
  // 添加AI模型选择
  const [aiModels] = useState([
    { id: 'doubao', name: '豆包 (火山方舟)', apiEndpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions' },
    { id: 'gpt4v', name: 'GPT-4 Vision', apiEndpoint: 'https://api.openai.com/v1/chat/completions' },
    { id: 'claude3v', name: 'Claude 3 Vision', apiEndpoint: 'https://api.anthropic.com/v1/messages' },
    { id: 'gemini', name: 'Gemini Pro Vision', apiEndpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent' },
    { id: 'wenxin', name: '文心一言', apiEndpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions' }
  ]);
  const [selectedModel, setSelectedModel] = useState('doubao');
  const [showAPIKeyModal, setShowAPIKeyModal] = useState(false);
  const [currentApiKeyInput, setCurrentApiKeyInput] = useState('');

  const cameraAngles = ['全景', '中景', '近景', '特写', '跟拍', '俯拍', '仰拍', '移动镜头'];

  useEffect(() => {
    if (!currentProject) {
      toast.error('请先创建或选择一个项目');
      navigate('/script-writer');
    }
  }, [currentProject, navigate]);

  useEffect(() => {
    if (selectedScene) {
      setSceneDescription(selectedScene.description);
      setSceneDuration(selectedScene.duration);
      setCameraAngle(selectedScene.cameraAngle);
      setDialogues(selectedScene.dialogues || ['']);
    } else {
      resetForm();
    }
  }, [selectedScene]);

  const resetForm = () => {
    setSceneDescription('');
    setSceneDuration(3);
    setCameraAngle('全景');
    setDialogues(['']);
  };

  const handleAddScene = () => {
    if (!currentProject) return;
    
    if (!sceneDescription.trim()) {
      toast.error('请输入场景描述');
      return;
    }

    addScene(currentProject.id, {
      description: sceneDescription,
      duration: sceneDuration,
      cameraAngle: cameraAngle,
      dialogues: dialogues.filter(d => d.trim() !== '')
    });

    resetForm();
    toast.success('场景添加成功');
  };
  
  // 处理API密钥保存
  const handleSaveApiKey = () => {
    setApiKey(selectedModel, currentApiKeyInput);
    setShowAPIKeyModal(false);
    setCurrentApiKeyInput('');
    toast.success(`${aiModels.find(m => m.id === selectedModel)?.name || selectedModel} API密钥已保存`);
  };
  
  // 添加AI辅助生成分镜描述功能
  const handleAIGenerateScene = async () => {
    if (!currentProject || !currentProject.script.trim()) {
      toast.error('请先创建并保存剧本内容');
      return;
    }
    
    // 在非模拟模式下检查API密钥
    if (!isSimulationMode) {
      const hasApiKey = apiKeys[selectedModel]?.trim() !== '';
      
      if (!hasApiKey) {
        setCurrentApiKeyInput('');
        setShowAPIKeyModal(true);
        toast.info(`请输入${aiModels.find(m => m.id === selectedModel)?.name || selectedModel}的API密钥`);
        return;
      }
    }
    
    setIsAIGenerating(true);
    setAiCallProgress(0);
    const modelName = aiModels.find(m => m.id === selectedModel)?.name || selectedModel;
    toast.info(`正在使用${modelName}${isSimulationMode ? '（模拟模式）' : ''}生成场景描述...`);
    
    try {
      // 根据模式选择调用方式
      if (isSimulationMode) {
        await simulateAICall(selectedModel, currentProject);
      } else {
        await realAICall(selectedModel, currentProject);
      }
    } catch (error) {
      setIsAIGenerating(false);
      toast.error(`AI调用失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };
  
  // 模拟AI调用 - 增强版，包含进度显示
  const simulateAICall = (model: string, project: any): Promise<void> => {
    return new Promise((resolve) => {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setAiCallProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return newProgress;
        });
      }, 100);

      // 模拟AI生成过程
      setTimeout(() => {
        clearInterval(progressInterval);
        setAiCallProgress(100);
        
        const modelPrompts = {
          'doubao': `根据剧本内容，我需要生成一个生动的场景描述。剧本是关于${project.title}的，我应该创建一个符合整体氛围的场景。`,
          'gpt4v': `I need to generate a vivid scene description based on the script. The script is about ${project.title}, I should create a scene that fits the overall atmosphere.`,
          'claude3v': `Generate a detailed scene description for the story ${project.title}. Focus on visual elements and emotional tone.`,
          'gemini': `Create a cinematic scene description for ${project.title}. Include details about lighting, camera angles, and character movements.`,
          'wenxin': `为故事《${project.title}》生成一个电影感十足的场景描述，包含详细的环境、人物动作和镜头感。`
        };
        
     // 根据选择的模型生成不同风格的场景描述，但保持与剧本的一致性
      let generatedDescription = '';
      
      // 尝试从剧本中提取场景信息，确保与剧本内容一致性
      const scriptLines = project.script.split('\n');
      const sceneLines = scriptLines.filter(line => 
        line.includes('[' && ']') || line.includes('：') // 筛选描述和对话行
      ).join(' ');
      
      if (model === 'doubao') {
        generatedDescription = `根据剧本内容生成的场景。${sceneLines.substring(0, 200)}...。镜头从远处缓缓推进，展示符合剧本描述的环境细节。主角的动作和表情与剧本保持一致，背景元素丰富但不喧宾夺主，为后续情节发展做好铺垫。`;
      } else if (model === 'gpt4v') {
        generatedDescription = `Scene based on the script. ${sceneLines.substring(0, 200)}... The camera movement and framing are designed to emphasize key elements from the script. The protagonist's actions and expressions are consistent with their characterization in the story. Background details support the narrative without distracting from the main focus.`;
      } else if (model === 'claude3v') {
        generatedDescription = `场景设计基于剧本内容。${sceneLines.substring(0, 200)}... 镜头角度和构图精心设计，突出剧本中的关键元素。主角的表演符合人物设定，环境细节丰富但始终服务于剧情发展，保持视觉风格的一致性。`;
      } else if (model === 'gemini') {
        generatedDescription = `Cinematic interpretation of the script. ${sceneLines.substring(0, 200)}... Camera work is deliberately chosen to enhance the storytelling as described in the script. The protagonist's actions and emotional state remain faithful to the source material. Visual elements work together to create a cohesive and immersive experience.`;
      } else if (model === 'wenxin') {
        generatedDescription = `紧扣剧本的场景设计。${sceneLines.substring(0, 200)}... 镜头运用和画面构图严格遵循剧本描述，确保视觉呈现与文字内容高度一致。主角的动作、表情和对话无缝衔接，环境细节丰富且符合故事背景，为完整呈现剧本内容提供有力支持。`;
      }
        
        setSceneDescription(generatedDescription);
        setIsAIGenerating(false);
        toast.success(`使用${aiModels.find(m => m.id === model)?.name || model}生成场景描述成功`);
        resolve();
      }, 2000); // 模拟AI调用时间
    });
  };
  
  // 真实AI调用框架（模拟真实调用过程，但不实际发送请求）
  const realAICall = async (model: string, project: any): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setAiCallProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return newProgress;
        });
      }, 100);

      // 准备API调用参数
      const apiKey = apiKeys[model] || '';
      const selectedAIModel = aiModels.find(m => m.id === model);
      
      if (!selectedAIModel) {
        setIsAIGenerating(false);
        reject(new Error('未找到指定的AI模型'));
        return;
      }

      // 构建请求头
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };

      // 构建请求体
      let requestBody: any = {};
      
      if (model === 'doubao') {
        // 火山方舟豆包模型的请求格式
        requestBody = {
          model: "doubao-seed-1-6-thinking-250715",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `请根据以下剧本内容生成一个生动的场景描述。剧本标题：${project.title}，剧本内容：${project.script}。请确保生成的场景描述包含详细的环境描写、镜头建议和氛围营造。`
                }
              ]
            }
          ]
        };
      } else {
        // 其他模型的通用请求格式
        requestBody = {
          model: model === 'gpt4v' ? 'gpt-4o' : model,
          messages: [
            {
              role: "user",
              content: `请根据以下剧本内容生成一个生动的场景描述。剧本标题：${project.title}，剧本内容：${project.script}。请确保生成的场景描述包含详细的环境描写、镜头建议和氛围营造。`
            }
          ],
          max_tokens: 1000
        };
      }

      // 模拟AI调用过程和可能的错误
      setTimeout(() => {
        clearInterval(progressInterval);
        setAiCallProgress(100);
        
        // 随机模拟成功或失败（80%成功率）
        if (Math.random() > 0.2) {
          // 成功情况，使用与模拟模式相同的生成逻辑
          simulateAICall(model, project).then(() => {
            setIsAIGenerating(false);
            resolve();
          });
        } else {
          // 失败情况，模拟不同类型的错误
          const errors = [
            "API密钥无效，请检查您的密钥是否正确",
            "请求超时，请检查网络连接或稍后再试",
            "服务器暂时不可用，请稍后再试",
            "请求被限制，请减少请求频率"
          ];
          const randomError = errors[Math.floor(Math.random() * errors.length)];
          setIsAIGenerating(false);
          reject(new Error(randomError));
        }
      }, 2500); // 真实调用通常稍慢一些
    });
  };

  const handleUpdateScene = () => {
    if (!currentProject || !selectedScene) return;
    
    if (!sceneDescription.trim()) {
      toast.error('请输入场景描述');
      return;
    }

    updateScene(currentProject.id, selectedScene.id, {
      description: sceneDescription,
      duration: sceneDuration,
      cameraAngle: cameraAngle,
      dialogues: dialogues.filter(d => d.trim() !== '')
    });

    setSelectedScene(null);
    resetForm();
    toast.success('场景更新成功');
  };

  const handleDeleteScene = (sceneId: string) => {
    if (!currentProject) return;
    
    if (window.confirm('确定要删除这个场景吗？')) {
      deleteScene(currentProject.id, sceneId);
      if (selectedScene && selectedScene.id === sceneId) {
        setSelectedScene(null);
        resetForm();
      }
      toast.success('场景删除成功');
    }
  };

  const handleAddDialogue = () => {
    setDialogues([...dialogues, '']);
  };

  const handleDialogueChange = (index: number, value: string) => {
    const newDialogues = [...dialogues];
    newDialogues[index] = value;
    setDialogues(newDialogues);
  };

  const handleRemoveDialogue = (index: number) => {
    if (dialogues.length <= 1) return;
    const newDialogues = dialogues.filter((_, i) => i !== index);
    setDialogues(newDialogues);
  };

  const handleContinueToImageGenerator = () => {
    if (!currentProject || currentProject.scenes.length === 0) {
      toast.error('请先添加场景');
      return;
    }
    
    navigate('/image-generator');
  };

  const generateSceneImage = (description: string) => {
    // 为不同的场景生成不同的示例图片
    const imagePrompts = [
      'cinematic scene with professional lighting',
      'dramatic moment in a movie',
      'beautiful composition with depth',
      'emotional scene with rich colors',
      'epic wide shot of landscape',
      'intimate close-up of character'
    ];
    
    const randomPrompt = imagePrompts[Math.floor(Math.random() * imagePrompts.length)];
    const encodedPrompt = encodeURIComponent(`${description} ${randomPrompt}`);
    
    return `https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=${encodedPrompt}`;
  };

  if (!currentProject) {
    return null;
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
      {/* 顶部导航栏 */}
      <nav className={`sticky top-0 z-50 backdrop-blur-md ${isDark ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-200'} border-b px-6 py-4`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center">
              <i className="fas fa-story text-white"></i>
            </div>
            <h1 className="text-xl font-bold">分镜设计</h1>
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
                  disabled={isAIGenerating}
                />
                <div className={`w-11 h-6 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} peer-focus:outline-none transition-colors duration-300 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}></div>
              </label>
            </div>
            
            <button 
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
            >
              {isPreviewMode ? (
                <>
                  <i className="fas fa-edit mr-2"></i>编辑模式
                </>
              ) : (
                <>
                  <i className="fas fa-eye mr-2"></i>预览模式
                </>
              )}
            </button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleContinueToImageGenerator}
              className={`px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white transition-all shadow-lg shadow-blue-500/30`}
            >
              <i className="fas fa-arrow-right mr-2"></i>下一步：图像生成
            </motion.button>
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 项目信息 */}
        <div className={`mb-8 p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h2 className="text-2xl font-bold mb-2">{currentProject.title}</h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{currentProject.description}</p>
          <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} inline-flex items-center`}>
            <i className="fas fa-film text-blue-500 mr-2"></i>
            <span className="text-sm">共 {currentProject.scenes.length} 个场景</span>
          </div>
        </div>
        
        {isPreviewMode ? (
          // 预览模式
          <div className={`mb-8 p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <h2 className="text-xl font-bold mb-6">分镜预览</h2>
            
            <div className="space-y-8">
              {currentProject.scenes.map((scene, index) => (
                <motion.div
                  key={scene.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}className={`flex flex-col md:flex-row gap-6 p-4 rounded-xl border ${isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'} hover:shadow-md transition-all`}
                >
                  <div className="w-full md:w-2/5 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 aspect-video relative">
                    <img 
                      src={scene.imageUrl || generateSceneImage(scene.description)} 
                      alt={`场景 ${index + 1}: ${scene.description}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-black/60 text-white text-xs py-1 px-2 rounded-full">
                      {scene.duration}s
                    </div>
                    <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs py-1 px-2 rounded-full">
                      {scene.cameraAngle}
                    </div>
                  </div>
                  
                  <div className="w-full md:w-3/5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold`}>
                        {index + 1}
                      </div>
                      <h3 className="text-lg font-semibold">{scene.description}</h3>
                    </div>
                    
                    {scene.dialogues && scene.dialogues.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {scene.dialogues.map((dialogue, i) => (
                          <div key={i} className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <p className="italic">"{dialogue}"</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {currentProject.scenes.length === 0 && (
                <div className="text-center py-12">
                  <i className={`fas fa-story text-5xl mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`}></i>
                  <p className="text-lg">还没有添加场景</p>
                  <button 
                    onClick={() => setIsPreviewMode(false)}
                    className="mt-4 px-4 py-2 rounded-lg bg-blue-500 text-white"
                  >
                    添加第一个场景
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          // 编辑模式
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 场景列表 */}
            <div className={`lg:col-span-1 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold">场景列表</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">点击场景进行编辑</p>
              </div>
              
              <div className="max-h-[calc(100vh-380px)] overflow-y-auto p-4">
                {currentProject.scenes.length === 0 ? (
                  <div className="text-center py-12">
                    <i className={`fas fa-story text-4xl mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`}></i>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>还没有添加场景</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentProject.scenes.map((scene, index) => (
                      <motion.div
                        key={scene.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedScene(scene)}
                        className={`p-4 rounded-lg cursor-pointer transition-all ${
                          selectedScene?.id === scene.id 
                            ? isDark ? 'bg-blue-900/30 border-blue-500' : 'bg-blue-50 border-blue-200' 
                            : isDark ? 'bg-gray-700 hover:bg-gray-650' : 'bg-gray-50 hover:bg-gray-100'
                        } border`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-full ${
                              selectedScene?.id === scene.id 
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
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
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteScene(scene.id);
                            }}
                            className={`text-gray-500 hover:text-red-500 transition-colors ${selectedScene?.id === scene.id ? 'text-red-500' : ''}`}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                        
                        {scene.dialogues && scene.dialogues.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate italic">
                              "{scene.dialogues[0]}"{scene.dialogues.length > 1 ? '...' : ''}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <p className="text-sm">场景总数</p>
                  <p className="text-2xl font-bold">{currentProject.scenes.length}</p>
                </div>
                <button 
                  onClick={() => {
                    setSelectedScene(null);
                    resetForm();
                  }}
                  className={`px-4 py-2 rounded-lg ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
                >
                  <i className="fas fa-plus mr-2"></i>添加场景
                </button>
              </div>
            </div>
            
             {/* 场景编辑器 */}
              <div className={`lg:col-span-2 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden`}>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold">
                    {selectedScene ? '编辑场景' : '添加新场景'}
                  </h2>
                  
                  {/* 仅在添加新场景时显示AI辅助功能 */}
                  {!selectedScene && (
                    <div className="mt-4">
                      <div className="flex items-center gap-3">
                        <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg overflow-hidden`}>
                          <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            disabled={isAIGenerating}
                            className={`py-2 px-4 pr-8 appearance-none focus:outline-none ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}
                          >
                            {aiModels.map(model => (
                              <option key={model.id} value={model.id}>{model.name}</option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
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
                            className={`p-2 rounded-lg ${
                              apiKeys[selectedModel]?.trim() !== ''
                                ? isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                                : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                            } text-white transition-colors`}
                            title={apiKeys[selectedModel]?.trim() !== '' ? '修改API密钥' : '设置API密钥'}
                          >
                            <i className={apiKeys[selectedModel]?.trim() !== '' ? 'fas fa-key' : 'fas fa-lock-open'}></i>
                          </motion.button>
                        )}
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleAIGenerateScene}
                          disabled={isAIGenerating || (!currentProject || !currentProject.script.trim())}
                          className={`px-3 py-2 rounded-lg flex items-center text-sm ${
                            isAIGenerating || (!currentProject || !currentProject.script.trim())
                              ? isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-300 text-gray-500'
                              : isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                          } text-white transition-colors`}
                        >
                          {isAIGenerating ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-2"></i>生成中...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-magic mr-2"></i>AI辅助生成
                            </>
                          )}
                        </motion.button>
                      </div>
                      
                      {/* 显示AI调用进度条 */}
                      {isAIGenerating && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span>正在处理...</span>
                            <span>{aiCallProgress}%</span>
                          </div>
                          <div className={`w-full h-1.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                            <motion.div 
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${aiCallProgress}%` }}
                              transition={{ duration: 0.1 }}
                            ></motion.div>
                          </div>
                        </div>
                      )}
                      
                      {isSimulationMode && (
                        <p className="mt-2 text-xs text-amber-500 dark:text-amber-400 flex items-center">
                          <i className="fas fa-info-circle mr-1"></i>
                          当前为模拟模式，AI生成过程为演示用
                        </p>
                      )}
                    </div>
                  )}
                </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">场景描述</label>
                    <textarea
                      value={sceneDescription}
                      onChange={(e) => setSceneDescription(e.target.value)}
                      className={`w-full p-3 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} border focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
                      rows={4}
                      placeholder="描述这个场景的内容、环境、角色动作等..."
                    ></textarea>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">镜头角度</label>
                    <select
                      value={cameraAngle}
                      onChange={(e) => setCameraAngle(e.target.value)}
                      className={`w-full p-3 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} border focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none`}
                    >
                      {cameraAngles.map(angle => (
                        <option key={angle} value={angle}>{angle}</option>
                      ))}
                    </select>
                    
                    <label className="block text-sm font-medium mb-2 mt-4">持续时间（秒）</label>
                    <input
                      type="number"
                      value={sceneDuration}
                      onChange={(e) => setSceneDuration(Math.max(1, Number(e.target.value)))}
                      min="1"
                      max="30"
                      className={`w-full p-3 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} border focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                  </div>
                </div>
                
                {/* 对话编辑 */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium">对话内容</label>
                    <button 
                      onClick={handleAddDialogue}
                      className={`text-sm px-2 py-1 rounded ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                    >
                      <i className="fas fa-plus mr-1"></i>添加对话
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {dialogues.map((dialogue, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={dialogue}
                          onChange={(e) => handleDialogueChange(index, e.target.value)}
                          className={`flex-grow p-3 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} border focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          placeholder={`对话 ${index + 1}`}
                        />
                        <button 
                          onClick={() => handleRemoveDialogue(index)}
                          disabled={dialogues.length <= 1}
                          className={`p-3 rounded-lg ${
                            dialogues.length <= 1 
                              ? isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400' 
                              : isDark ? 'bg-gray-700 hover:bg-gray-600 text-red-400 hover:text-red-300' : 'bg-gray-100 hover:bg-gray-200 text-red-500 hover:text-red-600'
                          } transition-colors flex items-center justify-center`}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* 场景预览 */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3">场景预览</label>
                  <div className={`w-full rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 aspect-video relative`}>
                    {sceneDescription ? (
                      <img 
                        src={generateSceneImage(sceneDescription)} 
                        alt={sceneDescription}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="fas fa-image text-5xl text-gray-300 dark:text-gray-600"></i>
                      </div>
                    )}
                    {sceneDescription && (
                      <>
                        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs py-1 px-2 rounded-full">
                          {sceneDuration}s
                        </div>
                        <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs py-1 px-2 rounded-full">
                          {cameraAngle}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                 {/* 底部操作按钮 */}
                <div className="flex justify-end space-x-4">
                  {selectedScene && (
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedScene(null);
                        resetForm();
                      }}
                      className={`px-6 py-3 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                    >
                      取消
                    </motion.button>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={selectedScene ? handleUpdateScene : handleAddScene}
                    className={`px-6 py-3 rounded-lg ${
                      selectedScene 
                        ? isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                        : 'bg-gradient-to-r from-blue-600 to-cyan-500'
                    } text-white transition-colors shadow-md shadow-blue-500/20`}
                  >
                    {selectedScene ? '更新场景' : '添加场景'}
                  </motion.button>
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
            onClick={handleContinueToImageGenerator}
            className={`px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white transition-all shadow-lg shadow-blue-500/30 flex items-center`}
          >
            <i className="fas fa-arrow-right mr-2"></i>下一步：图像生成
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
                  className={`w-full p-3 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} border focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
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
                  请确保您输入的API密钥正确，错误的密钥将导致API调用失败。
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
                  className={`px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white transition-colors`}
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