import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProjectContext } from '@/contexts/projectContext';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
// 导入本地文件系统管理器
import { saveProjectToLocalFile } from '@/utils/localFileSystemManager';

export default function ScriptWriter() {
  const { projects, currentProject, setCurrentProject, updateProject, createProject, addScene } = useProjectContext();
  const { isDark } = useTheme();
  const { apiKeys, setApiKey } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [scriptText, setScriptText] = useState('');
  const [novelText, setNovelText] = useState(''); // 添加小说文本输入
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiCallProgress, setApiCallProgress] = useState(0); // 添加API调用进度
  
  const DOUBAO_1_6_THINKING = 'doubao1-6-thinking';
  const DOUBAO_1_6_FLASH = 'doubao1-6-flash';
  const GPT_4 = 'gpt4';


  // 添加AI模型选择
  const [aiModels] = useState([
    { id: DOUBAO_1_6_THINKING, name: '豆包1.6（深度思考响应慢）', apiEndpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions' },
    { id: DOUBAO_1_6_FLASH, name: '豆包1.6 (flash响应快)', apiEndpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions' },
    { id: GPT_4, name: 'GPT-4', apiEndpoint: 'https://api.bltcy.ai/v1/chat/completions' },
    { id: 'claude3', name: 'Claude 3', apiEndpoint: 'https://api.anthropic.com/v1/messages' },
    { id: 'gemini', name: 'Gemini Pro', apiEndpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent' },
    { id: 'tongyi', name: '通义千问', apiEndpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation' }
  ]);
  const [selectedModel, setSelectedModel] = useState(DOUBAO_1_6_FLASH);
  const [showAPIKeyModal, setShowAPIKeyModal] = useState(false);
  const [currentApiKeyInput, setCurrentApiKeyInput] = useState('');
  
  // 添加一些示例小说文本，便于用户快速测试
  const [sampleNovels] = useState([
    {
      title: "神秘森林探险",
      content: "李明是一位经验丰富的探险家，他听闻了关于神秘森林的传说。据说在森林深处，有一座古老的神庙，里面藏着不为人知的秘密。一个晴朗的早晨，李明收拾好行囊，踏上了探险之旅。当他来到森林边缘时，眼前的景象让他震撼不已。茂密的树木遮天蔽日，阳光透过树叶洒下斑驳的光影，空气中弥漫着泥土和青草的芬芳。李明深吸一口气，毅然走进了这片神秘的森林。"
    },
    {
      title: "都市奇遇",
      content: "陈小雨是一名普通的白领，每天过着朝九晚五的生活。直到有一天，她在下班路上遇到了一个奇怪的老人。老人给了她一个精致的小盒子，告诉她这个盒子能改变她的命运。陈小雨本来以为这只是一个恶作剧，但当她打开盒子时，一道强光闪过，她发现自己来到了一个完全陌生的世界。这里的建筑高耸入云，飞行器在天空中穿梭，人们的穿着也非常奇特。陈小雨意识到，她可能穿越到了未来。"
    },
    {
      title: "星际旅程",
      content: "2145年，人类已经开始了星际殖民。张宇是\"探索者号\"飞船的 captain，他们的任务是寻找适合人类居住的新星球。在一次例行巡逻中，他们发现了一个与地球极为相似的行星。张宇决定带领小队进行实地考察。当他们降落在这颗星球上时，眼前的景象让他们惊喜不已。这里有茂密的森林、清澈的河流，甚至还有类似地球的生物。然而，就在他们准备进一步探索时，意外发生了..."
    }
  ]);

  useEffect(() => {
    if (currentProject) {
      setScriptText(currentProject.script);
      setProjectTitle(currentProject.title);
      setProjectDescription(currentProject.description);
      setSelectedProjectId(currentProject.id);
    }
  }, [currentProject]);

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
    }
  };

  const handleNewProject = () => {
    const newTitle = `新项目_${new Date().toLocaleDateString()}`;
    createProject(newTitle, '');
  };

  const handleSave = () => {
    if (!currentProject) {
      toast.error('请先选择或创建一个项目');
      return;
    }

    updateProject({
      ...currentProject,
      title: projectTitle,
      description: projectDescription,
      script: scriptText
    });
    
    toast.success('剧本已保存');
  };

  // 处理API密钥保存
  const handleSaveApiKey = () => {
    setApiKey(selectedModel, currentApiKeyInput);
    setShowAPIKeyModal(false);
    setCurrentApiKeyInput('');
    toast.success(`${aiModels.find(m => m.id === selectedModel)?.name || selectedModel} API密钥已保存`);
  };

  // 处理AI生成剧本
  const handleGenerateScript = async () => {
    if (!projectTitle.trim()) {
      toast.error('请先输入项目标题');
      return;
    }

    if (!novelText.trim()) {
      toast.error('请先输入小说文本内容');
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
    
    // 显示API调用前的确认信息
    toast.info(`正在准备连接到${aiModels.find(m => m.id === selectedModel)?.name || selectedModel} API...`, {
      duration: 2000
    });

    setIsGenerating(true);
    setApiCallProgress(0);
    const modelName = aiModels.find(m => m.id === selectedModel)?.name || selectedModel;
    
    // 显示更详细的处理信息
    toast(`正在使用${modelName}将小说转换为剧本...`, {
      duration: 0, // 不自动关闭
      description: `请求将发送到: ${aiModels.find(m => m.id === selectedModel)?.apiEndpoint}`
    });

    try {
      // 直接调用真实API
      await realApiCall(selectedModel, novelText, projectTitle);
    } catch (error) {
      setIsGenerating(false);
      
      // 显示错误信息，并提供重试选项
      toast.error(`API调用失败: ${error instanceof Error ? error.message : '未知错误'}`, {
        duration: 5000,
        action: {
          label: '重试',
          onClick: () => handleGenerateScript()
        }
      });
    }
  };

  // 真实API调用实现（增强版）
  const realApiCall = async (model: string, novelText: string, projectTitle: string): Promise<void> => {
    const apiKey = apiKeys[model] || '';
    const selectedAIModel = aiModels.find(m => m.id === model);
    
    if (!selectedAIModel) {
      setIsGenerating(false);
      throw new Error('未找到指定的AI模型');
    }

    if (!apiKey) {
      setIsGenerating(false);
      throw new Error('API密钥不能为空');
    }

    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    // 构建请求体
    let requestBody: any = {};

    let prompt = `你是一个优秀的AI动漫师和剧本分析专家。你的任务是将小说内容转换为适合制作AI动漫的剧本。`
    
    if (model === DOUBAO_1_6_THINKING || model === DOUBAO_1_6_FLASH) {
      // 火山方舟豆包模型的请求格式
      let real_model = model == DOUBAO_1_6_THINKING ? "doubao-seed-1-6-thinking-250715" : "doubao-seed-1-6-flash-250828";
      requestBody = {
        model: real_model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt + `。小说标题：${projectTitle}，内容：${novelText}。`
              }
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 10000,
        top_p: 0.9,
        stream: false
      };
    } else {
      // 其他模型的通用请求格式
      requestBody = {
        model: model === GPT_4 ? 'gpt-4o' : model,
        messages: [
          {
            role: "user",
            content: prompt + `。小说标题：${projectTitle}，内容：${novelText}。`
          }
        ],
        max_tokens: 10000,
        temperature: 0.7
      };
    }

    try {
      // 实际的API调用
      const response = await fetch(selectedAIModel.apiEndpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // 解析API响应并生成剧本内容
      let generatedScript = '';
      
      // 根据不同模型解析响应
      if (model === DOUBAO_1_6_FLASH || model === DOUBAO_1_6_THINKING) {
        // 豆包模型响应解析
        if (data.choices && data.choices[0] && data.choices[0].message) {
          generatedScript = data.choices[0].message.content;
        } else {
          throw new Error('API响应格式不正确');
        }
      } else if (model === GPT_4 || model === 'claude3' || model === 'gemini' || model === 'tongyi') {
        // 其他模型响应解析
        if (data.choices && data.choices[0] && data.choices[0].message) {
          generatedScript = data.choices[0].message.content;
        } else if (data.content) {
          // Claude 3的响应格式
          generatedScript = data.content[0]?.text || '';
        } else {
          throw new Error('API响应格式不正确');
        }
      } else {
        throw new Error('不支持的AI模型');
      }
      
      setScriptText(generatedScript);
      
      if (currentProject) {
        updateProject({
          ...currentProject,
          script: generatedScript
        });
      }
      
      setIsGenerating(false);
      toast.success(`使用${aiModels.find(m => m.id === selectedModel)?.name || selectedModel}将小说转换为剧本成功`);
    } catch (error) {
      setIsGenerating(false);
      throw error;
    }
  };

  // 真实API调用实现（增强版）- 用于提取分镜场景
  const realApiCall_extractedScenes = async (model: string, novelText: string, projectTitle: string): Promise<void> => {
    const apiKey = apiKeys[model] || '';
    const selectedAIModel = aiModels.find(m => m.id === model);
    
    if (!selectedAIModel) {
      setIsGenerating(false);
      throw new Error('未找到指定的AI模型');
    }

    if (!apiKey) {
      setIsGenerating(false);
      throw new Error('API密钥不能为空');
    }

    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    // 构建请求体
    let requestBody: any = {};
    
    if (model === DOUBAO_1_6_THINKING || model === DOUBAO_1_6_FLASH) {
      // 火山方舟豆包模型的请求格式
      let real_model = model == DOUBAO_1_6_THINKING ? "doubao-seed-1-6-thinking-250715" : "doubao-seed-1-6-flash-250828";
      requestBody = {
        model: real_model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `请你扮演一名专业影视分镜师，基于以下剧本片段，生成详细的分镜脚本。分镜需符合影视拍摄逻辑，包含镜头语言、构图、光影和动作指引，可直接用于现场拍摄参考。内容：${novelText}`
              }
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 0.9,
        stream: false
      };
    } else {
      // 其他模型的通用请求格式
      requestBody = {
        model: model === GPT_4 ? 'gpt-4o' : model,
        messages: [
          {
            role: "user",
            content: `请将以下小说文本转换为专业剧本格式。小说标题：${projectTitle}，内容：${novelText}。请确保剧本包含场景、角色对话、动作描述等元素。`
          }
        ],
        max_tokens: 4000,
        temperature: 0.7
      };
    }

    try {
      // 实际的API调用
      const response = await fetch(selectedAIModel.apiEndpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // 解析API响应并生成剧本内容
      let generatedScript = '';
      
      // 根据不同模型解析响应
      if (model === DOUBAO_1_6_FLASH || model === DOUBAO_1_6_THINKING) {
        // 豆包模型响应解析
        if (data.choices && data.choices[0] && data.choices[0].message) {
          generatedScript = data.choices[0].message.content;
        } else {
          throw new Error('API响应格式不正确');
        }
      } else if (model === GPT_4 || model === 'claude3' || model === 'gemini' || model === 'tongyi') {
        // 其他模型响应解析
        if (data.choices && data.choices[0] && data.choices[0].message) {
          generatedScript = data.choices[0].message.content;
        } else if (data.content) {
          // Claude 3的响应格式
          generatedScript = data.content[0]?.text || '';
        } else {
          throw new Error('API响应格式不正确');
        }
      } else {
        throw new Error('不支持的AI模型');
      }
      
      // 设置剧本文本
      // setScriptText(generatedScript);
      
      // 如果有当前项目，更新项目剧本
      if (currentProject) {
        updateProject({
          ...currentProject,
          script: generatedScript
        });
      }
      // autoGenerateStoryboard();
      setIsGenerating(false);
      toast.success(`使用${aiModels.find(m => m.id === selectedModel)?.name || selectedModel}将小说转换为剧本并生成分镜成功`);
    } catch (error) {
      setIsGenerating(false);
      throw error;
    }
  };

  

  const handleContinueToStoryboard = () => {
    if (!currentProject || !currentProject.script.trim()) {
      toast.error('请先创建并保存一个剧本');
      return;
    }
    
    navigate('/storyboard');
  };


  
  
  // 自动生成分镜设计（从剧本提取场景信息）
  const autoGenerateStoryboard = () => {
    if (!currentProject || !scriptText.trim()) {
      toast.error('请先创建并保存剧本内容');
      return;
    }
    
    realApiCall_extractedScenes(selectedModel, novelText, projectTitle);
    
  };
  
  // 加载示例小说
  const loadSampleNovel = (sampleIndex: number) => {
    const sample = sampleNovels[sampleIndex];
    setNovelText(sample.content);
    if (!projectTitle.trim()) {
      setProjectTitle(sample.title);
    }
    toast.info(`已加载示例：${sample.title}`);
  };

  // 保存剧本到本地文件
  const saveScriptToLocalFile = () => {
    if (!scriptText.trim()) {
      toast.error('没有剧本内容可保存');
      return;
    }

    const title = projectTitle || '剧本';
    const filename = `${title}.txt`;
    const blob = new Blob([scriptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // 清理
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`剧本已保存到本地文件：${filename}`);
  };

  // 保存整个项目到本地文件
  const saveProjectToLocal = async () => {
    if (!currentProject) {
      toast.error('没有项目可保存');
      return;
    }

    try {
      // 保存项目数据到本地文件
      await saveProjectToLocalFile(currentProject);
      toast.success(`项目"${currentProject.title}"已保存到本地文件`);
    } catch (error) {
      toast.error(`保存项目失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
      {/* 顶部导航栏 */}
      <nav className={`sticky top-0 z-50 backdrop-blur-md ${isDark ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-200'} border-b px-6 py-4`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 flex items-center justify-center">
              <i className="fas fa-file-alt text-white"></i>
            </div>
            <h1 className="text-xl font-bold">剧本创作</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleSave}
              className={`px-4 py-2 rounded-lg ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
            >
              <i className="fas fa-save mr-2"></i>保存
            </button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleContinueToStoryboard}
              className={`px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 text-white transition-all shadow-lg shadow-purple-500/30`}
            ><i className="fas fa-arrow-right mr-2"></i>下一步：分镜设计
            </motion.button>
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 项目选择器 */}
        <div className={`mb-8 p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold">项目管理</h2>
            
            <div className="flex items-center gap-3">
              <div className={`relative flex-grow max-w-md ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg overflow-hidden`}>
                <select
                  value={selectedProjectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className={`w-full py-3 px-4 pr-10 appearance-none focus:outline-none ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}
                >
                  <option value="">选择项目</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <i className={`fas fa-chevron-down ${isDark ? 'text-gray-400' : 'text-gray-500'}`}></i>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNewProject}
                className={`px-4 py-2 rounded-lg ${isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white transition-colors`}
              >
                <i className="fas fa-plus mr-2"></i>新建项目
              </motion.button>
            </div>
          </div>
          
          {/* 项目信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">项目标题</label>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className={`w-full p-3 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} border focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                placeholder="输入项目标题"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">项目描述</label>
              <input
                type="text"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className={`w-full p-3 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} border focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                placeholder="输入项目描述"
              />
            </div>
          </div>
        </div>
        
        {/* 小说转剧本区域 */}
        <div className={`mb-8 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold">小说文本输入</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">输入小说内容，AI将帮您转换为专业剧本格式</p>
          </div>
          
           <div className="p-6">
           <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
             <div className="flex flex-grow max-w-md gap-2">
               <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg overflow-hidden flex-grow`}>
                 <select
                   value={selectedModel}
                   onChange={(e) => setSelectedModel(e.target.value)}
                   disabled={isGenerating}className={`w-full py-3 px-4 pr-10 appearance-none focus:outline-none ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}
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
               onClick={handleGenerateScript}
               disabled={isGenerating}
               className={`px-5 py-3 rounded-lg flex items-center ${isDark ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'} text-white transition-colors shadow-md shadow-purple-500/20`}
             >
               {isGenerating ? (
                 <>
                   <i className="fas fa-spinner fa-spin mr-2"></i>转换中...
                 </>
               ) : (
                 <>
                   <i className="fas fa-magic mr-2"></i>AI转换为剧本
                 </>
               )}
             </motion.button>
           </div>
          
           {/* 显示API调用进度条 */}
           {isGenerating && (
             <div className="mb-4">
               <div className="flex justify-between text-xs mb-1">
                 <span>正在处理...</span>
                 <span>{apiCallProgress}%</span>
               </div>
               <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                 <motion.div 
                   className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                   initial={{ width: 0 }}
                   animate={{ width: `${apiCallProgress}%` }}
                   transition={{ duration: 0.1 }}
                 ></motion.div>
               </div>
             </div>
           )}

             <textarea
               value={novelText}
               onChange={(e) => setNovelText(e.target.value)}
               className={`w-full h-64 p-4 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} border focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none`}
               placeholder="请输入小说文本内容，AI将根据您的内容转换为专业剧本格式..."
               spellCheck={false}
             ></textarea>
            
            {/* 示例小说按钮 */}
            <div className="mt-3 flex flex-wrap gap-2">
              {sampleNovels.map((sample, index) => (
                <button
                  key={index}
                  onClick={() => loadSampleNovel(index)}
                  className={`px-3 py-1 text-xs rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                  disabled={isGenerating}
                >
                  <i className="fas fa-book-open mr-1"></i>示例 {index + 1}：{sample.title}
                </button>
              ))}
            </div>
             
             <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} shadow-sm`}>
               <h3 className="text-sm font-medium mb-2">使用提示：</h3>
               <ul className="text-sm space-y-1 list-disc pl-5 text-gray-600 dark:text-gray-300">
                 <li>输入的小说内容越详细，生成的剧本质量越高</li>
                  <li>该模型支持长文本输入，您可以输入任意长度的内容</li>
                  <li>建议输入至少500字以上的内容，以确保剧本的完整性</li>
                  <li>不同的AI模型会生成不同风格的剧本，可以多尝试比较</li>
                  <li>生成的剧本可以在下方编辑器中进行进一步修改和调整</li>
                  <li>需要设置对应AI模型的API密钥才能使用转换功能</li>
                  <li>API密钥仅保存在您的浏览器本地，确保安全</li>
               </ul>
             </div>
          </div>
        </div>
        
        {/* 剧本编辑器 */}
        <div className={`mb-8 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden`}>
          <div className="flex flex-col md:flex-row">
             {/* 编辑区域 */}
              <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold mb-4">剧本编辑</h2>
                
                <textarea
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  className={`w-full h-[calc(100vh-420px)] p-4 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} border focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none`}
                  placeholder="AI生成的剧本将显示在这里，您可以进行编辑和调整..."
                ></textarea>
                
                 <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} shadow-sm`}>
                  
                </div>
              </div>
              
              {/* 预览区域 */}
              <div className="w-full md:w-1/2 p-6">
                <h2 className="text-xl font-bold mb-4">剧本预览</h2>
                <div 
                  className={`w-full h-[calc(100vh-420px)] p-6 rounded-lg overflow-auto ${isDark ? 'bg-gray-700' : 'bg-gray-50'} whitespace-pre-line`}
                  dangerouslySetInnerHTML={{ __html: scriptText }}
                />
              </div>
            </div>
          </div>
          
           {/* 底部操作按钮 */}
          <div className="flex flex-wrap justify-end gap-4">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={autoGenerateStoryboard}
              className={`px-6 py-3 rounded-lg ${isDark ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'} text-white transition-colors flex items-center`}
              disabled={!currentProject || !scriptText.trim()}
            >
              <i className="fas fa-magic mr-2"></i>自动生成分镜
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              className={`px-6 py-3 rounded-lg ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors flex items-center`}
            >
              <i className="fas fa-save mr-2"></i>保存剧本
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={saveScriptToLocalFile}
              className={`px-6 py-3 rounded-lg ${isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white transition-colors flex items-center`}
            >
              <i className="fas fa-download mr-2"></i>下载剧本
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={saveProjectToLocal}
              className={`px-6 py-3 rounded-lg ${isDark ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'} text-white transition-colors flex items-center`}
            >
              <i className="fas fa-archive mr-2"></i>导出项目
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleContinueToStoryboard}
              className={`px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 text-white transition-all shadow-lg shadow-purple-500/30 flex items-center`}
            >
              <i className="fas fa-arrow-right mr-2"></i>下一步：分镜设计
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


