import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  UserCheck, 
  Bell, 
  ChevronDown, 
  Download,
  AlertTriangle,
  RotateCcw,
  Key,
  LogOut,
  LogIn
} from 'lucide-react';
import { useHealthData } from '../../context/HealthDataContext';
import { UserRole } from '../../types/health';
import { findCriticalIndicators } from '../../utils/healthCalculations';

interface HeaderProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeView, setActiveView }) => {
  const { 
    currentUser, 
    setCurrentUser, 
    allUsers, 
    records, 
    indicators,
    resetToDefaultData,
    isAuthenticated,
    openAuthModal,
    logout
  } = useHealthData();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showAlertMenu, setShowAlertMenu] = useState(false);

  const criticalAlerts = React.useMemo(() => {
    return findCriticalIndicators(records, indicators);
  }, [records, indicators]);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return { label: 'Administrator', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'DINKES':
        return { label: 'Dinas Kesehatan', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'DATA_MANAGER':
        return { label: 'Pengelola Data', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'PUSKESMAS':
        return { label: 'Puskesmas', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'VIEWER':
      case 'READ_ONLY':
        return { label: 'Viewer (Hanya-Baca)', bg: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
  };

  const roleInfo = getRoleBadge(currentUser.role);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-teal-600 text-white shadow-sm font-semibold">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <a 
            href="#dashboard" 
            onClick={(e) => { e.preventDefault(); setActiveView('dashboard'); }}
            className="text-base font-bold tracking-tight text-slate-900 hover:text-teal-700 transition-colors"
          >
            HealthData Analytics
          </a>
          <div className="text-[11px] text-slate-500 font-medium -mt-0.5">
            Dinas Kesehatan & Jejaring Puskesmas
          </div>
        </div>
      </div>

      {/* Zone 2: Navigation Breadcrumb / Context */}
      <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium">
        <span className="text-slate-400">Sistem Informasi Kesehatan</span>
        <span>/</span>
        <span className="text-slate-700 font-semibold capitalize">
          {activeView === 'dashboard' && 'Ringkasan Dashboard'}
          {activeView === 'indicators' && 'Analisis Indikator SPM'}
          {activeView === 'comparison' && 'Perbandingan Antar Puskesmas'}
          {activeView === 'trends' && 'Analisis Tren Waktu'}
          {activeView === 'age-groups' && 'Analisis Kelompok Umur'}
          {activeView === 'data' && 'Manajemen & Entri Data'}
          {activeView === 'import' && 'Import Data Excel'}
          {activeView === 'reports' && 'Laporan Eksekutif & Ekspor'}
          {activeView === 'roles' && 'Hak Akses & Pengguna'}
        </span>
      </div>

      {/* Zone 3: Actions, Alerts, & Role Switcher */}
      <div className="flex items-center gap-3">
        {/* Reset Data Button (Helpful for demo/testing) */}
        <button
          onClick={() => {
            if (window.confirm('Reset semua data ke dataset awal contoh resmi?')) {
              resetToDefaultData();
            }
          }}
          title="Reset ke data bawaan"
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Reset Data</span>
        </button>

        {/* Critical Alerts Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowAlertMenu(!showAlertMenu)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Pemberitahuan Indikator Kritis"
            aria-label="Pemberitahuan Indikator Kritis"
          >
            <Bell className="w-4 h-4" />
            {criticalAlerts.length > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-600 rounded-full animate-pulse">
                {criticalAlerts.length}
              </span>
            )}
          </button>

          {/* Alert Popover */}
          {showAlertMenu && (
            <div className="absolute right-0 mt-2 w-84 bg-white border border-slate-200 rounded-lg shadow-lg py-2 z-50">
              <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  Peringatan Indikator Kritis ({criticalAlerts.length})
                </span>
                <span className="text-[11px] text-slate-400 font-mono">SPM Alert</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {criticalAlerts.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-400">
                    Tidak ada indikator dalam status kritis saat ini.
                  </div>
                ) : (
                  criticalAlerts.map(alert => (
                    <button
                      key={alert.indicator.id}
                      onClick={() => {
                        setShowAlertMenu(false);
                        setActiveView('indicators');
                      }}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-800 line-clamp-1">
                          {alert.indicator.name}
                        </span>
                        <span className="text-[11px] font-mono font-semibold text-red-600 ml-2">
                          {alert.lowestRate}%
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {alert.affectedPuskesmasCount} Puskesmas di bawah ambang ({alert.criticalPuskesmasNames.slice(0, 2).join(', ')}...)
                      </div>
                    </button>
                  ))
                )}
              </div>
              <div className="p-2 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    setShowAlertMenu(false);
                    setActiveView('dashboard');
                  }}
                  className="text-xs font-medium text-teal-600 hover:text-teal-700"
                >
                  Lihat Semua di Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Export Button */}
        <button
          onClick={() => setActiveView('reports')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* User Profile & Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2.5 p-1.5 pl-2 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors"
            title="Ganti Peran Pengguna (Role Switcher)"
            aria-label="User Account and Role Selector"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center shrink-0">
              {currentUser.avatarUrl ? (
                <img 
                  src={currentUser.avatarUrl} 
                  alt={currentUser.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-xs font-bold text-slate-600">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-36">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-500 truncate max-w-36">
                {roleInfo.label}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Role Switching Dropdown */}
          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-xl py-2 z-50">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Ganti Akun Pengguna & Hak Akses
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Uji coba 5 hak akses peran sesuai spesifikasi:
                </div>
              </div>
              <div className="py-1">
                {allUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setCurrentUser(user);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 flex items-start gap-2.5 hover:bg-slate-50 transition-colors ${
                      currentUser.id === user.id ? 'bg-teal-50/60' : ''
                    }`}
                  >
                    <div className="mt-0.5">
                      {user.role === 'ADMIN' && <ShieldCheck className="w-4 h-4 text-indigo-600" />}
                      {user.role === 'DINKES' && <Building2 className="w-4 h-4 text-emerald-600" />}
                      {user.role === 'DATA_MANAGER' && <UserCheck className="w-4 h-4 text-blue-600" />}
                      {user.role === 'PUSKESMAS' && <Building2 className="w-4 h-4 text-amber-600" />}
                      {user.role === 'READ_ONLY' && <UserCheck className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-900 truncate">
                          {user.name}
                        </span>
                        {currentUser.id === user.id && (
                          <span className="text-[10px] font-bold text-teal-600">Aktif</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {user.title}
                      </div>
                      <span className={`inline-block mt-0.5 px-1.5 py-0.2 text-[9px] font-medium rounded border ${
                        getRoleBadge(user.role).bg
                      }`}>
                        {getRoleBadge(user.role).label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/70 space-y-1">
                <button
                  onClick={() => {
                    setShowRoleMenu(false);
                    openAuthModal('CHANGE_PASSWORD');
                  }}
                  className="w-full text-left px-2 py-1.5 text-xs text-slate-700 hover:text-slate-900 hover:bg-white rounded flex items-center gap-2 transition-colors font-medium"
                >
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  <span>Ubah Kata Sandi Akun</span>
                </button>

                <button
                  onClick={() => {
                    setShowRoleMenu(false);
                    openAuthModal('LOGIN');
                  }}
                  className="w-full text-left px-2 py-1.5 text-xs text-slate-700 hover:text-slate-900 hover:bg-white rounded flex items-center gap-2 transition-colors font-medium"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-400" />
                  <span>Masuk dengan Akun Lain</span>
                </button>

                {isAuthenticated && (
                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded flex items-center gap-2 transition-colors font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Keluar (Logout)</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowRoleMenu(false);
                    setActiveView('roles');
                  }}
                  className="w-full text-center text-[11px] text-teal-700 hover:underline pt-1 block"
                >
                  Lihat Matriks Hak Akses Lengkap
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
