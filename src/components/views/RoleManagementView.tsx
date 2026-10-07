import React from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  Building2, 
  Check, 
  X, 
  Lock, 
  KeyRound,
  Users
} from 'lucide-react';
import { useHealthData } from '../../context/HealthDataContext';
import { UserRole } from '../../types/health';

export const RoleManagementView: React.FC = () => {
  const { currentUser, setCurrentUser, allUsers } = useHealthData();

  const permissionMatrix: {
    capability: string;
    ADMIN: boolean;
    DINKES: boolean;
    DATA_MANAGER: boolean;
    PUSKESMAS: boolean;
    READ_ONLY: boolean;
  }[] = [
    {
      capability: 'Melihat Seluruh Data Puskesmas se-Kabupaten',
      ADMIN: true,
      DINKES: true,
      DATA_MANAGER: true,
      PUSKESMAS: false,
      READ_ONLY: true,
    },
    {
      capability: 'Melihat Data Capaian Puskesmas Sendiri',
      ADMIN: true,
      DINKES: true,
      DATA_MANAGER: true,
      PUSKESMAS: true,
      READ_ONLY: true,
    },
    {
      capability: 'Entri & Input Capaian Baru',
      ADMIN: true,
      DINKES: false,
      DATA_MANAGER: true,
      PUSKESMAS: true,
      READ_ONLY: false,
    },
    {
      capability: 'Edit Data yang Sudah Diinput',
      ADMIN: true,
      DINKES: false,
      DATA_MANAGER: true,
      PUSKESMAS: true, // Only own puskesmas
      READ_ONLY: false,
    },
    {
      capability: 'Hapus Catatan Capaian',
      ADMIN: true,
      DINKES: false,
      DATA_MANAGER: true,
      PUSKESMAS: false,
      READ_ONLY: false,
    },
    {
      capability: 'Import Berkas Excel (.xlsx)',
      ADMIN: true,
      DINKES: false,
      DATA_MANAGER: true,
      PUSKESMAS: false,
      READ_ONLY: false,
    },
    {
      capability: 'Ekspor Laporan Resmi & Cetak PDF',
      ADMIN: true,
      DINKES: true,
      DATA_MANAGER: true,
      PUSKESMAS: true,
      READ_ONLY: true,
    },
    {
      capability: 'Manajemen Master Indikator & Target SPM',
      ADMIN: true,
      DINKES: true,
      DATA_MANAGER: false,
      PUSKESMAS: false,
      READ_ONLY: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Manajemen Peran & Matriks Hak Akses (RBAC)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengaturan izin berjenjang untuk Administrator, Dinas Kesehatan, Pengelola Data, Puskesmas, dan Publik.
          </p>
        </div>
      </div>

      {/* Quick Role Switcher Cards */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Uji Coba Ganti Akun & Hak Akses Pengguna
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pilih salah satu profil untuk menguji batasan dan fungsionalitas tiap peran dalam aplikasi.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allUsers.map((user) => {
            const isSelected = currentUser.id === user.id;

            return (
              <div
                key={user.id}
                onClick={() => setCurrentUser(user)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-teal-600 bg-teal-50/40 shadow-xs ring-1 ring-teal-600'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        user.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 leading-tight">
                        {user.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {user.email}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="px-2 py-0.5 text-[10px] font-bold text-teal-700 bg-teal-100 rounded">
                      Aktif
                    </span>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">{user.title}</span>
                  <span className="font-mono font-semibold text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                    {user.role}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Permission Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">
            Matriks Hak Akses Berdasarkan Peran (Role-Based Access Control)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kewenangan operasional yang diterapkan secara otomatis pada antarmuka sistem.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Fitur & Kewenangan Sistem</th>
                <th className="py-3 px-3 text-center">Administrator</th>
                <th className="py-3 px-3 text-center">Data Manager</th>
                <th className="py-3 px-3 text-center">Puskesmas</th>
                <th className="py-3 px-3 text-center">Viewer (Hanya-Baca)</th>
                <th className="py-3 px-3 text-center">Dinas Kesehatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissionMatrix.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {item.capability}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {item.ADMIN ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {item.DINKES ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {item.DATA_MANAGER ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {item.PUSKESMAS ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {item.READ_ONLY ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
