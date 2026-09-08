"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, getUserProfile } from "@/lib/supabase";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface WebLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  icon?: string;
  updated_at: string;
}

export default function WebLinksPage() {
  const router = useRouter();
  const { t } = useTranslation(); // ✅ ใช้ t() แทนข้อความตรงๆ
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<WebLink[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", url: "", description: "", icon: "🔗" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { checkAuth(); fetchLinks(); }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push("/login");
    await getUserProfile();
    setLoading(false);
  };

  const fetchLinks = async () => {
    const { data } = await supabase.from("web_links").select("*").order("updated_at", { ascending: false });
    if (data) setLinks(data as WebLink[]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.url) return alert("กรุณากรอกข้อมูลให้ครบ");
    setSaving(true);
    let error;
    if (editingId) ({ error } = await supabase.from("web_links").update({ title: form.title, url: form.url, description: form.description, icon: form.icon }).eq("id", editingId));
    else ({ error } = await supabase.from("web_links").insert({ title: form.title, url: form.url, description: form.description, icon: form.icon }));
    if (!error) { setIsModalOpen(false); fetchLinks(); } else alert("บันทึกไม่สำเร็จ: " + error.message);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ยืนยันการลบลิงก์นี้?")) return;
    const { error } = await supabase.from("web_links").delete().eq("id", id);
    if (!error) fetchLinks();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">{t('common.loading')}...</div>;

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* ✅ Navigation Bar ที่แก้ไขแล้ว (เพิ่ม Route Map และใช้ t()) */}
      <nav className="bg-[#0E1C59] shadow-lg sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-white font-bold text-2xl tracking-tight">COMMAND CENTER</span>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
                <a href="/dashboard" className="text-white/70 hover:text-white border-b-2 border-transparent hover:border-[#0067B1] px-3 py-5 text-sm font-semibold uppercase tracking-wider transition-colors">Dashboard</a>
                <a href="/trucks" className="text-white/70 hover:text-white border-b-2 border-transparent hover:border-[#0067B1] px-3 py-5 text-sm font-semibold uppercase tracking-wider transition-colors">Trucks</a>
                <a href="/map" className="text-white/70 hover:text-white border-b-2 border-transparent hover:border-[#0067B1] px-3 py-5 text-sm font-semibold uppercase tracking-wider transition-colors">Route Map</a>
                <a href="/web-links" className="text-white border-b-2 border-[#0067B1] px-3 py-5 text-sm font-semibold uppercase tracking-wider">Web Links</a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <button onClick={() => supabase.auth.signOut().then(() => router.push("/login"))} className="text-white/70 hover:text-white text-sm font-semibold uppercase px-3 py-2">{t('common.logout')}</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-[#1A1A2E]">{t('webLinks.title')}</h1>
          <button onClick={() => { setEditingId(null); setForm({ title: "", url: "", description: "", icon: "" }); setIsModalOpen(true); }} className="bg-[#0E1C59] text-white px-6 py-3 rounded-lg font-semibold uppercase tracking-wider hover:bg-[#003366] transition shadow-sm">
            {t('common.add')} Link
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {links.map((link) => (
            <div key={link.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all group relative">
              <button onClick={() => handleDelete(link.id)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100" title={t('common.delete')}>🗑️</button>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-2xl mb-4 shadow-sm">{link.icon || "🔗"}</div>
              <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">{link.title}</h3>
              {link.description && <p className="text-gray-600 text-sm mb-4 line-clamp-2">{link.description}</p>}
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[#0067B1] font-medium hover:underline text-sm">{t('common.name')} →</a>
            </div>
          ))}
        </div>

        {links.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('trucks.no_data')}</h3>
            <p className="text-gray-500 mb-6">{t('webLinks.title')} {t('common.add')}</p>
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-4 text-[#1A1A2E]">{editingId ? t('common.edit') : t('common.add') + ' New Link'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('trucks.form_head_plate')} *</label><input required className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0067B1] outline-none" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="ชื่อลิงก์" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">URL *</label><input required type="url" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0067B1] outline-none" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://..." /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('trucks.form_description')}</label><textarea className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0067B1] outline-none resize-none" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="คำอธิบาย (ถ้ามี)" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Icon</label><input className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0067B1] outline-none" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="" /></div>
              <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">{t('common.cancel')}</button><button type="submit" disabled={saving} className="px-6 py-2 bg-[#0E1C59] text-white rounded-lg font-semibold hover:bg-[#003366] disabled:opacity-50">{saving ? t('trucks.saving') : t('trucks.btn_save')}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}