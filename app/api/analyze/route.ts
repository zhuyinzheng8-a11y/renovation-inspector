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

重要要求（必须遵守）：
1. 只输出纯 JSON，不要用 markdown 代码块包裹，不要添加任何说明文字
2. 确保 JSON 格式合法，description 和 suggestion 字段内容中不要包含花括号 { 或 }
3. 不要在 JSON 前后添加任何额外内容`;
}

/** 深度感知的 JSON 提取：正确匹配最外层花括号，忽略字符串内的 {} */
function extractJSON(text: string): string {
  const start = text.indexOf("{");
  if (start === -1) throw new Error("未在 AI 响应中找到有效 JSON");

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === "\\" && inString) {
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === "{") depth++;
      else if (char === "}") {
        depth--;
        if (depth === 0) {
          return text.slice(start, i + 1);
        }
      }
    }
  }

  throw new Error("未找到匹配的 JSON 结束括号");
}

/** 尝试修复常见的 JSON 格式问题 */
function repairJSON(text: string): string {
  return text.replace(/,\s*([}\]])/g, "$1");
}

/** 正则兜底：暴力搜索响应中最长的合法 JSON 对象 */
function extractJSONByRegex(text: string): string {
  let best = "";
  let bestLen = 0;
  const stack: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "{") stack.push(i);
    else if (text[i] === "}") {
      if (stack.length > 0) {
        const start = stack.pop()!;
        if (stack.length === 0) {
          const candidate = text.slice(start, i + 1);
          try {
            JSON.parse(candidate);
            if (candidate.length > bestLen) {
              best = candidate;
              bestLen = candidate.length;
            }
          } catch {
            // not valid JSON, try next one
          }
        }
      }
    }
  }
  if (best) return best;
  throw new Error("正则提取 JSON 失败");
}

function parseResponse(text: string): AnalyzeResponse {
  let parsed: Record<string, unknown>;

  // Step 1: 移除 markdown 代码块标记
  const cleaned = text.replace(/```json\n?/gi, "").replace(/```\n?/gi, "").trim();

  // Step 2: 尝试直接解析
  try {
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    // Step 3: 用深度感知方式提取最外层 JSON
    try {
      const extracted = extractJSON(cleaned);
      parsed = JSON.parse(extracted) as Record<string, unknown>;
    } catch {
      // Step 4: 正则兜底（暴力搜索所有 {} 组合）
      try {
        const extracted = extractJSONByRegex(cleaned);
        parsed = JSON.parse(extracted) as Record<string, unknown>;
      } catch {
        const snippet = text.slice(0, 100).replace(/\n/g, " ");
        throw new Error(`AI 返回了非法的 JSON 格式（"${snippet}..."），请重试`);
      }
    }
  }

  const VALID_SEVERITIES = new Set<IssueSeverity>(["rework", "fix", "minor"]);

  const issues: Issue[] = ((parsed.issues as Array<Record<string, string>>) || []).map((item: Record<string, string>) => ({
    name: String(item.name || ""),
    description: String(item.description || ""),
    severity: VALID_SEVERITIES.has(item.severity as IssueSeverity)
      ? (item.severity as IssueSeverity)
      : "fix",
    suggestion: String(item.suggestion || ""),
  }));

  const selfCheckItems: SelfCheckItem[] = ((parsed.selfCheckItems as Array<Record<string, string>>) || []).map(
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
