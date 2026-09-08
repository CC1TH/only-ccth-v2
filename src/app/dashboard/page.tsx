"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, getUserProfile } from "@/lib/supabase";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { RotateCw } from "lucide-react";

interface KPIData {
  success: boolean;
  kpi: {
    totalShipment: number;
    importCount: number;
    exportCount: number;
    totalOVN: number;
    ovnImpETL: number;
    ovnImpSup: number;
    ovnExpETL: number;
    ovnExpSup: number;
    postponeCount: number;
    cancelCount: number;
    inTimeCount: number;
    failCount: number;
    naCount: number;
    scheduleCount: number;
    unScheduleCount: number;
    correctCount: number;
    incorrectCount: number;
  };
  charts: {
    monthly: { labels: string[]; data: number[] };
    weekly: { labels: string[]; data: number[] };
    country: { labels: string[]; data: number[] };
    tripType: { labels: string[]; data: number[] };
    intime: { labels: string[]; data: number[] };
    schedule: { labels: string[]; data: number[] };
    correct: { labels: string[]; data: number[] };
  };
  filterOptions: {
    years: number[];
    months: number[];
  };
}

const COLORS = ["#0095f6", "#2ecc71", "#fcb045", "#ed4956", "#833ab4", "#c13584"];
const IG_COLORS = ["#833ab4", "#c13584", "#e1306c", "#fd1d1d", "#f56040", "#f77737", "#fcb045", "#ffdc80"];

export default function DashboardPage() {
  const router = useRouter();
  const { t, language } = useTranslation(); // ✅ ดึงฟังก์ชัน t() และภาษาปัจจุบัน
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [year, setYear] = useState("all");
  const [month, setMonth] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    checkUser();
    fetchKPI();
    const interval = setInterval(fetchKPI, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [year, month]); // ✅ เมื่อปี/เดือนเปลี่ยน จะโหลดข้อมูลใหม่

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push("/login");
    const userProfile = await getUserProfile();
    setProfile(userProfile);
    setLoading(false);
  };

  const fetchKPI = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch(`/api/kpi?year=${year}&month=${month}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (data.success) {
        setKpiData(data);
        setLastUpdate(new Date());
      } else {
        setError("Data format invalid");
      }
    } catch (err: any) {
      setError(err.message || "Connection failed");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setYear("all");
    setMonth("all");
  };

  const KPICard = ({ title, value, color }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between hover:shadow-md transition relative overflow-hidden">
      <div className="h-1 w-full rounded-full mb-3" style={{ backgroundColor: color }}></div>
      <div className="text-center relative z-10">
        <p className="text-3xl font-bold text-gray-800">{value?.toLocaleString() || 0}</p>
        {/* ใช้ dangerouslySetInnerHTML เพื่อรองรับ <br> ใน JSON */}
        <p className="text-xs text-gray-500 mt-1 leading-tight" dangerouslySetInnerHTML={{ __html: title }} />
      </div>
    </div>
  );

  // ✅ หน้าจอ Error
  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F7FA]">
        <nav className="bg-[#0E1C59] shadow-lg sticky top-0 z-50">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="text-white font-bold text-2xl tracking-tight">COMMAND CENTER</span>
                <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
                  <a href="/dashboard" className="text-white border-b-2 border-[#0067B1] px-3 py-5 text-sm font-semibold uppercase tracking-wider">Dashboard</a>
                  <a href="/trucks" className="text-white/70 hover:text-white border-b-2 border-transparent hover:border-[#0067B1] px-3 py-5 text-sm font-semibold uppercase tracking-wider">Trucks</a>
                  <a href="/map" className="text-white/70 hover:text-white border-b-2 border-transparent hover:border-[#0067B1] px-3 py-5 text-sm font-semibold uppercase tracking-wider">Route Map</a>
                  <a href="/web-links" className="text-white/70 hover:text-white border-b-2 border-transparent hover:border-[#0067B1] px-3 py-5 text-sm font-semibold uppercase tracking-wider">Web Links</a>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <LanguageSwitcher />
                <button onClick={() => supabase.auth.signOut().then(() => router.push("/login"))} className="text-white/70 hover:text-white text-sm font-semibold uppercase px-3 py-2">{t('common.logout')}</button>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex items-center justify-center p-4" style={{ minHeight: "calc(100vh - 64px)" }}>
          <div className="bg-red-50 border border-red-200 p-8 rounded-xl max-w-2xl w-full text-center shadow-lg">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-600 mb-3">{t('trucks.alert_save_error')}</h2>
            <div className="bg-white p-4 rounded-lg border border-red-100 mb-6">
              <p className="text-gray-700 font-mono text-sm break-all whitespace-pre-wrap">{error}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={fetchKPI} className="bg-[#0E1C59] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#003366] transition flex items-center gap-2">
                <RotateCw size={18} className={refreshing ? "animate-spin" : ""} />
                {t('dashboard.apply')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ หน้าจอ Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0E1C59] mx-auto mb-4"></div>
          <p className="text-gray-500">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Navigation */}
      <nav className="bg-[#0E1C59] shadow-lg sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-white font-bold text-2xl tracking-tight">COMMAND CENTER</span>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
                <a href="/dashboard" className="text-white border-b-2 border-[#0067B1] px-3 py-5 text-sm font-semibold uppercase tracking-wider">Dashboard</a>
                <a href="/trucks" className="text-white/70 hover:text-white border-b-2 border-transparent hover:border-[#0067B1] px-3 py-5 text-sm font-semibold uppercase tracking-wider">Trucks</a>
                <a href="/map" className="text-white/70 hover:text-white border-b-2 border-transparent hover:border-[#0067B1] px-3 py-5 text-sm font-semibold uppercase tracking-wider">Route Map</a>
                <a href="/web-links" className="text-white/70 hover:text-white border-b-2 border-transparent hover:border-[#0067B1] px-3 py-5 text-sm font-semibold uppercase tracking-wider">Web Links</a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <div className="text-right hidden sm:block">
                <p className="text-white text-sm font-semibold">{profile?.full_name || "User"}</p>
                <p className="text-white/60 text-xs uppercase">{profile?.role === "admin" ? t('common.admin') : t('common.user')}</p>
              </div>
              <button onClick={() => supabase.auth.signOut().then(() => router.push("/login"))} className="text-white/70 hover:text-white text-sm font-semibold uppercase px-3 py-2">{t('common.logout')}</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex max-w-[1440px] mx-auto">
        {/* Sidebar Filter */}
        <aside className="w-52 p-5 bg-white border-r border-gray-200 min-h-[calc(100vh-64px)] sticky top-16">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">{t('dashboard.filter')}</div>
          
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('dashboard.year')}</label>
            <select 
              value={year} 
              onChange={(e) => setYear(e.target.value)} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-[#0067B1] outline-none"
            >
              <option value="all">{t('dashboard.all')}</option>
              {kpiData?.filterOptions.years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('dashboard.month')}</label>
            <select 
              value={month} 
              onChange={(e) => setMonth(e.target.value)} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-[#0067B1] outline-none"
            >
              <option value="all">{t('dashboard.all')}</option>
              {/* สามารถแปลชื่อเดือนได้ถ้าต้องการ แต่暫時ใช้เลขหรือตัวย่อภาษาอังกฤษ */}
              {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
                <option key={i+1} value={i+1}>{m}</option>
              ))}
            </select>
          </div>

          <button onClick={fetchKPI} className="w-full bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition mb-2">
            {t('dashboard.apply')}
          </button>
          <button onClick={resetFilters} className="w-full border border-gray-300 text-gray-600 px-4 py-2.5 rounded-lg text-sm hover:border-red-500 hover:text-red-500 transition">
            {t('dashboard.reset')}
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {!kpiData ? (
            <div className="text-center py-20 text-gray-400">{t('common.loading')} KPI...</div>
          ) : (
            <>
              <h2 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">Shipment Information</h2>
              <div className="grid grid-cols-5 gap-3 mb-6">
                <KPICard title={t('dashboard.totalShipment')} value={kpiData.kpi.totalShipment} color="#0095f6" />
                <KPICard title={t('dashboard.import')} value={kpiData.kpi.importCount} color="#2ecc71" />
                <KPICard title={t('dashboard.export')} value={kpiData.kpi.exportCount} color="#fcb045" />
                <KPICard title={t('dashboard.cancel')} value={kpiData.kpi.cancelCount} color="#ed4956" />
                <KPICard title={t('dashboard.postpone')} value={kpiData.kpi.postponeCount} color="#f5a623" />
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold text-gray-700 mb-1">{t('dashboard.totalOvernight')}</h3>
                  <KPICard title={t('dashboard.totalOvernight')} value={kpiData.kpi.totalOVN} color="#833ab4" />
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold text-gray-700 mb-1">{t('dashboard.overnightImport')}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <KPICard title={t('dashboard.ovnTruckETL')} value={kpiData.kpi.ovnImpETL} color="#fd1d1d" />
                    <KPICard title={t('dashboard.ovnTruckSup')} value={kpiData.kpi.ovnImpSup} color="#fcb045" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold text-gray-700 mb-1">{t('dashboard.overnightExport')}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <KPICard title={t('dashboard.ovnTruckETL')} value={kpiData.kpi.ovnExpETL} color="#fd1d1d" />
                    <KPICard title={t('dashboard.ovnTruckSup')} value={kpiData.kpi.ovnExpSup} color="#fcb045" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold text-gray-700 mb-1">{t('dashboard.activateTrip')}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <KPICard title={t('dashboard.inTime')} value={kpiData.kpi.inTimeCount} color="#2ecc71" />
                    <KPICard title={t('dashboard.fail')} value={kpiData.kpi.failCount} color="#ed4956" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold text-gray-700 mb-1">{t('dashboard.scheduleStop')}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <KPICard title={t('dashboard.schedule')} value={kpiData.kpi.scheduleCount} color="#833ab4" />
                    <KPICard title={t('dashboard.unSchedule')} value={kpiData.kpi.unScheduleCount} color="#c13584" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold text-gray-700 mb-1">{t('dashboard.truckDetail')}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <KPICard title={t('dashboard.correct')} value={kpiData.kpi.correctCount} color="#2ecc71" />
                    <KPICard title={t('dashboard.incorrect')} value={kpiData.kpi.incorrectCount} color="#ed4956" />
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="col-span-2 bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-800">{t('dashboard.monthlyVolume')}</h3>
                      <p className="text-xs text-gray-500">{t('dashboard.monthlyVolumeSub')}</p>
                    </div>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                      {kpiData.charts.monthly.labels.length} {t('dashboard.months')}
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={kpiData.charts.monthly.labels.map((label, i) => ({
                      name: label,
                      value: kpiData.charts.monthly.data[i]
                    }))}>
                      <XAxis dataKey="name" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {kpiData.charts.monthly.labels.map((_, i) => (
                          <Cell key={i} fill={IG_COLORS[i % IG_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-1">{t('dashboard.byCountry')}</h3>
                  <p className="text-xs text-gray-500 mb-4">{t('dashboard.byCountrySub')}</p>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie 
                        data={kpiData.charts.country.labels.map((label, i) => ({
                          name: label,
                          value: kpiData.charts.country.data[i]
                        }))}
                        cx="50%" cy="50%" 
                        innerRadius={60} outerRadius={80} 
                        paddingAngle={5} dataKey="value"
                      >
                        {kpiData.charts.country.labels.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-1">{t('dashboard.weeklyTrend')}</h3>
                  <p className="text-xs text-gray-500 mb-4">{t('dashboard.weeklyTrendSub')}</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={kpiData.charts.weekly.labels.map((label, i) => ({
                      name: label,
                      value: kpiData.charts.weekly.data[i]
                    }))}>
                      <XAxis dataKey="name" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#0095f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-1">{t('dashboard.activateTrip')}</h3>
                  <p className="text-xs text-gray-500 mb-4">In time / Fail / N/A</p>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie 
                        data={[
                          { name: "IN TIME", value: kpiData.kpi.inTimeCount },
                          { name: "FAIL", value: kpiData.kpi.failCount },
                          { name: "N/A", value: kpiData.kpi.naCount }
                        ].filter(d => d.value > 0)}
                        cx="50%" cy="50%" 
                        innerRadius={50} outerRadius={70} 
                        paddingAngle={5} dataKey="value"
                      >
                        <Cell fill="#2ecc71" />
                        <Cell fill="#ed4956" />
                        <Cell fill="#c7c7c7" />
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-1">{t('dashboard.scheduleStop')}</h3>
                  <p className="text-xs text-gray-500 mb-4">{t('dashboard.scheduleStopSub')}</p>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie 
                        data={[
                          { name: "SCHEDULE", value: kpiData.kpi.scheduleCount },
                          { name: "UN SCHEDULE", value: kpiData.kpi.unScheduleCount }
                        ].filter(d => d.value > 0)}
                        cx="50%" cy="50%" 
                        innerRadius={50} outerRadius={70} 
                        paddingAngle={5} dataKey="value"
                      >
                        <Cell fill="#833ab4" />
                        <Cell fill="#c13584" />
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-1">{t('dashboard.truckDetail')}</h3>
                  <p className="text-xs text-gray-500 mb-4">{t('dashboard.truckDetailSub')}</p>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie 
                        data={[
                          { name: "CORRECT", value: kpiData.kpi.correctCount },
                          { name: "INCORRECT", value: kpiData.kpi.incorrectCount }
                        ].filter(d => d.value > 0)}
                        cx="50%" cy="50%" 
                        innerRadius={50} outerRadius={70} 
                        paddingAngle={5} dataKey="value"
                      >
                        <Cell fill="#2ecc71" />
                        <Cell fill="#ed4956" />
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-1">{t('dashboard.tripType')}</h3>
                  <p className="text-xs text-gray-500 mb-4">{t('dashboard.tripTypeSub')}</p>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={kpiData.charts.tripType.labels.map((label, i) => ({
                      name: label,
                      value: kpiData.charts.tripType.data[i]
                    }))} layout="vertical">
                      <XAxis type="number" fontSize={11} />
                      <YAxis dataKey="name" type="category" fontSize={11} width={140} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {kpiData.charts.tripType.labels.map((_, i) => (
                          <Cell key={i} fill={IG_COLORS[i % IG_COLORS.length]} />
                        ))}
                      </Bar>
                      <Legend verticalAlign="bottom" height={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between text-xs text-gray-500">
                <span>{t('dashboard.lastUpdate')} {lastUpdate.toLocaleTimeString(language === "th" ? "th-TH" : "en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                <button 
                  onClick={fetchKPI} 
                  className={`flex items-center gap-2 hover:text-gray-700 ${refreshing ? "animate-spin" : ""}`}
                >
                  <RotateCw size={14} /> Refresh
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}