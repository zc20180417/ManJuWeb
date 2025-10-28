import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import { ModelAPIKeys } from '@/contexts/authContext';
import ScriptWriter from "@/pages/ScriptWriter";
import Storyboard from "@/pages/Storyboard";
import ImageGenerator from "@/pages/ImageGenerator";
import VideoCreator from "@/pages/VideoCreator";
import ProjectDashboard from "@/pages/ProjectDashboard";
import { useState } from "react";
import { AuthContext } from '@/contexts/authContext';
import { ProjectContextProvider } from '@/contexts/projectContext';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [apiKeys, setApiKeys] = useState<ModelAPIKeys>(() => {
    const saved = localStorage.getItem('storyvision-api-keys');
    return saved ? JSON.parse(saved) : {};
  });

  const logout = () => {
    setIsAuthenticated(false);
  };

  // 保存API密钥到localStorage
  const saveApiKeys = (updatedKeys: ModelAPIKeys) => {
    setApiKeys(updatedKeys);
    localStorage.setItem('storyvision-api-keys', JSON.stringify(updatedKeys));
  };

  // 设置单个API密钥
  const setApiKey = (model: string, key: string) => {
    const updatedKeys = { ...apiKeys, [model]: key };
    saveApiKeys(updatedKeys);
  };

  // 获取指定模型的API密钥
  const getApiKey = (model: string): "" => {
    return (apiKeys[model] || '') as "";
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, setIsAuthenticated, logout, apiKeys, setApiKey, getApiKey }}
    >
      <ProjectContextProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<ProjectDashboard />} />
          <Route path="/script-writer" element={<ScriptWriter />} />
          <Route path="/storyboard" element={<Storyboard />} />
          <Route path="/image-generator" element={<ImageGenerator />} />
          <Route path="/video-creator" element={<VideoCreator />} />
        </Routes>
      </ProjectContextProvider>
    </AuthContext.Provider>
  );
}