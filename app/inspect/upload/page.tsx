"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { useInspection } from "@/context/inspection";
import { STAGE_LABELS, STAGE_ICONS } from "@/types";
import { compressImage } from "@/lib/compress";

const MAX_PHOTOS = 9;

interface PhotoEntry {
  file: File;
  preview: string;
  compressing: boolean;
}

export default function UploadPage() {
  const router = useRouter();
  const { draft, setPhotos, setNotes } = useInspection();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photos, setLocalPhotos] = useState<PhotoEntry[]>([]);
  const [notes, setLocalNotes] = useState(draft.notes);
  const [compressingCount, setCompressingCount] = useState(0);

  useEffect(() => {
    if (!draft.stage) {
      router.replace("/inspect/new");
    }
  }, [draft.stage, router]);

  async function handleFileSelect(files: FileList | null) {
    if (!files) return;
    const remaining = MAX_PHOTOS - photos.length;
    const toAdd = Array.from(files).slice(0, remaining);

    const entries: PhotoEntry[] = toAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      compressing: file.size > 1024 * 1024,
    }));

    setLocalPhotos((prev) => [...prev, ...entries]);
    setCompressingCount((c) => c + entries.filter((e) => e.compressing).length);

    const compressed = await Promise.all(
      entries.map(async (entry) => {
        if (entry.file.size <= 1024 * 1024) return entry;
        const compressedFile = await compressImage(entry.file);
        setCompressingCount((c) => Math.max(0, c - 1));
        return { ...entry, file: compressedFile, compressing: false };
      })
    );

    setLocalPhotos((prev) => {
      const next = [...prev];
      const startIdx = next.length - entries.length;
      compressed.forEach((c, i) => {
        if (startIdx + i < next.length) {
          next[startIdx + i] = c;
        }
      });
      return next;
    });
  }

  function removePhoto(idx: number) {
    setLocalPhotos((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  }

  async function handleSubmit() {
    if (photos.length === 0 || compressingCount > 0) return;
    setPhotos(photos.map((p) => p.file));
    setNotes(notes.trim());
    router.push("/inspect/result");
  }

  if (!draft.stage) return null;

  const title = `${STAGE_ICONS[draft.stage]} ${STAGE_LABELS[draft.stage]}${draft.room ? ` · ${draft.room}` : ""}`;

  return (
    <div className="min-h-screen">
      <PageHeader title={title} backHref="/inspect/new" />

      <main className="max-w-2xl mx-auto px-4 pt-5 pb-8">
        {/* Upload tip */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-[#1A1A1A] mb-0.5">
            上传照片 <span className="text-[#9CA3AF] font-normal">（最多 {MAX_PHOTOS} 张）</span>
          </h2>
          <p className="text-xs text-[#9CA3AF]">建议拍摄：墙角、地面、瓷砖接缝、有疑问的区域</p>
        </div>

        {/* Photo grid */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {photos.map((photo, idx) => (
            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-[#F5F5F5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.preview}
                alt={`照片 ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              {photo.compressing && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white text-[10px] font-medium">压缩中...</span>
                </div>
              )}
              <button
                onClick={() => removePhoto(idx)}
                className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center"
                aria-label="删除"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 2L8 8M8 2L2 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}

          {photos.length < MAX_PHOTOS && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-[#EBEBEB] bg-white flex flex-col items-center justify-center gap-1 hover:border-[#4F7FFF] hover:bg-[#EEF3FF] transition-colors group"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#C4C9D4] group-hover:text-[#4F7FFF] transition-colors">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="text-[10px] text-[#C4C9D4] group-hover:text-[#4F7FFF] transition-colors">添加</span>
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />

        {/* Notes */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
            补充说明 <span className="text-[#9CA3AF] font-normal">（选填）</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setLocalNotes(e.target.value)}
            placeholder="描述你觉得有问题的地方，帮助 AI 更精准分析..."
            rows={3}
            className="w-full bg-white border border-[#EBEBEB] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-[#C4C9D4] outline-none focus:border-[#4F7FFF] focus:ring-1 focus:ring-[#4F7FFF] transition-colors resize-none"
          />
        </div>

        {/* Privacy notice */}
        <div className="flex items-start gap-2 bg-[#F8F9FA] rounded-xl px-4 py-3 mb-6">
          <span className="text-sm mt-0.5">🔒</span>
          <p className="text-xs text-[#9CA3AF] leading-relaxed">
            照片仅用于本次 AI 分析，不会上传至服务器
          </p>
        </div>

        {/* Compress status */}
        {compressingCount > 0 && (
          <div className="bg-[#EEF3FF] rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-[#4F7FFF] border-t-transparent animate-spin shrink-0" />
            <p className="text-xs text-[#4F7FFF] font-medium">正在压缩图片...</p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={photos.length === 0 || compressingCount > 0}
          className="w-full h-12 bg-[#4F7FFF] hover:bg-[#3D6EEE] active:bg-[#3060DD] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {compressingCount > 0
            ? "图片压缩中..."
            : photos.length === 0
            ? "请先上传照片"
            : `开始 AI 分析（${photos.length} 张）`}
        </button>
      </main>
    </div>
  );
}
