import type { Metadata, Viewport } from "next";
import { Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { InspectionProvider } from "@/context/inspection";

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-noto",
});

export const metadata: Metadata = {
  title: "装修验收助手",
  description: "拍照上传，AI 识别施工质量问题，生成专业验收报告",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#4F7FFF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={`${notoSansSC.variable} antialiased`}>
      <body className="min-h-screen bg-[#F5F5F5]">
        <InspectionProvider>{children}</InspectionProvider>
      </body>
    </html>
  );
}
