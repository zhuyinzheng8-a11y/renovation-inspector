"use client";

import { useState } from "react";
import type { Inspection, InspectionResult } from "@/types";
import { STAGE_LABELS, STAGE_ICONS } from "@/types";
import { IssueCard } from "./issue-card";

interface ResultViewProps {
  inspection: Inspection;
  result: InspectionResult;
  onExportPDF?: () => void;
}

export function ResultView({ inspection, result, onExportPDF }: ResultViewProps) {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const issueCount = result.issues.length;
  const reworkCount = result.issues.filter((i) => i.severity === "rework").length;
  const fixCount = result.issues.filter((i) => i.severity === "fix").length;
  const minorCount = result.issues.filter((i) => i.severity === "minor").length;

  function toggleCheck(idx: number) {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* Photos */}
      {result.photos && result.photos.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">现场照片</h3>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {result.photos.map((src, idx) => (
              <img
                key={idx}
                src={`data:image/jpeg;base64,${src}`}
                alt={`照片 ${idx + 1}`}
                className="w-28 h-28 object-cover rounded-lg shrink-0 border border-[#EBEBEB]"
              />
            ))}
          </div>
        </div>
      )}
      {/* Summary */}
      <div className="bg-white rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">{STAGE_ICONS[inspection.stage]}</span>
          <div>
            <div className="text-sm font-semibold text-[#1A1A1A]">
              {STAGE_LABELS[inspection.stage]}
              {inspection.room && <span className="text-[#9CA3AF]"> · {inspection.room}</span>}
            </div>
            <div className="text-xs text-[#9CA3AF]">{inspection.date} · {inspection.photosCount} 张照片</div>
          </div>
        </div>

        {issueCount === 0 ? (
          <div className="flex items-center gap-2 text-[#22C55E]">
            <span className="text-lg">✅</span>
            <span className="text-sm font-medium">未发现明显质量问题</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-sm text-[#1A1A1A]">
              共发现 <span className="font-semibold">{issueCount}</span> 个问题
            </span>
            <div className="flex gap-1 ml-1">
              {reworkCount > 0 && (
                <span className="text-xs bg-[#FEF2F2] text-[#EF4444] px-2 py-0.5 rounded-full font-medium">
                  {reworkCount} 必须返工
                </span>
              )}
              {fixCount > 0 && (
                <span className="text-xs bg-[#FFFBEB] text-[#D97706] px-2 py-0.5 rounded-full font-medium">
                  {fixCount} 需整改
                </span>
              )}
              {minorCount > 0 && (
                <span className="text-xs bg-[#F0FDF4] text-[#16A34A] px-2 py-0.5 rounded-full font-medium">
                  {minorCount} 轻微
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Issues */}
      {result.issues.length > 0 && (
        <div className="space-y-3">
          {result.issues.map((issue, idx) => (
            <IssueCard key={idx} issue={issue} />
          ))}
        </div>
      )}

      {/* Self-check items */}
      {result.selfCheckItems.length > 0 && (
        <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#EBEBEB]">
            <h3 className="text-sm font-semibold text-[#1A1A1A]">📋 现场自测项目</h3>
            <p className="text-xs text-[#9CA3AF] mt-0.5">以下项目需要你现场操作检验</p>
          </div>
          <div className="divide-y divide-[#EBEBEB]">
            {result.selfCheckItems.map((item, idx) => (
              <div key={idx} className="px-4 py-3 flex gap-3">
                <button
                  onClick={() => toggleCheck(idx)}
                  className={`mt-0.5 w-5 h-5 rounded shrink-0 flex items-center justify-center border transition-colors ${
                    checkedItems.has(idx)
                      ? "bg-[#4F7FFF] border-[#4F7FFF]"
                      : "border-[#D1D5DB] bg-white"
                  }`}
                >
                  {checkedItems.has(idx) && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${checkedItems.has(idx) ? "line-through text-[#9CA3AF]" : "text-[#1A1A1A]"}`}>
                    {item.name}
                  </p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5 leading-relaxed">{item.method}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export + Notice */}
      <div className="space-y-3 pb-6">
        <button
          onClick={onExportPDF}
          className="w-full h-12 bg-[#4F7FFF] hover:bg-[#3D6EEE] active:bg-[#3060DD] text-white text-sm font-semibold rounded-xl transition-colors"
        >
          导出 PDF 验收报告
        </button>
        <p className="text-xs text-center text-[#9CA3AF]">
          ⚠️ 报告数据仅存储在本设备，建议及时导出保存
        </p>
      </div>
    </div>
  );
}
