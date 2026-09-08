"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function LanguageSwitcher() {
  // ใช้ setLanguage จาก Context
  const { language, setLanguage } = useLanguage();

  return (
    <div className="relative inline-block">
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as "th" | "en")}
        className="bg-[#0E1C59] text-white border border-white/20 rounded px-3 py-1.5 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all hover:bg-[#1A365D]"
      >
        <option value="th" className="bg-[#0E1C59]">🇹 ไทย</option>
        <option value="en" className="bg-[#0E1C59]">🇺🇸 English</option>
      </select>
    </div>
  );
}