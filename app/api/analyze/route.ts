import { NextRequest, NextResponse } from "next/server";
import type { Issue, IssueSeverity, SelfCheckItem, InspectionStage } from "@/types";
import { STAGE_LABELS } from "@/types";

interface AnalyzeRequest {
  stage: InspectionStage;
  room: string;
  notes: string;
  images: string[]; // base64 encoded
  mimeTypes: string[];
}

interface AnalyzeResponse {
  issues: Issue[];
  selfCheckItems: SelfCheckItem[];
}

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

export async function POST(req: NextRequest) {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.AI_MODEL || "gpt-4o";

  if (!apiKey || apiKey === "your_api_key_here") {
    return NextResponse.json(
      { error: "请在 .env.local 中配置 AI_API_KEY" },
      { status: 500 }
    );
  }

  let body: AnalyzeRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const { stage, room, notes, images, mimeTypes } = body;

  if (!images || images.length === 0) {
    return NextResponse.json({ error: "请至少上传一张照片" }, { status: 400 });
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

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, max_tokens: 4096 }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", response.status, errText);
      return NextResponse.json(
        { error: `AI 服务请求失败（${response.status}）` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const result = parseResponse(content);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json({ error: "分析失败，请重试" }, { status: 500 });
  }
}
