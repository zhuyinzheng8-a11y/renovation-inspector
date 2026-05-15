"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ResultView } from "@/components/result-view";
import { useInspection } from "@/context/inspection";
import { analyzeInspection } from "@/lib/analyze-client";
import { saveInspection, saveInspectionResult } from "@/lib/db";
import type { Inspection, InspectionResult } from "@/types";
import { STAGE_LABELS, STAGE_ICONS } from "@/types";
import { exportToPDF } from "@/lib/pdf";
import { fileToBase64 } from "@/lib/compress";

type AnalyzeState = "analyzing" | "done" | "error";

export default function ResultPage() {
  const router = useRouter();
  const { draft, reset } = useInspection();
  const [state, setState] = useState<AnalyzeState>("analyzing");
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [result, setResult] = useState<InspectionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    if (!draft.stage || draft.photos.length === 0) {
      router.replace("/inspect/new");
      return;
    }
    hasStarted.current = true;

    const id = crypto.randomUUID();
    const date = new Date().toISOString().split("T")[0];

    const newInspection: Inspection = {
      id,
      stage: draft.stage,
      room: draft.room,
      date,
      photosCount: draft.photos.length,
      notes: draft.notes,
      status: "analyzing",
      createdAt: Date.now(),
    };

    saveInspection(newInspection).catch(console.error);
    setInspection(newInspection);

    // Convert photos to base64 for persistent storage
    const photoDataPromise = Promise.all(
      draft.photos.map((f) => fileToBase64(f))
    );

    analyzeInspection({
      stage: draft.stage,
      room: draft.room,
      notes: draft.notes,
      photos: draft.photos,
    })
      .then(async (res) => {
        const doneInspection: Inspection = { ...newInspection, status: "done" };
        const photos = await photoDataPromise;
        const inspResult: InspectionResult = {
          inspectionId: id,
          issues: res.issues,
          selfCheckItems: res.selfCheckItems,
          photos,
        };
        await Promise.all([
          saveInspection(doneInspection),
          saveInspectionResult(inspResult),
        ]);
        setInspection(doneInspection);
        setResult(inspResult);
        setState("done");
        reset();
      })
      .catch((err) => {
        const errInspection: Inspection = { ...newInspection, status: "error" };
        saveInspection(errInspection).catch(console.error);
        setInspection(errInspection);
        setErrorMsg(err.message || "分析失败，请重试");
        setState("error");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    : "分析结果";

  return (
    <div className="min-h-screen">
      <PageHeader
        title={title}
        subtitle={inspection?.date}
        backHref="/"
      />

      <main className="max-w-2xl mx-auto px-4 pt-5 pb-8">
        {state === "analyzing" && (
          <AnalyzingView photosCount={draft.photos.length} />
        )}

        {state === "error" && (
          <ErrorView message={errorMsg} onRetry={() => router.replace("/inspect/upload")} />
        )}

        {state === "done" && inspection && result && (
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

function AnalyzingView({ photosCount }: { photosCount: number }) {
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    const steps = [30, 55, 75, 88, 94];
    let i = 0;
    const timer = setInterval(() => {
      if (i < steps.length) {
        setProgress(steps[i]);
        i++;
      } else {
        clearInterval(timer);
      }
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center pt-16 pb-8 text-center">
      <div className="w-16 h-16 mb-6 relative">
        <div className="absolute inset-0 rounded-full border-4 border-[#EBEBEB]" />
        <div
          className="absolute inset-0 rounded-full border-4 border-[#4F7FFF] border-t-transparent animate-spin"
          style={{ animationDuration: "1s" }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">🔍</div>
      </div>
      <h2 className="text-base font-semibold text-[#1A1A1A] mb-2">AI 正在分析中...</h2>
      <p className="text-sm text-[#9CA3AF] mb-8">
        正在分析 {photosCount} 张照片，请稍候
      </p>

      <div className="w-full max-w-xs">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-[#9CA3AF]">分析进度</span>
          <span className="text-xs text-[#4F7FFF] font-medium tabular">{progress}%</span>
        </div>
        <div className="h-1.5 bg-[#EBEBEB] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#4F7FFF] rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-[#C4C9D4] mt-6">分析时间约 30-60 秒，请保持页面开启</p>
    </div>
  );
}

function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center pt-16 text-center">
      <div className="text-4xl mb-4">😔</div>
      <h2 className="text-base font-semibold text-[#1A1A1A] mb-2">分析失败</h2>
      <p className="text-sm text-[#9CA3AF] mb-8 max-w-xs">{message}</p>
      <button
        onClick={onRetry}
        className="px-6 h-11 bg-[#4F7FFF] text-white text-sm font-semibold rounded-xl hover:bg-[#3D6EEE] transition-colors"
      >
        重新上传
      </button>
    </div>
  );
}
