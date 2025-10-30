import React, { useContext, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
// 导入项目上下文和导入函数
import { useProjectContext } from '@/contexts/projectContext';

export default function Home() {
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  const { theme, toggleTheme, isDark } = useTheme();
  const { importProjectFromFile } = useProjectContext(); // 使用导入项目函数
  const [isImporting, setIsImporting] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
    toast.success('欢迎回来！');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    toast.info('已登出');
  };

  // 处理项目文件导入
  const handleImportProject = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查文件扩展名
    if (!file.name.endsWith('.storyvision')) {
      toast.error('请选择有效的.storyvision项目文件');
      return;
    }

    setIsImporting(true);
    try {
      await importProjectFromFile(file);
      toast.success('项目导入成功！');
    } catch (error) {
      toast.error(`项目导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsImporting(false);
      // 清空文件输入
      event.target.value = '';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
      {/* 导航栏 */}
      <nav className={`sticky top-0 z-50 backdrop-blur-md ${isDark ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-200'} border-b px-6 py-4`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <motion.div 
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 flex items-center justify-center"
            >
              <i className="fas fa-film text-white text-xl"></i>
            </motion.div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">StoryVision</h1>
          </div>
          
          <div className="flex items-center space-x-6">
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-full ${isDark ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-gray-800'} hover:scale-110 transition-transform`}
              aria-label="切换主题"
            >
              {isDark ? <i className="fas fa-sun"></i> : <i className="fas fa-moon"></i>}
            </button>
            
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="hidden md:flex items-center space-x-2 hover:text-purple-500 transition-colors">
                  <i className="fas fa-tachometer-alt"></i>
                  <span>仪表盘</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                >
                  登出
                </button>
              </>
            ) : (
              <button 
                onClick={handleLogin}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/30"
              >
                登录 / 注册
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            将你的<span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">创意文字</span>
            <br />转化为<span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-green-400">动态影像</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            一站式剧本创作、分镜设计、AI图像生成与视频制作平台，让你的故事栩栩如生
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link 
                to="/script-writer"
                className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 text-white text-lg font-medium shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
              >
                开始创作
              </Link>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link 
                to="/dashboard"
                className={`px-8 py-4 rounded-full border-2 ${isDark ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-800'} text-lg font-medium hover:bg-opacity-90 transition-all`}
              >
                查看作品
              </Link>
            </motion.div>
            
            {/* 项目导入按钮 */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="relative"
            >
              <input
                type="file"
                accept=".storyvision"
                onChange={handleImportProject}
                disabled={isImporting}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <button
                disabled={isImporting}
                className={`px-8 py-4 rounded-full border-2 ${
                  isDark 
                    ? 'border-gray-700 bg-gray-800 text-white' 
                    : 'border-gray-300 bg-white text-gray-800'
                } text-lg font-medium hover:bg-opacity-90 transition-all flex items-center justify-center ${
                  isImporting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isImporting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i> 导入中...
                  </>
                ) : (
                  <>
                    <i className="fas fa-upload mr-2"></i> 导入项目
                  </>
                )}
              </button>
            </motion.div>
          </div>
        </motion.div>
        
        {/* 功能展示卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 max-w-7xl mx-auto w-full">
           {[
            {
              icon: 'fa-file-alt',
              title: '文本转剧本',
              description: '智能AI帮你将创意文字转换为专业剧本格式',
              color: 'from-purple-500 to-indigo-600',
              link: '/script-writer'
            },
            {
              icon: 'fa-layer-group',
              title: '分镜设计',
              description: '直观的分镜工具，规划每一个镜头的构图和节奏',
              color: 'from-blue-500 to-cyan-600',
              link: '/storyboard'
            },
            {
              icon: 'fa-image',
              title: 'AI图像生成',
              description: '根据分镜描述自动生成高质量场景图像',
              color: 'from-green-500 to-emerald-600',
              link: '/image-generator'
            },
            {
              icon: 'fa-video',
              title: '视频合成',
              description: '将生成的图像合成为流畅的动态视频',
              color: 'from-amber-500 to-orange-600',
              link: '/video-creator'
            },
            {
              icon: 'fa-film',
              title: '文生视频',
              description: '直接将文本描述转换为AI生成视频',
              color: 'from-pink-500 to-rose-600',
              link: '/text-to-video'
            },
            {
              icon: 'fa-photo-video',
              title: '图生视频',
              description: '将图片转换为动态视频内容',
              color: 'from-teal-500 to-cyan-600',
              link: '/image-to-video'
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className={`rounded-2xl p-6 shadow-lg ${isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'} hover:shadow-xl transition-all border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg`}>
                <i className={`fas ${feature.icon} text-white text-2xl`}></i>
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className={`mb-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{feature.description}</p>
              <Link 
                to={feature.link}
                className={`inline-flex items-center text-sm font-medium ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} transition-colors`}
              >
                了解更多 <i className="fas fa-arrow-right ml-2 text-xs"></i>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>

      {/* 页脚 */}
      <footer className={`mt-20 py-12 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-t`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 flex items-center justify-center">
                  <i className="fas fa-film text-white text-sm"></i>
                </div>
                <h3 className="text-lg font-bold">StoryVision</h3>
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                让创意可视化，让故事更生动
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">产品</h4>
              <ul className={`space-y-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <li><Link to="/script-writer" className="hover:text-purple-500 transition-colors">剧本创作</Link></li>
                <li><Link to="/storyboard" className="hover:text-purple-500 transition-colors">分镜设计</Link></li>
                <li><Link to="/image-generator" className="hover:text-purple-500 transition-colors">图像生成</Link></li>
                <li><Link to="/video-creator" className="hover:text-purple-500 transition-colors">视频合成</Link></li>
                <li><Link to="/text-to-video" className="hover:text-purple-500 transition-colors">文生视频</Link></li>
                <li><Link to="/image-to-video" className="hover:text-purple-500 transition-colors">图生视频</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">资源</h4>
              <ul className={`space-y-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <li><a href="#" className="hover:text-purple-500 transition-colors">帮助文档</a></li>
                <li><a href="#" className="hover:text-purple-500 transition-colors">教程视频</a></li>
                <li><a href="#" className="hover:text-purple-500 transition-colors">社区论坛</a></li>
                <li><a href="#" className="hover:text-purple-500 transition-colors">API文档</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">公司</h4>
              <ul className={`space-y-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <li><a href="#" className="hover:text-purple-500 transition-colors">关于我们</a></li>
                <li><a href="#" className="hover:text-purple-500 transition-colors">联系我们</a></li>
                <li><a href="#" className="hover:text-purple-500 transition-colors">隐私政策</a></li>
                <li><a href="#" className="hover:text-purple-500 transition-colors">服务条款</a></li>
              </ul>
            </div>
          </div>
          
          <div className={`pt-8 mt-8 text-center text-sm ${isDark ? 'text-gray-500 border-gray-800' : 'text-gray-400 border-gray-200'} border-t`}>
            <p>© 2025 StoryVision. 保留所有权利。</p>
          </div>
        </div>
      </footer>
    </div>
  );
}