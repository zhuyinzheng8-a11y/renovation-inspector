import { fileToBase64 } from "./compress";
import type { InspectionStage, Issue, IssueSeverity, SelfCheckItem } from "@/types";
import { STAGE_LABELS } from "@/types";

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

interface AnalyzeResponse {
  issues: Issue[];
  selfCheckItems: SelfCheckItem[];
}

// Client-side API config
const AI_API_KEY = process.env.NEXT_PUBLIC_AI_API_KEY || "";
const AI_BASE_URL = process.env.NEXT_PUBLIC_AI_BASE_URL || "https://api.openai.com/v1";
const AI_MODEL = process.env.NEXT_PUBLIC_AI_MODEL || "gpt-4o";

function buildPrompt(stage: InspectionStage, room: string, notes: string): string {
  return `你是一位专业的装修验收顾问，拥有丰富的施工质量检验经验。

当前验收阶段：${STAGE_LABELS[stage]}
房间：${room || "未指定"}
用户补充说明：${notes || "无"}

请仔细分析上传的装修现场照片，以 JSON 格式输出验收报告，格式如下：

{
  "issues": [
    {
      "name": "问题名称",
      "description": "问题描述（具体位置、表现、大小范围）",
      "severity": "rework | fix | minor",
      "suggestion": "整改建议（具体、可操作）"
    }
  ],
  "selfCheckItems": [
    {
      "name": "检查项名称",
      "method": "检查方法（简明易懂，适合非专业人士操作）"
    }
  ]
}

severity 字段说明：
- rework：必须返工（不符合国家验收标准，施工方须重做）
- fix：需整改（存在明显缺陷，需要修补处理）
- minor：轻微（影响美观但不影响使用）

如果未发现明显质量问题，issues 返回空数组，仍需给出该阶段的现场自测项目。

只输出 JSON，不要输出其他内容。语言用中文，专业但通俗易懂。`;
}

function parseResponse(text: string): AnalyzeResponse {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("未在 AI 响应中找到有效 JSON");
  }
  const cleaned = text.slice(start, end + 1).trim();
  const parsed = JSON.parse(cleaned);

  const VALID_SEVERITIES = new Set<IssueSeverity>(["rework", "fix", "minor"]);

  const issues: Issue[] = (parsed.issues || []).map((item: Record<string, string>) => ({
    name: String(item.name || ""),
    description: String(item.description || ""),
    severity: VALID_SEVERITIES.has(item.severity as IssueSeverity)
      ? (item.severity as IssueSeverity)
      : "fix",
    suggestion: String(item.suggestion || ""),
  }));

  const selfCheckItems: SelfCheckItem[] = (parsed.selfCheckItems || []).map(
    (item: Record<string, string>) => ({
      name: String(item.name || ""),
      method: String(item.method || ""),
      checked: false,
    })
  );

  return { issues, selfCheckItems };
}

export async function analyzeInspection(params: AnalyzeParams): Promise<AnalyzeResult> {
  const { stage, room, notes, photos } = params;

  if (!AI_API_KEY || AI_API_KEY === "your_api_key_here") {
    throw new Error("请在环境变量中配置 NEXT_PUBLIC_AI_API_KEY");
  }

  const images: string[] = [];
  const mimeTypes: string[] = [];

  for (const photo of photos) {
    const b64 = await fileToBase64(photo);
    images.push(b64);
    mimeTypes.push(photo.type || "image/jpeg");
  }

  const imageContent = images.map((b64, i) => ({
    type: "image_url" as const,
    image_url: {
      url: `data:${mimeTypes[i] || "image/jpeg"};base64,${b64}`,
    },
  }));

  const messages = [
    {
      role: "user" as const,
      content: [
        { type: "text" as const, text: buildPrompt(stage, room, notes) },
        ...imageContent,
      ],
    },
  ];

  const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({ model: AI_MODEL, messages, max_tokens: 4096 }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`AI 服务请求失败（${response.status}）`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  if (!content) {
    throw new Error("AI 响应为空");
  }

  return parseResponse(content);
}
