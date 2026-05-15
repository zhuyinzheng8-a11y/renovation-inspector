"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { PageHeader } from "@/components/page-header";
import { ResultView } from "@/components/result-view";
import { getInspection, getInspectionResult } from "@/lib/db";
import type { Inspection, InspectionResult } from "@/types";
import { STAGE_LABELS, STAGE_ICONS } from "@/types";
import { exportToPDF } from "@/lib/pdf";

export default function HistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [result, setResult] = useState<InspectionResult | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function load() {
      const [insp, res] = await Promise.all([
        getInspection(id),
        getInspectionResult(id),
      ]);
      setInspection(insp || null);
      setResult(res || null);
      setLoaded(true);
    }
    load();
  }, [id]);

  async function handleExportPDF() {
    if (!inspection || !result) return;
    setShowExportConfirm(false);
    setExporting(true);
    try {
      await exportToPDF(inspection, result);
    } finally {
      setExporting(false);
    }
  }

  const title = inspection
    ? `${STAGE_ICONS[inspection.stage]} ${STAGE_LABELS[inspection.stage]}${inspection.room ? ` · ${inspection.room}` : ""}`
    : "验收详情";

  return (
    <div className="min-h-screen">
      <PageHeader
        title={title}
        subtitle={inspection?.date}
        backHref="/history"
      />

      <main className="max-w-2xl mx-auto px-4 pt-5 pb-8">
        {!loaded ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl h-24 animate-pulse" />
            ))}
          </div>
        ) : !inspection ? (
          <div className="flex flex-col items-center pt-20 text-center">
            <div className="text-4xl mb-4">😔</div>
            <p className="text-sm text-[#9CA3AF]">记录不存在或已被删除</p>
          </div>
        ) : !result ? (
          <div className="flex flex-col items-center pt-20 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-sm text-[#9CA3AF]">分析结果不存在</p>
            <p className="text-xs text-[#C4C9D4] mt-1">
              {inspection.status === "error" ? "本次分析失败" : "分析结果可能未保存"}
            </p>
          </div>
        ) : (
          <ResultView
            inspection={inspection}
            result={result}
            onExportPDF={() => setShowExportConfirm(true)}
          />
        )}
      </main>

      {/* Export confirm modal */}
      {showExportConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-base font-semibold text-[#1A1A1A] mb-2">导出 PDF 报告</h3>
            <p className="text-sm text-[#9CA3AF] leading-relaxed mb-5">
              数据仅保存在本设备，导出后请妥善保存 PDF 文件。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExportConfirm(false)}
                className="flex-1 h-11 border border-[#EBEBEB] rounded-xl text-sm text-[#9CA3AF] hover:bg-[#F5F5F5] transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="flex-1 h-11 bg-[#4F7FFF] rounded-xl text-sm text-white font-semibold hover:bg-[#3D6EEE] transition-colors disabled:opacity-60"
              >
                {exporting ? "导出中..." : "确认导出"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
