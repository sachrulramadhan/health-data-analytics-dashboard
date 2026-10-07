import React from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  GitCompare, 
  TrendingUp, 
  Users,
  Database, 
  FileSpreadsheet, 
  FileText, 
  ShieldCheck,
  Building,
  Info
} from 'lucide-react';
import { useHealthData } from '../../context/HealthDataContext';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const { currentUser, filteredRecords, indicators } = useHealthData();

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Ringkasan Dashboard',
      description: 'KPI utama & indikator kritis',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'indicators',
      label: 'Analisis Indikator',
      description: 'Deep-dive capaian SPM',
      icon: Activity,
      badge: `${indicators.length} SPM`,
    },
    {
      id: 'comparison',
      label: 'Perbandingan Wilayah',
      description: 'Benchmark antar Puskesmas',
      icon: GitCompare,
      badge: null,
    },
    {
      id: 'trends',
      label: 'Analisis Tren Waktu',
      description: 'Tren bulanan & proyeksi',
      icon: TrendingUp,
      badge: null,
    },
    {
      id: 'age-groups',
      label: 'Kelompok Umur',
      description: 'Analisis siklus hidup demografi',
      icon: Users,
      badge: 'F05',
    },
    {
      id: 'data',
      label: 'Kelola & Entri Data',
      description: 'Tabel data & input capaian',
      icon: Database,
      badge: `${filteredRecords.length}`,
    },
    {
      id: 'import',
      label: 'Import Data Excel',
      description: 'Unggah file XLSX & template',
      icon: FileSpreadsheet,
      badge: 'XLSX',
    },
    {
      id: 'reports',
      label: 'Laporan & Ekspor',
      description: 'Cetak resmi & unduh Excel',
      icon: FileText,
      badge: null,
    },
    {
      id: 'roles',
      label: 'Role & Hak Akses',
      description: 'Manajemen hak akses pengguna',
      icon: ShieldCheck,
      badge: currentUser.role,
    },
  ];

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col h-[calc(100vh-4rem)]">
      {/* Scope / Puskesmas Context Info */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
          <Building className="w-3.5 h-3.5 text-teal-600" />
          <span>Lingkup Wilayah:</span>
        </div>
        <div className="text-xs text-slate-600 mt-1 truncate font-medium">
          {currentUser.role === 'PUSKESMAS' && currentUser.puskesmasName ? (
            <span className="text-teal-700 font-semibold">{currentUser.puskesmasName} (Terkunci)</span>
          ) : (
            <span>Kabupaten/Kota (Semua Faskes)</span>
          )}
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Standar Pelayanan Minimal (Permenkes)
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-xs font-medium transition-all ${
                isActive
                  ? 'bg-teal-50 text-teal-900 border border-teal-200/60 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                <div className="truncate">
                  <div className="truncate">{item.label}</div>
                  <div className={`text-[10px] font-normal truncate ${isActive ? 'text-teal-700/80' : 'text-slate-400'}`}>
                    {item.description}
                  </div>
                </div>
              </div>

              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium shrink-0 ml-2 ${
                  isActive
                    ? 'bg-teal-100 text-teal-800'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Status & Role Helper */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/40">
        <div className="flex items-start gap-2 p-2 rounded-md bg-white border border-slate-200 text-[11px] text-slate-600">
          <Info className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
          <div className="leading-tight">
            <span className="font-semibold text-slate-800 block">Status Peran:</span>
            {currentUser.role === 'VIEWER' && 'Akses Viewer (Hanya-Baca). Pengubahan data dinonaktifkan.'}
            {currentUser.role === 'READ_ONLY' && 'Mode Hanya-Baca. Input & edit dinonaktifkan.'}
            {currentUser.role === 'PUSKESMAS' && 'Akses terbatas ke data Puskesmas terpilih.'}
            {currentUser.role === 'DINKES' && 'Akses eksekutif seluruh Puskesmas & analisis.'}
            {currentUser.role === 'DATA_MANAGER' && 'Izin penuh import Excel & validasi data.'}
            {currentUser.role === 'ADMIN' && 'Akses penuh seluruh konfigurasi & data.'}
          </div>
        </div>
      </div>
    </aside>
  );
};
