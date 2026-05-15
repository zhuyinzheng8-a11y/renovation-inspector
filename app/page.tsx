"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAllInspections } from "@/lib/db";
import { BottomNav } from "@/components/bottom-nav";
import type { Inspection } from "@/types";
import { STAGE_LABELS, STAGE_ICONS } from "@/types";

function formatDate(dateStr: string) {
  return dateStr;
}

function IssueCountBadge({ inspection }: { inspection: Inspection }) {
  if (inspection.status !== "done") {
    return <span className="text-xs text-[#9CA3AF]">分析中...</span>;
  }
  return null;
}

export default function HomePage() {
  const [recentInspections, setRecentInspections] = useState<Inspection[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getAllInspections()
      .then((all) => {
        setRecentInspections(all.slice(0, 5));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white border-b border-[#EBEBEB]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏠</span>
            <span className="text-[15px] font-semibold text-[#1A1A1A]">验收助手</span>
          </div>
          <Link
            href="/history"
            className="text-sm text-[#4F7FFF] font-medium"
          >
            历史记录
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-5 space-y-5">
        {/* CTA Card */}
        <div className="bg-[#4F7FFF] rounded-2xl p-5 text-white">
          <h2 className="text-lg font-semibold mb-1">开始验收</h2>
          <p className="text-sm text-white/75 mb-4">
            拍照上传，AI 帮你发现装修质量问题
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs text-white/80 mb-5">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">✓</span>
              识别施工质量问题
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">✓</span>
              判断问题严重程度
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">✓</span>
              生成专业验收报告
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">✓</span>
              数据本地存储
            </div>
          </div>
          <Link
            href="/inspect/new"
            className="block w-full bg-white text-[#4F7FFF] text-sm font-semibold text-center py-3 rounded-xl hover:bg-white/90 active:bg-white/80 transition-colors"
          >
            新建验收
          </Link>
        </div>

        {/* Recent inspections */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#1A1A1A]">最近验收</h3>
            {loaded && recentInspections.length > 0 && (
              <Link href="/history" className="text-xs text-[#4F7FFF]">
                查看全部
              </Link>
            )}
          </div>

          {!loaded ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl h-16 animate-pulse" />
              ))}
            </div>
          ) : recentInspections.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <p className="text-[#9CA3AF] text-sm">还没有验收记录</p>
              <p className="text-[#C4C9D4] text-xs mt-1">点击上方「新建验收」开始</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentInspections.map((insp) => (
                <Link
                  key={insp.id}
                  href={`/history/${insp.id}`}
                  className="block bg-white rounded-xl px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{STAGE_ICONS[insp.stage]}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[#1A1A1A] truncate">
                          {STAGE_LABELS[insp.stage]}
                          {insp.room && (
                            <span className="text-[#9CA3AF] font-normal"> · {insp.room}</span>
                          )}
                        </div>
                        <div className="text-xs text-[#9CA3AF]">{formatDate(insp.date)}</div>
                      </div>
                    </div>
                    <IssueCountBadge inspection={insp} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Privacy notice */}
        <p className="text-xs text-center text-[#C4C9D4] pb-2">
          📱 数据仅保存在本设备，不上传服务器
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
