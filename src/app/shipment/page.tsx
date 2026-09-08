"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, getUserProfile } from "@/lib/supabase";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface Shipment {
  id: string;
  booking_code: string;
  truck_plate: string;
  trailer_plate: string;
  container_no: string;
  pickup_date: string;
  shipment_desc: string;
  delivery_place: string;
  delivery_date: string;
  status_truck: number | null;
  status_shipment: number | null;
  is_overnight: boolean;
  is_postpone: boolean;
  is_cancel: boolean;
  remark_driver: string;
  remark_mail: string;
  notified_time: string;
  pre_alert_status: string;
  schedule_status: string;
  truck_detail_status: string;
  recheck_status: string;
}

export default function ShipmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);

  useEffect(() => {
    checkAuth();
    fetchShipments();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push("/login");
    await getUserProfile();
    setLoading(false);
  };

  const fetchShipments = async () => {
    const { data } = await supabase.from("shipments").select("*").order("created_at", { ascending: false });
    if (data) setShipments(data as Shipment[]);
  };

  const handleImport = async () => {
    if (!importText.trim()) return alert("กรุณาวางข้อมูล");
    
    const rows = importText.trim().split('\n');
    const dataToInsert = rows.map(row => {
      const cols = row.split('\t');
      return {
        booking_code: cols[0]?.trim() || "",
        truck_plate: cols[1]?.trim() || "",
        trailer_plate: cols[2]?.trim() || "",
        container_no: cols[3]?.trim() || "",
        pickup_date: cols[4]?.trim() || "",
        shipment_desc: cols[5]?.trim() || "",
        delivery_place: cols[6]?.trim() || "",
        delivery_date: cols[7]?.trim() || "",
        status_truck: cols[8] ? parseInt(cols[8]) : null,
        status_shipment: cols[9] ? parseInt(cols[9]) : null,
        is_overnight: !!cols[10],
        is_postpone: !!cols[11],
        is_cancel: !!cols[12],
        remark_driver: cols[13]?.trim() || "",
        remark_mail: cols[14]?.trim() || "",
        notified_time: cols[15]?.trim() || "",
        pre_alert_status: cols[16]?.trim() || "",
        schedule_status: cols[17]?.trim() || "",
        truck_detail_status: cols[18]?.trim() || "",
        recheck_status: cols[19]?.trim() || "",
      };
    });

    const { error } = await supabase.from("shipments").insert(dataToInsert);
    if (!error) {
      alert(`เพิ่ม ${dataToInsert.length} รายการ`);
      setIsImportOpen(false);
      setImportText("");
      fetchShipments();
    } else {
      alert("Error: " + error.message);
    }
  };

  const getShipmentStatusColor = (val: number | null) => {
    const colors = ["bg-gray-200", "bg-blue-500 text-white", "bg-yellow-400", "bg-purple-500 text-white", "bg-orange-500 text-white", "bg-pink-500 text-white", "bg-fuchsia-600 text-white"];
    return val !== null && val >= 0 && val <= 6 ? colors[val] : "";
  };

  const getValidationColor = (val: string) => {
    if (!val) return "";
    const v = val.toUpperCase();
    if (v.includes("FAIL") || v.includes("INCORRECT")) return "bg-red-500 text-white font-bold";
    if (v.includes("IN TIME") || v.includes("CORRECT") || v.includes("SCHEDULE")) return "bg-green-500 text-white font-bold";
    if (v.includes("UN SCHEDULE")) return "bg-yellow-400 font-bold";
    return "";
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Navigation */}
      <nav className="bg-[#0E1C59] shadow-lg sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-white font-bold text-2xl">COMMAND CENTER</span>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
                <a href="/dashboard" className="text-white/70 hover:text-white px-3 py-5 text-sm font-semibold uppercase">Dashboard</a>
                <a href="/trucks" className="text-white/70 hover:text-white px-3 py-5 text-sm font-semibold uppercase">Trucks</a>
                <a href="/shipment" className="text-white border-b-2 border-[#0067B1] px-3 py-5 text-sm font-semibold uppercase">Shipment</a>
                <a href="/web-links" className="text-white/70 hover:text-white px-3 py-5 text-sm font-semibold uppercase">Web Links</a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <button onClick={() => supabase.auth.signOut().then(() => router.push("/login"))} className="text-white/70 hover:text-white text-sm font-semibold uppercase px-3 py-2">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-6 px-4 max-w-[1920px] mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Daily Shipment</h1>
          <div className="flex gap-3">
            <button onClick={() => setIsImportOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">📥 Import Excel</button>
            <button onClick={() => setIsEditModalOpen(true)} className="bg-[#0E1C59] text-white px-4 py-2 rounded hover:bg-[#003366]">+ เพิ่มรายการ</button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border rounded-lg overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <table className="w-full text-sm">
            <thead className="bg-[#0E1C59] text-white sticky top-0">
              <tr>
                <th className="px-4 py-3 border-r w-16">NO.</th>
                <th className="px-4 py-3 border-r w-40">BOOKING CODE</th>
                <th className="px-3 py-3 border-r w-24">TRUCK</th>
                <th className="px-3 py-3 border-r w-24">TRAILER</th>
                <th className="px-3 py-3 border-r w-28">CONTAINER</th>
                <th className="px-3 py-3 border-r w-24">PICKUP DATE</th>
                <th className="px-4 py-3 border-r min-w-[300px]">SHIPMENT DESC</th>
                <th className="px-3 py-3 border-r w-40">DELIVERY PLACE</th>
                <th className="px-3 py-3 border-r w-24">DELIVERY DATE</th>
                <th className="px-3 py-3 border-r w-20 text-center">TRUCK STS</th>
                <th className="px-3 py-3 border-r w-24 text-center">SHIP STS</th>
                <th className="px-2 py-3 border-r w-12 text-center">ON</th>
                <th className="px-2 py-3 border-r w-12 text-center">POST</th>
                <th className="px-2 py-3 border-r w-12 text-center">CAN</th>
                <th className="px-3 py-3 border-r w-32">REMARK DRIVER</th>
                <th className="px-3 py-3 border-r w-32">REMARK MAIL</th>
                <th className="px-3 py-3 border-r w-28 text-center">PRE-ALERT</th>
                <th className="px-3 py-3 border-r w-28 text-center">SCHEDULE</th>
                <th className="px-3 py-3 border-r w-28 text-center">TRUCK DETAIL</th>
                <th className="px-3 py-3 w-24 text-center">RECHECK</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((row, idx) => (
                <tr key={row.id} className="hover:bg-blue-50 border-b">
                  <td className="px-4 py-2 border-r text-center">{idx + 1}</td>
                  <td className="px-4 py-2 border-r font-bold text-blue-900">{row.booking_code}</td>
                  <td className="px-3 py-2 border-r">{row.truck_plate}</td>
                  <td className="px-3 py-2 border-r">{row.trailer_plate}</td>
                  <td className="px-3 py-2 border-r text-xs">{row.container_no}</td>
                  <td className="px-3 py-2 border-r text-xs">{row.pickup_date}</td>
                  <td className="px-4 py-2 border-r text-xs truncate max-w-[300px]">{row.shipment_desc}</td>
                  <td className="px-3 py-2 border-r text-xs">{row.delivery_place}</td>
                  <td className="px-3 py-2 border-r text-xs">{row.delivery_date}</td>
                  <td className={`px-3 py-2 border-r text-xs text-center font-bold ${row.status_truck === 0 ? 'bg-orange-100' : 'bg-blue-100'}`}>
                    {row.status_truck === 0 ? 'OCC' : row.status_truck === 1 ? 'STD' : '-'}
                  </td>
                  <td className={`px-3 py-2 border-r text-xs text-center font-bold ${getShipmentStatusColor(row.status_shipment)}`}>
                    {row.status_shipment !== null ? ['ORI', 'BKH', 'SAD', 'SVK', 'MUK', 'DEP', 'END'][row.status_shipment] : '-'}
                  </td>
                  <td className="px-2 py-2 border-r text-center">{row.is_overnight ? '✅' : ''}</td>
                  <td className="px-2 py-2 border-r text-center">{row.is_postpone ? '✅' : ''}</td>
                  <td className="px-2 py-2 border-r text-center">{row.is_cancel ? '✅' : ''}</td>
                  <td className="px-3 py-2 border-r text-xs truncate">{row.remark_driver}</td>
                  <td className="px-3 py-2 border-r text-xs truncate">{row.remark_mail}</td>
                  <td className={`px-3 py-2 border-r text-xs text-center font-bold ${getValidationColor(row.pre_alert_status)}`}>{row.pre_alert_status}</td>
                  <td className={`px-3 py-2 border-r text-xs text-center font-bold ${getValidationColor(row.schedule_status)}`}>{row.schedule_status}</td>
                  <td className={`px-3 py-2 border-r text-xs text-center font-bold ${getValidationColor(row.truck_detail_status)}`}>{row.truck_detail_status}</td>
                  <td className={`px-3 py-2 text-xs text-center font-bold ${getValidationColor(row.recheck_status)}`}>{row.recheck_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-2">📥 นำเข้าข้อมูลจาก Excel</h3>
            <p className="text-sm text-gray-500 mb-4">Copy จาก Excel แล้ว Paste ที่นี่</p>
            <textarea 
              className="w-full h-64 border rounded p-4 font-mono text-sm mb-4" 
              placeholder="Ctrl+V วางข้อมูลที่นี่..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)} 
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsImportOpen(false)} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded">ยกเลิก</button>
              <button onClick={handleImport} className="px-6 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700">🚀 นำเข้าข้อมูล</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">เพิ่มรายการใหม่</h3>
            <div className="grid grid-cols-2 gap-4">
              <input className="border p-2 rounded" placeholder="Booking Code" onChange={(e) => setEditingShipment({...editingShipment, booking_code: e.target.value} as any)} />
              <input className="border p-2 rounded" placeholder="Truck Plate" onChange={(e) => setEditingShipment({...editingShipment, truck_plate: e.target.value} as any)} />
              {/* เพิ่ม fields อื่นๆ ตามต้องการ */}
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-600">Cancel</button>
              <button onClick={async () => {
                if (editingShipment?.booking_code) {
                  await supabase.from("shipments").insert([editingShipment]);
                  fetchShipments();
                  setIsEditModalOpen(false);
                }
              }} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}