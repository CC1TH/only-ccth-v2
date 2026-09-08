"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function MapPage() {
  const router = useRouter();
  const { t } = useTranslation(); // ✅ ดึงฟังก์ชันแปลภาษา
  
  // สถานะสำหรับเลือกแผนที่ (ค่าเริ่มต้นเป็น Long Route)
  const [selectedMap, setSelectedMap] = useState("longRoute");

  // 🔑 ใส่ Map ID ของคุณทั้ง 4 แบบตรงนี้
  // (นำ ID ที่ได้จาก URL ของ Google My Maps มาใส่)
  const MAPS = {
    longRoute: "1E4RHGSr7m5-6ZX68Pt-7474VVEmGW9o", // 1. Long Route (ใช้ ID จากภาพของคุณ)
    mukdahan: "1uJgbM6f1_LeVUvB15i3XDTrmqQVJVK8",          // 2. Mukdahan Route (รอใส่ ID)
    sadao: "1c-VBLIsfz8HxpBzT6k1UFXA8VE_pzPc",                // 3. Sadao Route (รอใส่ ID)
    floodBypass: "1JhCmS9uv9Yx5zIl8C7kIgqi_joSS8F8",          // 4. Flood bypass route (รอใส่ ID)
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col">
      {/* Navigation Bar (เหมือนกับหน้าอื่น ๆ ทุกประการ) */}
      <nav className="bg-[#0E1C59] shadow-lg sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-white font-bold text-2xl tracking-tight">COMMAND CENTER</span>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
                <a href="/dashboard" className="text-white/70 hover:text-white border-b-2 border-transparent hover:border-[#0067B1] px-3 py-5 text-sm font-semibold uppercase tracking-wider transition-colors">
                  {t('dashboard.title')} {/* แสดงคำว่า แดชบอร์ด/Dashboard ตามภาษา */}
                </a>
                <a href="/trucks" className="text-white/70 hover:text-white border-b-2 border-transparent hover:border-[#0067B1] px-3 py-5 text-sm font-semibold uppercase tracking-wider transition-colors">
                  {t('trucks.title')} {/* แสดงคำว่า จัดการรถบรรทุก/Fleet Management ตามภาษา */}
                </a>
                {/* ✅ เมนู Route Map จะActive (ขีดเส้นใต้) */}
                <a href="/map" className="text-white border-b-2 border-[#0067B1] px-3 py-5 text-sm font-semibold uppercase tracking-wider">
                  {t('map.menu')} 
                </a>
                <a href="/web-links" className="text-white/70 hover:text-white border-b-2 border-transparent hover:border-[#0067B1] px-3 py-5 text-sm font-semibold uppercase tracking-wider transition-colors">
                  Web Links
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <div className="text-right hidden sm:block">
                <p className="text-white text-sm font-semibold">User</p>
                <p className="text-white/60 text-xs uppercase">USER</p>
              </div>
              <button onClick={() => supabase.auth.signOut().then(() => router.push("/login"))} className="text-white/70 hover:text-white text-sm font-semibold uppercase px-3 py-2">
                {t('common.logout')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ส่วนควบคุมเลือกแผนที่ */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
              {t('map.title')}: 
            </label>
            
            {/* Dropdown เลือกแผนที่ */}
            <select 
              value={selectedMap}
              onChange={(e) => setSelectedMap(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#0067B1] outline-none bg-white w-full sm:w-auto"
            >
              {/* ตัวเลือกจะเปลี่ยนภาษาตามการตั้งค่า */}
              <option value="longRoute">{t('map.longRoute')}</option>
              <option value="mukdahan">{t('map.mukdahan')}</option>
              <option value="sadao">{t('map.sadao')}</option>
              <option value="floodBypass">{t('map.floodBypass')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* พื้นที่แสดงแผนที่ */}
      <main className="flex-1 relative bg-gray-100 p-4">
        <div className="w-full h-full rounded-xl overflow-hidden shadow-lg border border-gray-300 relative bg-white min-h-[600px]">
          
          {/* แสดง Loading ขณะโหลดแผนที่ */}
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="bg-white px-4 py-2 rounded shadow text-sm font-semibold animate-pulse text-gray-500">
              {t('map.loading')}
            </div>
          </div>

          {/* ✅ Google Maps Embed */}
          <iframe 
            src={`https://www.google.com/maps/d/embed?mid=${MAPS[selectedMap as keyof typeof MAPS]}&ehbc=2E312F`}
            width="100%" 
            height="100%" 
            style={{ border: 0, minHeight: "600px" }} 
            allowFullScreen 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0"
          ></iframe>
        </div>
      </main>
    </div>
  );
}