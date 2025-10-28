import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Empty component with better styling and animations
export function Empty() {
  return (
    <div 
      className={cn(
        "flex h-full items-center justify-center flex-col",
        "p-8 rounded-lg border border-dashed",
        "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700",
        "text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300",
        "shadow-sm hover:shadow-md transition-shadow duration-300"
      )} 
      onClick={() => toast('Coming soon')}
    >
      <div className="animate-bounce">
        <i className="fas fa-box-open text-4xl mb-4"></i>
      </div>
      <p className="text-lg font-medium">该功能正在开发中</p>
      <p className="text-sm mt-2">敬请期待...</p>
    </div>
  );
}