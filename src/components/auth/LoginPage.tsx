import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  Mail, 
  Key, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Eye,
  EyeOff,
  Activity,
  FileSpreadsheet,
  BarChart3
} from 'lucide-react';
import { useHealthData } from '../../context/HealthDataContext';

export const LoginPage: React.FC = () => {
  const { login, resetPassword, allUsers } = useHealthData();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = login(email, password);
      setIsLoading(false);
      if (!result.success) {
        setErrorMessage(result.message || 'Login gagal. Email atau kata sandi tidak cocok.');
      }
    }, 250);
  };

  const handleQuickLogin = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      login(userEmail, userPass);
      setIsLoading(false);
    }, 200);
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setResetSuccessMessage(null);

    const result = resetPassword(email);
    if (result.success) {
      setResetSuccessMessage(result.message);
      setPassword('password123');
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Lockup */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-600 text-white shadow-lg mb-4 ring-8 ring-teal-500/20">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            HealthData Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Sistem Informasi & Evaluasi Kinerja Indikator Kesehatan Puskesmas
          </p>
          <div className="text-[11px] font-mono text-teal-400 mt-0.5 font-medium">
            Dinas Kesehatan Kabupaten / Kota
          </div>
        </div>

        {/* Card Box */}
        <div className="mt-8 bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {/* Error Banner (Flow 1: Login -> Error -> Login kembali) */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Autentikasi Gagal</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Reset Success Message */}
          {resetSuccessMessage && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Kata Sandi Direset</strong>
                <span>{resetSuccessMessage}</span>
              </div>
            </div>
          )}

          {!isResetMode ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Akun Pengguna:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@dinkes.go.id"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Kata Sandi:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMode(true);
                      setErrorMessage(null);
                    }}
                    className="text-xs text-teal-600 hover:text-teal-700 hover:underline font-semibold"
                  >
                    Lupa Password?
                  </button>
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Tampilkan kata sandi"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group disabled:opacity-60"
              >
                <span>{isLoading ? 'Memverifikasi...' : 'Masuk ke Dashboard'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </form>
          ) : (
            /* Reset Password Form */
            <form onSubmit={handleReset} className="space-y-4">
              <div className="text-xs text-slate-600 leading-relaxed">
                Masukkan email terdaftar untuk mereset kata sandi Anda ke kata sandi standar sementara (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono">password123</code>).
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Akun:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@dinkes.go.id"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetMode(false);
                    setErrorMessage(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                >
                  Kembali ke Form Login
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs"
                >
                  Reset Password
                </button>
              </div>
            </form>
          )}

          {/* Quick Demo Credentials (1-Click Login for all 4 PRD roles) */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Masuk Cepat Pengujian (1-Klik):
              </span>
              <span className="text-[10px] text-teal-600 font-mono">4 Peran PRD</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@dinkes.go.id', 'admin123')}
                className="p-2.5 text-left bg-slate-50 hover:bg-teal-50/80 border border-slate-200 hover:border-teal-300 rounded-xl transition-all"
              >
                <div className="font-bold text-slate-800 truncate">Administrator</div>
                <div className="text-[10px] text-slate-500 truncate">admin@dinkes.go.id</div>
                <div className="text-[9px] text-indigo-700 font-semibold mt-0.5">Akses Penuh + Config</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('manager@dinkes.go.id', 'manager123')}
                className="p-2.5 text-left bg-slate-50 hover:bg-teal-50/80 border border-slate-200 hover:border-teal-300 rounded-xl transition-all"
              >
                <div className="font-bold text-slate-800 truncate">Data Manager</div>
                <div className="text-[10px] text-slate-500 truncate">manager@dinkes.go.id</div>
                <div className="text-[9px] text-blue-700 font-semibold mt-0.5">Import Excel + Validasi</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('puskesmas@melati.go.id', 'puskesmas123')}
                className="p-2.5 text-left bg-slate-50 hover:bg-teal-50/80 border border-slate-200 hover:border-teal-300 rounded-xl transition-all"
              >
                <div className="font-bold text-slate-800 truncate">Puskesmas Melati</div>
                <div className="text-[10px] text-slate-500 truncate">puskesmas@melati.go.id</div>
                <div className="text-[9px] text-amber-700 font-semibold mt-0.5">Input Wilayah Sendiri</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('viewer@publik.go.id', 'viewer123')}
                className="p-2.5 text-left bg-slate-50 hover:bg-teal-50/80 border border-slate-200 hover:border-teal-300 rounded-xl transition-all"
              >
                <div className="font-bold text-slate-800 truncate">Viewer</div>
                <div className="text-[10px] text-slate-500 truncate">viewer@publik.go.id</div>
                <div className="text-[9px] text-slate-600 font-semibold mt-0.5">Hanya-Baca (No Edit)</div>
              </button>
            </div>
          </div>
        </div>

        {/* Feature Highlights beneath */}
        <div className="mt-6 grid grid-cols-3 gap-2 text-center text-slate-400 text-[11px]">
          <div className="flex flex-col items-center">
            <Activity className="w-4 h-4 text-teal-400 mb-1" />
            <span>12 Indikator SPM</span>
          </div>
          <div className="flex flex-col items-center">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 mb-1" />
            <span>Import Excel .xlsx</span>
          </div>
          <div className="flex flex-col items-center">
            <BarChart3 className="w-4 h-4 text-blue-400 mb-1" />
            <span>Komparasi Faskes</span>
          </div>
        </div>
      </div>
    </div>
  );
};
