import { useLanguage } from "@/context/LanguageContext";
import th from "@/locales/th.json";
import en from "@/locales/en.json";

// ฟังก์ชันช่วยหาข้อความลึกๆ ใน JSON
const getNestedValue = (obj: any, path: string): string => {
  return path.split('.').reduce((prev, curr) => prev?.[curr] ?? null, obj) ?? path;
};

export function useTranslation() {
  const { language } = useLanguage(); // ดึงภาษาปัจจุบันจาก Context
  
  // เลือกพจนานุกรมตามภาษา
  const dictionary = language === "th" ? th : en;

  // ฟังก์ชัน t() สำหรับเรียกใช้ข้อความ
  const t = (key: string) => {
    return getNestedValue(dictionary, key);
  };

  return { t, language };
}