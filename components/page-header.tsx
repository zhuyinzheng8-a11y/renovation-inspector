"use client";

import { useRouter } from "next/navigation";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, backHref, action }: PageHeaderProps) {
  const router = useRouter();

  function handleBack() {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  }

  return (
    <div className="sticky top-0 z-10 bg-[#F5F5F5] border-b border-[#EBEBEB]">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-8 h-8 -ml-1 rounded-full hover:bg-black/5 transition-colors text-[#1A1A1A]"
          aria-label="返回"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-semibold truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-[#9CA3AF] truncate">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
