import type { Issue, IssueSeverity } from "@/types";
import { SEVERITY_LABELS } from "@/types";

const SEVERITY_CONFIG: Record<
  IssueSeverity,
  { bar: string; badge: string; text: string; bg: string }
> = {
  rework: {
    bar: "bg-[#EF4444]",
    badge: "bg-[#FEF2F2] text-[#EF4444]",
    text: "text-[#EF4444]",
    bg: "bg-white",
  },
  fix: {
    bar: "bg-[#F59E0B]",
    badge: "bg-[#FFFBEB] text-[#D97706]",
    text: "text-[#D97706]",
    bg: "bg-white",
  },
  minor: {
    bar: "bg-[#22C55E]",
    badge: "bg-[#F0FDF4] text-[#16A34A]",
    text: "text-[#16A34A]",
    bg: "bg-white",
  },
};

const SEVERITY_ICON: Record<IssueSeverity, string> = {
  rework: "🔴",
  fix: "⚠️",
  minor: "✅",
};

interface IssueCardProps {
  issue: Issue;
  index?: number;
}

export function IssueCard({ issue }: IssueCardProps) {
  const cfg = SEVERITY_CONFIG[issue.severity];

  return (
    <div className={`${cfg.bg} rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex`}>
      <div className={`w-1 shrink-0 ${cfg.bar}`} />
      <div className="flex-1 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.badge}`}
          >
            {SEVERITY_ICON[issue.severity]} {SEVERITY_LABELS[issue.severity]}
          </span>
          <span className="text-sm font-semibold text-[#1A1A1A]">{issue.name}</span>
        </div>
        <p className="text-sm text-[#4B5563] leading-relaxed mb-3">
          {issue.description}
        </p>
        <div className="bg-[#F8F9FA] rounded-lg p-3">
          <p className="text-xs font-medium text-[#9CA3AF] mb-1">整改建议</p>
          <p className="text-sm text-[#374151] leading-relaxed">{issue.suggestion}</p>
        </div>
      </div>
    </div>
  );
}
