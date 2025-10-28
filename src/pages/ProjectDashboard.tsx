import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProjectContext, Project } from '@/contexts/projectContext';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
// 导入本地文件系统管理器
import { saveProjectToLocalFile } from '@/utils/localFileSystemManager';

export default function ProjectDashboard() {
  const { projects, createProject, setCurrentProject, deleteProject } = useProjectContext();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt'>('updatedAt');
  const [isExporting, setIsExporting] = useState(false);

  const filteredProjects = projects.filter(project => {
    const query = searchQuery.toLowerCase();
    return (
      project.title.toLowerCase().includes(query) ||
      project.description.toLowerCase().includes(query)
    );
  }).sort((a, b) => {
    if (sortBy === 'createdAt') {
      return b.createdAt.getTime() - a.createdAt.getTime();
    }
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  const handleCreateProject = () => {
    if (!newProjectTitle.trim()) {
      toast.error('请输入项目标题');
      return;
    }
    
    createProject(newProjectTitle, newProjectDescription);
    setNewProjectTitle('');
    setNewProjectDescription('');
    setShowCreateModal(false);
    toast.success('项目创建成功');
  };

  const handleDeleteProject = (projectId: string) => {
    if (window.confirm('确定要删除这个项目吗？此操作不可恢复。')) {
      deleteProject(projectId);
      toast.success('项目已删除');
    }
  };

  const handleContinueProject = (project: Project) => {
    setCurrentProject(project);
    
    // 根据项目状态决定跳转到哪个页面
    if (!project.script.trim()) {
      navigate('/script-writer');
    } else if (project.scenes.length === 0) {
      navigate('/storyboard');
    } else if (project.scenes.some(scene => !scene.imageUrl)) {
      navigate('/image-generator');
    } else {
      navigate('/video-creator');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
   // 项目状态判断，添加剧本与分镜一致性检查
  const getProjectStatus = (project: Project) => {
    if (!project.script.trim()) {
      return { text: '待创建剧本', color: 'text-gray-500 dark:text-gray-400' };
    } else if (project.scenes.length === 0) {
      return { text: '待设计分镜', color: 'text-blue-500' };
    } else {
      // 检查剧本与分镜的一致性
      const hasConsistencyIssue = checkScriptStoryboardConsistency(project);
      if (hasConsistencyIssue) {
        return { text: '剧本与分镜可能不一致', color: 'text-orange-500' };
      } else if (project.scenes.some(scene => !scene.imageUrl)) {
        const completed = project.scenes.filter(scene => scene.imageUrl).length;
        return { 
          text: `图像生成中 (${completed}/${project.scenes.length})`, 
          color: 'text-purple-500' 
        };
      } else if (!project.videoUrl) {
        return { text: '待生成视频', color: 'text-amber-500' };
      } else {
        return { text: '已完成', color: 'text-green-500' };
      }
    }
  };
  
  // 检查剧本与分镜的一致性
  const checkScriptStoryboardConsistency = (project: Project): boolean => {
    if (!project.script || project.scenes.length === 0) return false;
    
    // 简单的一致性检查：比较剧本中的幕数与分镜场景数
    const scriptScenesCount = (project.script.match(/^(第一幕|第二幕|第三幕|第四幕|第五幕|第六幕|第七幕|第八幕|第九幕|第十幕)：/gm) || []).length;
    
    // 如果剧本中明确划分了幕，且分镜场景数与幕数差异较大，则可能存在一致性问题
    if (scriptScenesCount > 0 && Math.abs(scriptScenesCount - project.scenes.length) > scriptScenesCount / 2) {
      return true;
    }
    
    return false;
  };

  // 导出所有项目
  const handleExportAllProjects = async () => {
    if (projects.length === 0) {
      toast.error('没有项目可导出');
      return;
    }

    setIsExporting(true);
    toast.info(`开始导出${projects.length}个项目，请稍候...`);

    try {
      // 创建一个包含所有项目的ZIP文件（简化实现）
      // 在实际应用中，您可能需要使用JSZip等库来创建真正的ZIP文件
      
      // 逐个导出项目
      for (const project of projects) {
        await saveProjectToLocalFile(project);
      }
      
      toast.success(`成功导出${projects.length}个项目！`);
    } catch (error) {
      toast.error(`导出项目失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
      {/* 顶部导航栏 */}
      <nav className={`sticky top-0 z-50 backdrop-blur-md ${isDark ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-200'} border-b px-6 py-4`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
              <i className="fas fa-tachometer-alt text-white"></i>
            </div>
            <h1 className="text-xl font-bold">项目仪表盘</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportAllProjects}
              disabled={isExporting || projects.length === 0}
              className={`px-4 py-2 rounded-lg ${
                isDark ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'
              } text-white transition-all flex items-center ${
                isExporting || projects.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isExporting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>导出中...
                </>
              ) : (
                <>
                  <i className="fas fa-download mr-2"></i>导出所有项目
                </>
              )}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className={`px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white transition-all shadow-lg shadow-indigo-500/30 flex items-center`}
            >
              <i className="fas fa-plus mr-2"></i>新建项目
            </motion.button>
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">总项目数</p>
                <p className="text-3xl font-bold mt-1">{projects.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                <i className="fas fa-project-diagram text-xl"></i>
              </div>
            </div>
          </div>
          
          <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">进行中项目</p>
                <p className="text-3xl font-bold mt-1">
                  {projects.filter(p => !p.videoUrl).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 dark:text-blue-400">
                <i className="fas fa-spinner text-xl"></i>
              </div>
            </div>
          </div>
          
          <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">已完成项目</p>
                <p className="text-3xl font-bold mt-1">
                  {projects.filter(p => p.videoUrl).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-500 dark:text-green-400">
                <i className="fas fa-check-circle text-xl"></i>
              </div>
            </div>
          </div>
          
          <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">总视频时长</p>
                <p className="text-3xl font-bold mt-1">
                  {projects.reduce((total, project) => 
                    total + project.scenes.reduce((sum, scene) => sum + scene.duration, 0), 0)}s
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-500 dark:text-amber-400">
                <i className="fas fa-clock text-xl"></i>
              </div>
            </div>
          </div>
        </div>
        
        {/* 项目列表 */}
        <div className={`mb-8 p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold">项目列表</h2>
            
            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
              <div className={`relative flex-grow sm:flex-grow-0 max-w-sm ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg overflow-hidden`}>
                <input
                  type="text"
                  placeholder="搜索项目..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full py-3 px-10 appearance-none focus:outline-none ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <i className={`fas fa-search ${isDark ? 'text-gray-400' : 'text-gray-500'}`}></i>
                </div>
              </div>
              
              <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg overflow-hidden`}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'updatedAt')}
                  className={`w-full py-3 px-4 pr-10 appearance-none focus:outline-none ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}
                >
                  <option value="updatedAt">最近更新</option>
                  <option value="createdAt">创建时间</option>
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <i className={`fas fa-chevron-down ${isDark ? 'text-gray-400' : 'text-gray-500'}`}></i>
                </div>
              </div>
            </div>
          </div>
          
          {filteredProjects.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-folder-open text-2xl text-gray-400"></i>
              </div>
              <h3 className="text-xl font-medium mb-2">没有找到项目</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchQuery ? '尝试使用不同的搜索词' : '点击"新建项目"开始创建你的第一个项目'}
              </p>
              {!searchQuery && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowCreateModal(true)}
                  className={`px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white transition-colors`}
                >
                  <i className="fas fa-plus mr-2"></i>新建项目
                </motion.button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project) => {
                const status = getProjectStatus(project);
                return (
                  <motion.div
                    key={project.id}
                    whileHover={{ scale: 1.005 }}
                    whileTap={{ scale: 0.995 }}
                    className={`p-5 rounded-xl border ${
                      isDark ? 'border-gray-700 hover:border-gray-600 bg-gray-750/50' : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                    } hover:shadow-md transition-all`}
                  >
                    <div className="flex flex-col md:flex-row justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-bold">{project.title}</h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleContinueProject(project)}
                              className={`px-3 py-1 text-sm rounded-lg ${isDark ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'} text-white transition-colors`}
                            >
                              继续
                            </button>
                            <button
                              onClick={() => handleDeleteProject(project.id)}
                              className={`px-3 py-1 text-sm rounded-lg ${isDark ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-500'} transition-colors`}
                            >
                              删除
                            </button>
                          </div>
                        </div>
                        
                        <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{project.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                          <div className="flex items-center">
                            <i className={`fas fa-calendar-alt mr-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}></i>
                            <span>创建于 {formatDate(project.createdAt)}</span>
                          </div>
                          
                          <div className="flex items-center">
                            <i className={`fas fa-sync-alt mr-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}></i>
                            <span>更新于 {formatDate(project.updatedAt)}</span>
                          </div>
                          
                          <div className="flex items-center">
                            <i className={`fas fa-film mr-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}></i>
                            <span>{project.scenes.length} 个场景</span>
                          </div>
                          
                          <div className="flex items-center">
                            <i className={`fas fa-clock mr-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}></i>
                            <span>{project.scenes.reduce((sum, scene) => sum + scene.duration, 0)} 秒</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`mt-4 md:mt-0 md:ml-6 p-3 rounded-lg ${
                        isDark ? 'bg-gray-700' : 'bg-gray-100'
                      } flex flex-col items-center justify-center min-w-[120px] h-full`}>
                        <span className={`font-medium ${status.color}`}>{status.text}</span>
                      </div>
                    </div>
                    
                    {/* 项目进度条 */}
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">项目进度</span>
                        <span className="text-xs font-medium">
                          {project.videoUrl 
                            ? '100%' 
                            : project.scenes.length > 0 
                              ? project.scenes.filter(scene => scene.imageUrl).length > 0
                                ? Math.round((project.scenes.filter(scene => scene.imageUrl).length / project.scenes.length) * 75) + '%'
                                : '50%'
                              : project.script.trim() ? '25%' : '0%'
                          }
                        </span>
                      </div>
                      <div className={`w-full h-1.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ 
                            width: project.videoUrl 
                              ? '100%' 
                              : project.scenes.length > 0 
                                ? project.scenes.filter(scene => scene.imageUrl).length > 0
                                  ? `${Math.round((project.scenes.filter(scene => scene.imageUrl).length / project.scenes.length) * 75)}%`
                                  : '50%'
                                : project.script.trim() ? '25%' : '0%'
                          }}
                          transition={{ duration: 0.5 }}
                          className={`h-1.5 rounded-full ${
                            project.videoUrl
                              ? 'bg-green-500'
                              : project.scenes.filter(scene => scene.imageUrl).length > 0
                                ? 'bg-amber-500'
                                : project.scenes.length > 0
                                  ? 'bg-purple-500'
                                  : project.script.trim()
                                    ? 'bg-blue-500'
                                    : 'bg-gray-400'
                          }`}
                        ></motion.div>
                      </div>
                      
                      {/* 进度步骤 */}
                      <div className="flex justify-between mt-2">
                        <div className="flex flex-col items-center">
                          <div className={`w-2 h-2 rounded-full ${project.script.trim() ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                          <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">剧本</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className={`w-2 h-2 rounded-full ${project.scenes.length > 0 ? 'bg-purple-500' : 'bg-gray-400'}`}></div>
                          <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">分镜</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className={`w-2 h-2 rounded-full ${project.scenes.filter(scene => scene.imageUrl).length > 0 ? 'bg-amber-500' : 'bg-gray-400'}`}></div>
                          <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">图像</span>
                        </div>
                        <div className="flex flex-col items-center"><div className={`w-2 h-2 rounded-full ${project.videoUrl ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">视频</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      
      {/* 新建项目模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={`w-full max-w-md rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl overflow-hidden`}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold">新建项目</h3>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">项目标题</label>
                <input
                  type="text"
                  placeholder="请输入项目标题"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  className={`w-full p-3 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} border focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                  autoFocus
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">项目描述（可选）</label>
                <textarea
                  placeholder="请输入项目描述"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  rows={3}
                  className={`w-full p-3 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} border focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none`}
                ></textarea>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewProjectTitle('');
                    setNewProjectDescription('');
                  }}
                  className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                >
                  取消
                </button>
                
                <button
                  onClick={handleCreateProject}
                  className={`px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white transition-colors`}
                >
                  创建项目
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}