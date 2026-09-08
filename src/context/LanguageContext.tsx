"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// กำหนดประเภทภาษาที่มีได้
export type Language = "th" | "en";

// กำหนดรูปร่างของสิ่งที่ Context จะส่งออกไป
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

// สร้าง Context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Provider คือตัวจัดการ
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("th");

  // ตอนเปิดเว็บครั้งแรก ให้โหลดภาษาที่ผู้ใช้เลือกครั้งล่าสุดมาใช้
  useEffect(() => {
    const savedLang = localStorage.getItem("command_center_lang") as Language;
    if (savedLang) {
      setLanguageState(savedLang);
    }
  }, []);

  // ฟังก์ชันเปลี่ยนภาษา
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("command_center_lang", lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook สำหรับเรียกใช้ในหน้าอื่นๆ
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage ต้องถูกใช้ภายใต้ LanguageProvider");
  }
  return context;
}