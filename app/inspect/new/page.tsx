"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { useInspection } from "@/context/inspection";
import type { InspectionStage } from "@/types";
import { STAGE_LABELS, STAGE_ICONS, STAGE_DESC } from "@/types";

const STAGES: InspectionStage[] = [
  "water-electric",
  "masonry",
  "carpentry",
  "painting",
  "completion",
];

const POPULAR: InspectionStage[] = ["water-electric", "masonry"];

export default function NewInspectionPage() {
  const router = useRouter();
  const { draft, setStage, setRoom, reset } = useInspection();
  const [selectedStage, setSelectedStage] = useState<InspectionStage | null>(
    draft.stage
  );
  const [room, setRoomLocal] = useState(draft.room);

  function handleNext() {
    if (!selectedStage) return;
    reset();
    setStage(selectedStage);
    setRoom(room.trim());
    router.push("/inspect/upload");
  }

  return (
    <div className="min-h-screen">
      <PageHeader title="新建验收" backHref="/" />

      <main className="max-w-2xl mx-auto px-4 pt-5 pb-8">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-[#1A1A1A] mb-1">选择验收阶段</h2>
          <p className="text-sm text-[#9CA3AF]">不同阶段的检查重点不同，AI 会针对性分析</p>
        </div>

        {/* Stage list */}
        <div className="space-y-2 mb-6">
          {STAGES.map((stage) => {
            const isSelected = selectedStage === stage;
            const isPopular = POPULAR.includes(stage);
            return (
              <button
                key={stage}
                onClick={() => setSelectedStage(stage)}
                className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-left transition-all ${
                  isSelected
                    ? "bg-[#EEF3FF] ring-1 ring-[#4F7FFF]"
                    : "bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                }`}
              >
                <span className="text-2xl shrink-0">{STAGE_ICONS[stage]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isSelected ? "text-[#4F7FFF]" : "text-[#1A1A1A]"}`}>
                      {STAGE_LABELS[stage]}
                    </span>
                    {isPopular && (
                      <span className="text-[10px] bg-[#FFF7ED] text-[#D97706] px-1.5 py-0.5 rounded font-medium">
                        常用
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#9CA3AF] mt-0.5 truncate">{STAGE_DESC[stage]}</p>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className={`shrink-0 transition-colors ${isSelected ? "text-[#4F7FFF]" : "text-[#C4C9D4]"}`}
                >
                  {isSelected ? (
                    <circle cx="8" cy="8" r="7" fill="#4F7FFF" stroke="#4F7FFF" strokeWidth="1.5" />
                  ) : (
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                  )}
                  {isSelected && (
                    <path d="M5 8L7 10L11 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  )}
                </svg>
              </button>
            );
          })}
        </div>

        {/* Room input */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
            填写房间 <span className="text-[#9CA3AF] font-normal">（选填）</span>
          </label>
          <input
            type="text"
            value={room}
            onChange={(e) => setRoomLocal(e.target.value)}
            placeholder="例：主卧室、客厅、卫生间..."
            className="w-full h-11 bg-white border border-[#EBEBEB] rounded-xl px-4 text-sm text-[#1A1A1A] placeholder:text-[#C4C9D4] outline-none focus:border-[#4F7FFF] focus:ring-1 focus:ring-[#4F7FFF] transition-colors"
          />
        </div>

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={!selectedStage}
          className="w-full h-12 bg-[#4F7FFF] hover:bg-[#3D6EEE] active:bg-[#3060DD] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          下一步：上传照片
        </button>
      </main>
    </div>
  );
}
