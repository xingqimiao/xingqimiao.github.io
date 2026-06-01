import { cn } from "@/lib/utils";

export interface BentoCardProps {
  children?: React.ReactNode;
  className?: string;
  theme?: 'light' | 'dark';
  hoverEffect?: boolean;
}

export function BentoCard({ children, className, theme = 'light', hoverEffect = false }: BentoCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[48px] p-6 transition-colors duration-500",
        theme === 'dark' ? 'bg-[#0D0D12] border border-white/10' : 'bg-[#F8F9FC] border border-black/5',
        hoverEffect && "group",
        className
      )}
    >
      {/* 极光发光层 - 强制三元表达式控制 */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-80">
        <div className={cn(
          "absolute w-[60%] h-[60%] rounded-full blur-[100px] translate-x-10",
          theme === 'dark' ? 'bg-blue-900/40 mix-blend-screen' : 'bg-[#5BCEFA]/60 mix-blend-multiply'
        )}></div>
        <div className={cn(
          "absolute w-[50%] h-[50%] rounded-full blur-[90px] -translate-x-10 translate-y-10",
          theme === 'dark' ? 'bg-pink-900/40 mix-blend-screen' : 'bg-[#F5A9B8]/60 mix-blend-multiply'
        )}></div>
      </div>

      {/* 内部 UI 容器 - 完美的 G2 24px 圆角 */}
      <div className="relative z-10 w-full h-full rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden transition-transform duration-500 group-hover:scale-[1.02]">
        {children}
      </div>
    </div>
  );
}
