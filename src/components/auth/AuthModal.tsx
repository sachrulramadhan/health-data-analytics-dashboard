import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Key, 
  ShieldCheck, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  X,
  ArrowRight
} from 'lucide-react';
import { useHealthData } from '../../context/HealthDataContext';

export const AuthModal: React.FC = () => {
  const { 
    authModal, 
    closeAuthModal, 
    openAuthModal,
    login, 
    resetPassword, 
    changePassword, 
    currentUser,
    allUsers 
  } = useHealthData();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!authModal.isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const result = login(email, password);
    if (!result.success) {
      setFeedback({ type: 'error', message: result.message || 'Login gagal.' });
    } else {
      setFeedback({ type: 'success', message: result.message || 'Berhasil masuk.' });
      setTimeout(() => closeAuthModal(), 600);
    }
  };

  const handleQuickLogin = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setFeedback(null);
    const result = login(userEmail, userPass);
    if (result.success) {
      setTimeout(() => closeAuthModal(), 500);
    }
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const result = resetPassword(email);
    setFeedback({
      type: result.success ? 'success' : 'error',
      message: result.message,
    });
  };

  const handleChangePassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'Konfirmasi kata sandi baru tidak cocok.' });
      return;
    }
    const result = changePassword(currentPassword, newPassword);
    setFeedback({
      type: result.success ? 'success' : 'error',
      message: result.message,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {authModal.mode === 'LOGIN' && 'Masuk ke Sistem Analitik'}
                {authModal.mode === 'RESET' && 'Reset Kata Sandi Akun'}
                {authModal.mode === 'CHANGE_PASSWORD' && 'Perbarui Kata Sandi Akun'}
              </h2>
              <p className="text-[11px] text-slate-500">
                Health Data Analytics Dashboard
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div className={`m-4 p-3 rounded-lg text-xs flex items-start gap-2 ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Body based on mode */}
        {authModal.mode === 'LOGIN' && (
          <div className="p-5 space-y-4">
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Email:
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="nama@dinkes.go.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Kata Sandi:
                  </label>
                  <button
                    type="button"
                    onClick={() => openAuthModal('RESET')}
                    className="text-[11px] text-teal-600 hover:underline"
                  >
                    Lupa password?
                  </button>
                </div>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Quick Demo Credentials */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Pilih Akun Demo Cepat (1-Klik):
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@dinkes.go.id', 'admin123')}
                  className="p-2 text-left bg-slate-50 hover:bg-teal-50 border border-slate-200 rounded-lg transition-colors"
                >
                  <strong className="block text-slate-800">Administrator</strong>
                  <span className="text-slate-500">admin@dinkes.go.id</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('manager@dinkes.go.id', 'manager123')}
                  className="p-2 text-left bg-slate-50 hover:bg-teal-50 border border-slate-200 rounded-lg transition-colors"
                >
                  <strong className="block text-slate-800">Data Manager</strong>
                  <span className="text-slate-500">manager@dinkes.go.id</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('puskesmas@melati.go.id', 'puskesmas123')}
                  className="p-2 text-left bg-slate-50 hover:bg-teal-50 border border-slate-200 rounded-lg transition-colors"
                >
                  <strong className="block text-slate-800">Puskesmas</strong>
                  <span className="text-slate-500">puskesmas@melati.go.id</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('viewer@publik.go.id', 'viewer123')}
                  className="p-2 text-left bg-slate-50 hover:bg-teal-50 border border-slate-200 rounded-lg transition-colors"
                >
                  <strong className="block text-slate-800">Viewer</strong>
                  <span className="text-slate-500">viewer@publik.go.id</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {authModal.mode === 'RESET' && (
          <div className="p-5 space-y-4">
            <p className="text-xs text-slate-600">
              Masukkan alamat email akun Anda. Sistem akan memverifikasi dan mereset kata sandi Anda ke kata sandi standar sementara.
            </p>
            <form onSubmit={handleResetSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Email:
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="nama@dinkes.go.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => openAuthModal('LOGIN')}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Kembali ke Login
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  Reset Kata Sandi
                </button>
              </div>
            </form>
          </div>
        )}

        {authModal.mode === 'CHANGE_PASSWORD' && (
          <div className="p-5 space-y-4">
            <div className="text-xs text-slate-600">
              Perbarui kata sandi untuk akun: <strong>{currentUser.name}</strong> ({currentUser.email})
            </div>

            <form onSubmit={handleChangePassSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi Lama:
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi Baru:
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  placeholder="Minimal 6 karakter"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Konfirmasi Kata Sandi Baru:
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeAuthModal}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  Simpan Kata Sandi Baru
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
