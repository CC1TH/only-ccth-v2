"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, getUserProfile } from "@/lib/supabase";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface Truck {
  id: string;
  head_plate: string;
  trailer_plate: string | null;
  province_category: string | null;
  brand: string | null;
  model: string | null;
  driver1_name: string | null;
  driver1_phone: string | null;
  driver2_name: string | null;
  driver2_phone: string | null;
  company_name: string | null;
  gps_link: string | null;
  status: 'OK' | 'NG';
  updated_at: string;
}

interface CompanyStats {
  name: string;
  total: number;
  ok: number;
  ng: number;
}

export default function TrucksPage() {
  const router = useRouter();
  const { t } = useTranslation(); // ✅ ใช้ t() แทนข้อความตรงๆ
  const [loading, setLoading] = useState(true);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    head_plate: "", trailer_plate: "", province_category: "", brand: "", model: "",
    driver1_name: "", driver1_phone: "", driver2_name: "", driver2_phone: "",
    company_name: "", gps_link: "", status: "OK" as 'OK' | 'NG'
  });

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { checkAuth(); fetchTrucks(); }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push("/login");
    await getUserProfile();
    setLoading(false);
  };

  const fetchTrucks = async () => {
    const { data } = await supabase.from("trucks").select("*").order("updated_at", { ascending: false });
    if (data) setTrucks(data as Truck[]);
  };

  const handleEdit = (truck: Truck) => {
    setEditingId(truck.id);
    setForm({
      head_plate: truck.head_plate || "", trailer_plate: truck.trailer_plate || "", province_category: truck.province_category || "",
      brand: truck.brand || "", model: truck.model || "", driver1_name: truck.driver1_name || "", driver1_phone: truck.driver1_phone || "",
      driver2_name: truck.driver2_name || "", driver2_phone: truck.driver2_phone || "", company_name: truck.company_name || "",
      gps_link: truck.gps_link || "", status: truck.status
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.head_plate) return alert(t('trucks.alert_required'));
    setSaving(true);
    const payload = { ...form, updated_at: new Date().toISOString() };
    let error;
    if (editingId) ({ error } = await supabase.from("trucks").update(payload).eq("id", editingId));
    else ({ error } = await supabase.from("trucks").insert(payload));
    if (!error) { setIsModalOpen(false); fetchTrucks(); } else alert(t('trucks.alert_save_error') + ": " + error.message);
    setSaving(false);
  };

  const handleBulkImport = async () => {
    if (!importText.trim()) return alert("กรุณาวางข้อมูลจาก Excel ก่อนครับ");
    setImporting(true);
    const rows = importText.trim().split('\n');
    const trucksToInsert = rows.map(row => {
      const cols = row.split('\t');
      return {
        head_plate: cols[0]?.trim() || "", trailer_plate: cols[1]?.trim() || null, brand: cols[2]?.trim() || null,
        model: cols[3]?.trim() || null, company_name: cols[4]?.trim() || null, status: (cols[5]?.trim().toUpperCase() === 'NG') ? 'NG' : 'OK',
        gps_link: cols[6]?.trim() || null, updated_at: new Date().toISOString()
      };
    }).filter(t => t.head_plate);
    if (trucksToInsert.length === 0) return alert("ไม่พบข้อมูลรถที่ถูกต้อง");
    const platesToCheck = trucksToInsert.map(t => t.head_plate);
    const { data: existingData } = await supabase.from("trucks").select("head_plate").in("head_plate", platesToCheck);
    const existingPlates = new Set(existingData?.map(d => d.head_plate) || []);
    const uniqueTrucks = trucksToInsert.filter(t => !existingPlates.has(t.head_plate));
    const duplicateCount = trucksToInsert.length - uniqueTrucks.length;
    if (uniqueTrucks.length === 0) { alert(`️ ไม่มีการเพิ่มข้อมูลใหม่\nพบทะเบียนซ้ำทั้งหมด ${duplicateCount} คัน`); setImporting(false); return; }
    const { error } = await supabase.from("trucks").insert(uniqueTrucks);
    if (!error) { alert(`✅ นำเข้าสำเร็จ! เพิ่มรถใหม่ ${uniqueTrucks.length} คัน\n⚠️ ข้ามทะเบียนซ้ำ ${duplicateCount} คัน`); setIsImportOpen(false); setImportText(""); fetchTrucks(); } else alert("นำเข้าไม่สำเร็จ: " + error.message);
    setImporting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('trucks.alert_delete_confirm'))) return;
    const { error } = await supabase.from("trucks").delete().eq("id", id);
    if (!error) fetchTrucks();
  };

  const isSearching = searchTerm.trim().length > 0;
  const filteredTrucks = isSearching ? trucks.filter(t => t.head_plate.toLowerCase().includes(searchTerm.toLowerCase()) || (t.trailer_plate && t.trailer_plate.toLowerCase().includes(searchTerm.toLowerCase()))) : [];

  const globalStats = { total: trucks.length, ok: trucks.filter(t => t.status === 'OK').length, ng: trucks.filter(t => t.status === 'NG').length };

  const groupedByCompany: CompanyStats[] = (() => {
    const grouped: Record<string, Truck[]> = {};
    trucks.forEach(truck => { const company = truck.company_name || "ไม่มีบริษัท"; if (!grouped[company]) grouped[company] = []; grouped[company].push(truck); });
    return Object.entries(grouped).map(([name, tArr]) => ({ name, total: tArr.length, ok: tArr.filter(t => t.status === 'OK').length, ng: tArr.filter(t => t.status === 'NG').length })).sort((a, b) => b.total - a.total);
  })();

  const selectedCompanyStats = selectedCompany ? groupedByCompany.find(c => c.name === selectedCompany) : null;
  const selectedCompanyTrucks = selectedCompany ? trucks.filter(t => t.company_name === selectedCompany) : [];

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">{t('common.loading')}</div>;

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
                <a href="/trucks" className="text-white border-b-2 border-[#0067B1] px-3 py-5 text-sm font-semibold uppercase tracking-wider">Trucks</a>
                <a href="/map" className="text-white/70 hover:text-white border-b-2 border-transparent hover:border-[#0067B1] px-3 py-5 text-sm font-semibold uppercase tracking-wider transition-colors">Route Map</a>
                <a href="/web-links" className="text-white/70 hover:text-white border-b-2 border-transparent hover:border-[#0067B1] px-3 py-5 text-sm font-semibold uppercase tracking-wider transition-colors">Web Links</a>
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
        <div className="flex justify-between items-center mb-6">
          <div><h1 className="text-2xl font-bold text-[#1A1A2E]">{t('trucks.title')}</h1><p className="text-sm text-[#5C6370] mt-1">{t('trucks.subtitle')}</p></div>
          <div className="flex gap-3">
            <button onClick={() => setIsImportOpen(true)} className="bg-green-600 text-white px-5 py-2.5 rounded font-semibold uppercase tracking-wider hover:bg-green-700 transition shadow-sm flex items-center gap-2">📥 Import Excel</button>
            <button onClick={() => { setEditingId(null); setForm({ head_plate: "", trailer_plate: "", province_category: "", brand: "", model: "", driver1_name: "", driver1_phone: "", driver2_name: "", driver2_phone: "", company_name: "", gps_link: "", status: "OK" }); setIsModalOpen(true); }} className="bg-[#0E1C59] text-white px-5 py-2.5 rounded font-semibold uppercase tracking-wider hover:bg-[#003366] transition shadow-sm">{t('trucks.add_button')}</button>
          </div>
        </div>

        <div className="bg-white border border-[#E8ECF0] rounded-lg p-4 shadow-sm mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('trucks.search_label')}</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
            <input type="text" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067B1] focus:border-transparent outline-none text-lg" placeholder={t('trucks.search_placeholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {!isSearching && !selectedCompany && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E8ECF0] flex items-center justify-between"><div><p className="text-sm text-gray-500 font-medium uppercase tracking-wider">{t('trucks.stats_total')}</p><h2 className="text-3xl font-bold text-[#0E1C59]">{globalStats.total}</h2></div><div className="bg-[#0E1C59]/10 p-3 rounded-full text-[#0E1C59] text-xl">🚛</div></div>
            <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E8ECF0] flex items-center justify-between"><div><p className="text-sm text-gray-500 font-medium uppercase tracking-wider">{t('trucks.stats_ok')}</p><h2 className="text-3xl font-bold text-green-600">{globalStats.ok}</h2></div><div className="bg-green-100 p-3 rounded-full text-green-600 text-xl">✅</div></div>
            <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E8ECF0] flex items-center justify-between"><div><p className="text-sm text-gray-500 font-medium uppercase tracking-wider">{t('trucks.stats_ng')}</p><h2 className="text-3xl font-bold text-red-600">{globalStats.ng}</h2></div><div className="bg-red-100 p-3 rounded-full text-red-600 text-xl">🛠️</div></div>
          </div>
        )}

        {isSearching ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-[#E8ECF0]">
            <div className="p-4 border-b border-[#E8ECF0] flex justify-between items-center"><h3 className="font-semibold text-[#1A1A2E]">ผลการค้นหา ({filteredTrucks.length} รายการ)</h3><button onClick={() => setSearchTerm("")} className="text-sm text-[#0067B1] hover:underline">ล้างการค้นหา</button></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#F8FAFC] text-gray-600 text-sm"><tr><th className="p-4 font-medium">ทะเบียนรถ</th><th className="p-4 font-medium">บริษัท</th><th className="p-4 font-medium">ชื่อ GPS</th><th className="p-4 font-medium">ลิงก์ GPS</th><th className="p-4 font-medium text-right">จัดการ</th></tr></thead>
                <tbody>
                  {filteredTrucks.length > 0 ? filteredTrucks.map((truck) => (
                    <tr key={truck.id} className="border-b hover:bg-gray-50 transition">
                      <td className="p-4 font-bold text-lg text-[#1A1A2E]">{truck.head_plate}</td>
                      <td className="p-4 text-gray-600">{truck.company_name || '-'}</td>
                      <td className="p-4 text-gray-600">{truck.brand && truck.model ? `${truck.brand} ${truck.model}` : '-'}</td>
                      <td className="p-4">{truck.gps_link ? <a href={truck.gps_link} target="_blank" rel="noopener" className="text-[#0067B1] hover:underline flex items-center gap-1">🔗 Link</a> : <span className="text-gray-400">-</span>}</td>
                      <td className="p-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => handleEdit(truck)} className="p-2 text-gray-500 hover:text-[#0E1C59] transition" title={t('common.edit')}>✏️</button><button onClick={() => handleDelete(truck.id)} className="p-2 text-gray-500 hover:text-red-600 transition" title={t('common.delete')}>🗑️</button></div></td>
                    </tr>
                  )) : <tr><td colSpan={5} className="p-8 text-center text-gray-500">{t('trucks.no_data')}</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        ) : selectedCompany ? (
          <div>
            <button onClick={() => setSelectedCompany(null)} className="mb-4 text-[#0067B1] hover:text-[#0E1C59] font-medium flex items-center gap-2">← กลับไปหน้ารวมบริษัท</button>
            <div className="flex justify-between items-end mb-6"><div><h2 className="text-2xl font-bold text-[#1A1A2E]">{selectedCompany}</h2><p className="text-sm text-gray-500">ทั้งหมด {selectedCompanyStats?.total} คัน | OK: {selectedCompanyStats?.ok} | NG: {selectedCompanyStats?.ng}</p></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedCompanyTrucks.map(truck => (
                <div key={truck.id} className="bg-white border border-[#E8ECF0] rounded-lg p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3"><h3 className="text-xl font-bold text-[#1A1A2E]">{truck.head_plate}</h3><span className={`px-2 py-1 rounded text-xs font-semibold ${truck.status === 'OK' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{truck.status}</span></div>
                  <div className="space-y-2 text-sm text-gray-600">
                    {truck.trailer_plate && <div>ทะเบียนหาง: {truck.trailer_plate}</div>}
                    {truck.brand && <div>ยี่ห้อ: {truck.brand} {truck.model}</div>}
                    {truck.driver1_name && <div>คนขับ: {truck.driver1_name}</div>}
                    {truck.gps_link && <a href={truck.gps_link} target="_blank" rel="noopener" className="text-[#0067B1] hover:underline flex items-center gap-1">🔗 GPS Link</a>}
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <button onClick={() => handleEdit(truck)} className="flex-1 text-center py-2 text-sm font-medium text-[#0067B1] hover:bg-blue-50 rounded transition">{t('common.edit')}</button>
                    <button onClick={() => handleDelete(truck.id)} className="flex-1 text-center py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded transition">{t('common.delete')}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedByCompany.map(company => (
              <div key={company.name} onClick={() => setSelectedCompany(company.name)} className="bg-white border border-[#E8ECF0] rounded-lg p-6 shadow-sm hover:shadow-lg transition cursor-pointer group">
                <div className="flex justify-between items-start mb-4"><h3 className="text-xl font-bold text-[#1A1A2E] group-hover:text-[#0067B1] transition">{company.name}</h3><span className="bg-[#0E1C59] text-white px-3 py-1 rounded-full text-sm font-bold">{company.total}</span></div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-50 rounded-lg p-3 text-center"><div className="text-2xl font-bold text-green-600">{company.ok}</div><div className="text-xs text-gray-600">{t('trucks.stats_ok')}</div></div>
                  <div className="bg-red-50 rounded-lg p-3 text-center"><div className="text-2xl font-bold text-red-600">{company.ng}</div><div className="text-xs text-gray-600">{t('trucks.stats_ng')}</div></div>
                </div>
                <div className="text-sm text-gray-500 text-center group-hover:text-[#0067B1] transition">คลิกเพื่อดูรายละเอียด →</div>
              </div>
            ))}
          </div>
        )}

        {!isSearching && !selectedCompany && groupedByCompany.length === 0 && <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-[#E8ECF0]">{t('trucks.no_data')}</div>}
      </main>

      {isImportOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-2 text-[#1A1A2E]"> นำเข้าข้อมูลรถจาก Excel</h3>
            <p className="text-sm text-gray-500 mb-4">ระบบจะตรวจสอบและข้ามทะเบียนที่ซ้ำอัตโนมัติ<br/><span className="font-mono bg-gray-100 px-1 rounded text-xs block mt-2">[1.ทะเบียนหัว] | [2.ทะเบียนหาง] | [3.ยี่ห้อ] | [4.รุ่น] | [5.ชื่อบริษัท] | [6.สถานะ] | [7.Link GPS]</span></p>
            <textarea className="w-full h-64 border border-gray-300 rounded p-4 font-mono text-sm focus:ring-2 focus:ring-[#0E1C59] outline-none mb-4" placeholder="Paste ข้อมูลจาก Excel ที่นี่..." value={importText} onChange={(e) => setImportText(e.target.value)} />
            <div className="flex justify-end gap-3"><button onClick={() => setIsImportOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">{t('common.cancel')}</button><button onClick={handleBulkImport} disabled={importing || !importText} className="px-6 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700 disabled:opacity-50">{importing ? 'กำลังตรวจสอบและนำเข้า...' : ' นำเข้าข้อมูล'}</button></div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-2xl p-5 shadow-xl my-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-3 text-[#1A1A2E]">{editingId ? t('trucks.modal_edit_title') : t('trucks.modal_add_title')}</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('trucks.form_head_plate')} <span className="text-red-500">*</span></label><input required className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-[#0067B1] outline-none" value={form.head_plate} onChange={e => setForm({ ...form, head_plate: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('trucks.form_trailer_plate')}</label><input className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-[#0067B1] outline-none" value={form.trailer_plate} onChange={e => setForm({ ...form, trailer_plate: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('trucks.form_province')}</label><input className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-[#0067B1] outline-none" value={form.province_category} onChange={e => setForm({ ...form, province_category: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('trucks.form_brand')}</label><input className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-[#0067B1] outline-none" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('trucks.form_model')}</label><input className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-[#0067B1] outline-none" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} /></div>
              </div>
              <div className="border-t pt-3 mt-3"><h4 className="text-sm font-semibold text-[#0E1C59] mb-2">{t('trucks.form_driver1')}</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-gray-700 mb-1">{t('common.name')}</label><input className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-[#0067B1] outline-none" value={form.driver1_name} onChange={e => setForm({ ...form, driver1_name: e.target.value })} /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">{t('common.phone')}</label><input className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-[#0067B1] outline-none" value={form.driver1_phone} onChange={e => setForm({ ...form, driver1_phone: e.target.value })} /></div></div></div>
              <div className="border-t pt-3 mt-3"><h4 className="text-sm font-semibold text-[#0E1C59] mb-2">{t('trucks.form_driver2')}</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-gray-700 mb-1">{t('common.name')}</label><input className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-[#0067B1] outline-none" value={form.driver2_name} onChange={e => setForm({ ...form, driver2_name: e.target.value })} /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">{t('common.phone')}</label><input className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-[#0067B1] outline-none" value={form.driver2_phone} onChange={e => setForm({ ...form, driver2_phone: e.target.value })} /></div></div></div>
              <div className="border-t pt-3 mt-3"><h4 className="text-sm font-semibold text-[#0E1C59] mb-2">{t('trucks.modal_additional_info')}</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-gray-700 mb-1">{t('trucks.form_company')}</label><input className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-[#0067B1] outline-none" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Link GPS</label><input type="url" className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-[#0067B1] outline-none" value={form.gps_link} onChange={e => setForm({ ...form, gps_link: e.target.value })} /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">{t('trucks.form_status')}</label><select className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-[#0067B1] outline-none" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'OK' | 'NG' })}><option value="OK">{t('trucks.status_ok')}</option><option value="NG">{t('trucks.status_ng')}</option></select></div></div></div>
              <div className="flex justify-end gap-3 pt-3 border-t mt-3"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">{t('common.cancel')}</button><button type="submit" disabled={saving} className="px-4 py-2 bg-[#0E1C59] text-white rounded font-semibold hover:bg-[#003366] disabled:opacity-50">{saving ? t('trucks.saving') : t('trucks.btn_save')}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}