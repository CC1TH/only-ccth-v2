import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext"; // ✅ ต้อง import มา

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Command Center",
  description: "Logistics Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={inter.className}>
        {/* ✅ ห่อหุ้มทั้งแอปด้วย Provider เพื่อให้ทุกหน้าเปลี่ยนภาษาได้ */}
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}