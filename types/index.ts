export type InspectionStage =
  | "water-electric"
  | "masonry"
  | "carpentry"
  | "painting"
  | "completion";

export type IssueSeverity = "rework" | "fix" | "minor";

export interface Issue {
  name: string;
  description: string;
  severity: IssueSeverity;
  suggestion: string;
}

export interface SelfCheckItem {
  name: string;
  method: string;
  checked?: boolean;
}

export interface Inspection {
  id: string;
  stage: InspectionStage;
  room: string;
  date: string;
  photosCount: number;
  notes: string;
  status: "pending" | "analyzing" | "done" | "error";
  createdAt: number;
}

export interface InspectionResult {
  inspectionId: string;
  issues: Issue[];
  selfCheckItems: SelfCheckItem[];
  rawResponse?: string;
  photos?: string[]; // base64 编码的照片数据
}

export const STAGE_LABELS: Record<InspectionStage, string> = {
  "water-electric": "水电验收",
  masonry: "瓦工验收",
  carpentry: "木工验收",
  painting: "油漆验收",
  completion: "竣工验收",
};

export const STAGE_ICONS: Record<InspectionStage, string> = {
  "water-electric": "⚡",
  masonry: "🧱",
  carpentry: "🪵",
  painting: "🎨",
  completion: "🏠",
};

export const STAGE_DESC: Record<InspectionStage, string> = {
  "water-electric": "检查水管走向、电线布置、开关点位等",
  masonry: "检查瓷砖铺贴、墙面找平、防水处理等",
  carpentry: "检查柜体安装、门窗、吊顶等",
  painting: "检查墙面涂料、批刮腻子质量等",
  completion: "全屋综合验收，完工前最后一关",
};

export const SEVERITY_LABELS: Record<IssueSeverity, string> = {
  rework: "必须返工",
  fix: "需整改",
  minor: "轻微",
};
