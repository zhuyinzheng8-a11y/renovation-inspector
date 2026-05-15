"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";
import { getAllInspections, deleteInspection } from "@/lib/db";
import type { Inspection } from "@/types";
import { STAGE_LABELS, STAGE_ICONS } from "@/types";

type Filter = "all" | "has-issues" | "no-issues";

export default function HistoryPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loaded, setLoaded] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadInspections();
  }, []);

  async function loadInspections() {
    const all = await getAllInspections();
    setInspections(all);
    setLoaded(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("确认删除这条验收记录？")) return;
    setDeletingId(id);
    await deleteInspection(id);
    await loadInspections();
    setDeletingId(null);
  }

  const filtered = inspections.filter((insp) => {
    if (filter === "has-issues") return insp.status === "done";
    if (filter === "no-issues") return insp.status === "error" || insp.status === "pending";
    return true;
  });

  // Group by date
  const byDate = filtered.reduce<Record<string, Inspection[]>>((acc, insp) => {
    const key = insp.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(insp);
    return acc;
  }, {});
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white border-b border-[#EBEBEB]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-[15px] font-semibold">验收历史</h1>
          <Link
            href="/inspect/new"
            className="text-sm text-[#4F7FFF] font-medium"
          >
            + 新建验收
          </Link>
        </div>
        {/* Filter tabs */}
        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2">
          {(["all", "has-issues", "no-issues"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-[#4F7FFF] text-white"
                  : "bg-[#F5F5F5] text-[#9CA3AF] hover:bg-[#EBEBEB]"
              }`}
            >
              {f === "all" ? "全部" : f === "has-issues" ? "已完成" : "未完成"}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4">
        {!loaded ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl h-20 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-center">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-sm text-[#9CA3AF]">
              {filter === "all" ? "还没有验收记录" : "没有符合条件的记录"}
            </p>
            {filter === "all" && (
              <Link
                href="/inspect/new"
                className="mt-4 px-5 h-10 bg-[#4F7FFF] text-white text-sm font-medium rounded-xl inline-flex items-center hover:bg-[#3D6EEE] transition-colors"
              >
                开始第一次验收
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-5 pb-4">
            {sortedDates.map((date) => (
              <div key={date}>
                <p className="text-xs font-medium text-[#9CA3AF] mb-2 px-1">{date}</p>
                <div className="space-y-2">
                  {byDate[date].map((insp) => (
                    <InspectionCard
                      key={insp.id}
                      inspection={insp}
                      onDelete={handleDelete}
                      deleting={deletingId === insp.id}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notice */}
        <div className="py-4 border-t border-[#EBEBEB] mt-2">
          <p className="text-xs text-center text-[#C4C9D4]">
            ⚠️ 历史记录仅保存在本设备，清除浏览器缓存将导致数据丢失
            <br />建议对重要记录及时导出 PDF 保存
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function InspectionCard({
  inspection,
  onDelete,
  deleting,
}: {
  inspection: Inspection;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden transition-opacity ${deleting ? "opacity-50" : ""}`}>
      <Link href={`/history/${inspection.id}`} className="block px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <span className="text-xl mt-0.5 shrink-0">{STAGE_ICONS[inspection.stage]}</span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#1A1A1A]">
                {STAGE_LABELS[inspection.stage]}
                {inspection.room && (
                  <span className="text-[#9CA3AF] font-normal"> · {inspection.room}</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <StatusBadge status={inspection.status} />
                <span className="text-xs text-[#C4C9D4]">{inspection.photosCount} 张照片</span>
                <span className="text-xs text-[#C4C9D4]">
                  {new Date(inspection.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#C4C9D4] mt-0.5 shrink-0">
            <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </Link>
      <div className="px-4 py-2 border-t border-[#F5F5F5] flex justify-end">
        <button
          onClick={() => onDelete(inspection.id)}
          disabled={deleting}
          className="text-xs text-[#EF4444] hover:text-[#DC2626] transition-colors disabled:opacity-50"
        >
          删除
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Inspection["status"] }) {
  const map = {
    pending: { text: "待分析", cls: "bg-[#F5F5F5] text-[#9CA3AF]" },
    analyzing: { text: "分析中", cls: "bg-[#EEF3FF] text-[#4F7FFF]" },
    done: { text: "已完成", cls: "bg-[#F0FDF4] text-[#16A34A]" },
    error: { text: "失败", cls: "bg-[#FEF2F2] text-[#EF4444]" },
  };
  const cfg = map[status];
  return (
    <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded ${cfg.cls}`}>
      {cfg.text}
    </span>
  );
}
