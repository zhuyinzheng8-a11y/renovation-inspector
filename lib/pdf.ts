import type { Inspection, InspectionResult, IssueSeverity } from "@/types";
import { STAGE_LABELS, STAGE_ICONS, SEVERITY_LABELS } from "@/types";

const SEVERITY_COLORS: Record<IssueSeverity, string> = {
  rework: "#EF4444",
  fix: "#F59E0B",
  minor: "#22C55E",
};

const SEVERITY_BG: Record<IssueSeverity, string> = {
  rework: "#FEF2F2",
  fix: "#FFFBEB",
  minor: "#F0FDF4",
};

function buildReportHTML(inspection: Inspection, result: InspectionResult): string {
  const issueCount = result.issues.length;
  const reworkCount = result.issues.filter((i) => i.severity === "rework").length;
  const fixCount = result.issues.filter((i) => i.severity === "fix").length;
  const minorCount = result.issues.filter((i) => i.severity === "minor").length;

  const photosHTML = result.photos && result.photos.length > 0
    ? `
      <h2 style="font-size:16px;font-weight:700;color:#1A1A1A;margin:24px 0 12px;">现场照片</h2>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${result.photos.map((p) => `<img src="data:image/jpeg;base64,${p}" style="width:120px;height:120px;object-fit:cover;border-radius:6px;border:1px solid #EBEBEB;" />`).join("")}
      </div>`
    : "";

  const issuesHTML = result.issues.length > 0
    ? `
      <h2 style="font-size:16px;font-weight:700;color:#1A1A1A;margin:24px 0 12px;">问题详情</h2>
      ${result.issues.map((issue, idx) => {
        const color = SEVERITY_COLORS[issue.severity];
        const bg = SEVERITY_BG[issue.severity];
        return `
        <div style="background:${bg};border-radius:6px;padding:12px 14px;margin-bottom:10px;border-left:4px solid ${color};">
          <div style="font-size:13px;font-weight:700;color:${color};margin-bottom:4px;">
            ${idx + 1}. [${SEVERITY_LABELS[issue.severity]}] ${escapeHTML(issue.name)}
          </div>
          <div style="font-size:12px;color:#374151;margin-bottom:6px;line-height:1.5;">${escapeHTML(issue.description)}</div>
          <div style="font-size:11px;color:#9CA3AF;">整改建议：<span style="color:#374151;">${escapeHTML(issue.suggestion)}</span></div>
        </div>`;
      }).join("")}`
    : `<div style="font-size:15px;color:#22C55E;font-weight:600;margin:16px 0;">✓ 未发现明显质量问题</div>`;

  const reworkBadge = reworkCount > 0 ? `<span style="font-size:11px;background:#FEF2F2;color:#EF4444;padding:2px 8px;border-radius:10px;font-weight:500;">${reworkCount} 必须返工</span>` : "";
  const fixBadge = fixCount > 0 ? `<span style="font-size:11px;background:#FFFBEB;color:#D97706;padding:2px 8px;border-radius:10px;font-weight:500;">${fixCount} 需整改</span>` : "";
  const minorBadge = minorCount > 0 ? `<span style="font-size:11px;background:#F0FDF4;color:#16A34A;padding:2px 8px;border-radius:10px;font-weight:500;">${minorCount} 轻微</span>` : "";

  const selfCheckHTML = result.selfCheckItems.length > 0
    ? `
      <h2 style="font-size:16px;font-weight:700;color:#1A1A1A;margin:24px 0 8px;">现场自测项目</h2>
      <p style="font-size:12px;color:#9CA3AF;margin-bottom:8px;">以下项目需要您现场操作检验，照片无法判断</p>
      ${result.selfCheckItems.map((item, idx) => `
        <div style="background:#F8F9FA;border-radius:4px;padding:8px 10px;margin-bottom:6px;">
          <div style="font-size:12px;font-weight:600;color:#1A1A1A;">${idx + 1}. ${escapeHTML(item.name)}</div>
          <div style="font-size:11px;color:#9CA3AF;margin-top:2px;">${escapeHTML(item.method)}</div>
        </div>`).join("")}`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
body{font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;padding:20px;margin:0;color:#1A1A1A;font-size:14px;line-height:1.6;background:#fff;}
</style>
</head>
<body>
  <h1 style="font-size:22px;font-weight:700;margin:0 0 4px;">装修验收报告</h1>
  <hr style="border:none;border-top:1px solid #EBEBEB;margin:0 0 16px;" />

  <table style="font-size:13px;border-collapse:collapse;">
    <tr><td style="color:#9CA3AF;padding-right:20px;padding-bottom:4px;">验收阶段</td><td style="font-weight:500;">${STAGE_ICONS[inspection.stage]} ${STAGE_LABELS[inspection.stage]}</td></tr>
    ${inspection.room ? `<tr><td style="color:#9CA3AF;padding-right:20px;padding-bottom:4px;">房间</td><td style="font-weight:500;">${escapeHTML(inspection.room)}</td></tr>` : ""}
    <tr><td style="color:#9CA3AF;padding-right:20px;padding-bottom:4px;">验收日期</td><td style="font-weight:500;">${inspection.date}</td></tr>
    <tr><td style="color:#9CA3AF;padding-right:20px;padding-bottom:4px;">照片数量</td><td style="font-weight:500;">${inspection.photosCount} 张</td></tr>
  </table>

  <hr style="border:none;border-top:1px solid #EBEBEB;margin:16px 0;" />

  <div style="margin-bottom:8px;">
    <span style="font-size:15px;font-weight:600;">共发现 ${issueCount} 个问题</span>
    <div style="display:flex;gap:6px;margin-top:4px;">${reworkBadge}${fixBadge}${minorBadge}</div>
  </div>

  ${photosHTML}
  ${issuesHTML}
  ${selfCheckHTML}

  <hr style="border:none;border-top:1px solid #EBEBEB;margin:24px 0 8px;" />
  <div style="font-size:10px;color:#C4C9D4;text-align:center;">
    本报告由「装修验收助手」生成 · 数据仅存储在本设备<br/>
    生成时间：${new Date().toLocaleString("zh-CN")}
  </div>
</body>
</html>`;
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function exportToPDF(
  inspection: Inspection,
  result: InspectionResult
): Promise<void> {
  const [module, html2canvas] = await Promise.all([
    import("jspdf"),
    import("html2canvas").then((m) => m.default),
  ]);
  const { jsPDF } = module;

  const html = buildReportHTML(inspection, result);

  // Create off-screen container for html2canvas rendering
  const container = document.createElement("div");
  container.innerHTML = html;
  container.style.width = "800px";
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.zIndex = "-1";
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageW = 210;
    const pageH = 297;
    const margin = 15;
    const contentW = pageW - margin * 2;
    const contentH = pageH - margin * 2;

    const imgW = contentW;
    const imgH = (canvas.height * imgW) / canvas.width;
    const totalPages = Math.ceil(imgH / contentH);

    for (let i = 0; i < totalPages; i++) {
      if (i > 0) doc.addPage();
      doc.addImage(imgData, "PNG", margin, margin - i * contentH, imgW, imgH);
    }

    const filename = `验收报告_${STAGE_LABELS[inspection.stage]}${inspection.room ? "_" + inspection.room : ""}_${inspection.date}.pdf`;
    doc.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}
