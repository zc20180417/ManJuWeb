import { createContext } from "react";

// 定义AI模型API密钥接口
export interface ModelAPIKeys {
  // 文本转剧本模型
  doubao?: string;
  gpt4?: string;
  claude3?: string;
  gemini?: string;
  tongyi?: string;
  
  // 分镜设计模型
  gpt4v?: string;
  claude3v?: string;
  wenxin?: string;
  
  // 图像生成模型
  midjourney?: string;
  sd?: string;
  dalle3?: string;
  
  // 视频生成模型
  runway?: string;
  pika?: string;
  sora?: string;
  modelscope?: string;
  jianying?: string;
  
  [key: string]: string | undefined;
}

export const AuthContext = createContext({
  isAuthenticated: false,
  setIsAuthenticated: (value: boolean) => {},
  logout: () => {},
  apiKeys: {} as ModelAPIKeys,
  setApiKey: (model: string, key: string) => {},
  getApiKey: (model: string) => "",
});