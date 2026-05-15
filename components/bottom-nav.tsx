"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/",
    label: "首页",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M3 9.5L11 3L19 9.5V19H14V14H8V19H3V9.5Z"
          stroke="currentColor"
          strokeWidth={active ? "2" : "1.5"}
          strokeLinejoin="round"
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? "0.1" : "0"}
        />
      </svg>
    ),
  },
  {
    href: "/history",
    label: "历史记录",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect
          x="3"
          y="3"
          width="16"
          height="16"
          rx="3"
          stroke="currentColor"
          strokeWidth={active ? "2" : "1.5"}
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? "0.1" : "0"}
        />
        <path d="M7 8H15M7 11H15M7 14H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-[#EBEBEB] safe-area-pb">
      <div className="flex h-14">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                active ? "text-[#4F7FFF]" : "text-[#9CA3AF]"
              }`}
            >
              {item.icon(active)}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
