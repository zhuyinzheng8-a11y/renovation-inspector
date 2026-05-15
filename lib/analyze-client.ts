import { fileToBase64 } from "./compress";
import type { InspectionStage, Issue, SelfCheckItem } from "@/types";

interface AnalyzeParams {
  stage: InspectionStage;
  room: string;
  notes: string;
  photos: File[];
}

interface AnalyzeResult {
  issues: Issue[];
  selfCheckItems: SelfCheckItem[];
}

export async function analyzeInspection(params: AnalyzeParams): Promise<AnalyzeResult> {
  const { stage, room, notes, photos } = params;

  const images: string[] = [];
  const mimeTypes: string[] = [];

  for (const photo of photos) {
    const b64 = await fileToBase64(photo);
    images.push(b64);
    mimeTypes.push(photo.type || "image/jpeg");
  }

  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stage, room, notes, images, mimeTypes }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "请求失败" }));
    throw new Error(err.error || "分析失败");
  }

  return response.json();
}
