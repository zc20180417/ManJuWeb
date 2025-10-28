import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from 'sonner';
import App from "./App.tsx";
import "./index.css";

// 设置全局样式和主题
document.documentElement.classList.add('light');

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster 
        position="top-right"
        richColors
        closeButton
        duration={3000}
      />
    </BrowserRouter>
  </StrictMode>
);
