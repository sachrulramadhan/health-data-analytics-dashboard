import React, { useState, useMemo } from 'react';
import { 
  Database, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  CheckCircle, 
  AlertTriangle,
  Lock,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Download,
  History,
  ShieldCheck,
  UserCheck,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { useHealthData } from '../../context/HealthDataContext';
import { formatNumberID, getIndicatorSPMStatus, checkDuplicateRecord } from '../../utils/healthCalculations';
import { IndicatorDataRecord, AuditLog, StandardAgeBracket } from '../../types/health';
import { MONTH_NAMES_ID, STANDARD_AGE_BRACKETS } from '../../data/mockData';
import { exportHealthDataToExcel, exportToCSV } from '../../utils/excelHelper';

export const DataManagementView: React.FC<{ setActiveView: (view: string) => void }> = ({ setActiveView }) => {
  const {
    filteredRecords,
    indicators,
    puskesmasList,
    records,
    currentUser,
    selectedYear,
    selectedMonth,
    selectedPuskesmasId,
    auditLogs,
    addRecord,
    updateRecord,
    deleteRecord,
  } = useHealthData();

  // Active view tab: Data Table vs Audit Trail (Business Rule 7)
  const [activeTab, setActiveTab] = useState<'DATA' | 'AUDIT'>('DATA');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<IndicatorDataRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<IndicatorDataRecord | null>(null);

  // Form states
  const [formPkmId, setFormPkmId] = useState(
    currentUser.role === 'PUSKESMAS' && currentUser.puskesmasId
      ? currentUser.puskesmasId
      : puskesmasList[0]?.id || ''
  );
  const [formIndicatorId, setFormIndicatorId] = useState(indicators[0]?.id || '');
  const [formYear, setFormYear] = useState('2026');
  const [formMonth, setFormMonth] = useState(4);
  const [formNumerator, setFormNumerator] = useState('100');
  const [formDenominator, setFormDenominator] = useState('120');
  const [formAgeBracket, setFormAgeBracket] = useState<StandardAgeBracket | ''>('');
  const [formNotes, setFormNotes] = useState('');
  const [formValidationError, setFormValidationError] = useState<string | null>(null);

  // Pagination for Data
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Search & Pagination for Audit Trail
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditPage, setAuditPage] = useState(1);
  const auditPageSize = 10;

  const isReadOnly = currentUser.role === 'READ_ONLY' || currentUser.role === 'VIEWER';

  // Can this user modify this specific record?
  const canModifyRecord = (rec: IndicatorDataRecord) => {
    if (isReadOnly) return false;
    if (currentUser.role === 'ADMIN' || currentUser.role === 'DATA_MANAGER') return true;
    if (currentUser.role === 'PUSKESMAS') {
      return rec.puskesmasId === currentUser.puskesmasId;
    }
    return false;
  };

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    if (!auditSearchQuery.trim()) return auditLogs;
    const q = auditSearchQuery.toLowerCase();
    return auditLogs.filter(log => 
      log.user.toLowerCase().includes(q) ||
      log.puskesmasName.toLowerCase().includes(q) ||
      log.indicatorName.toLowerCase().includes(q) ||
      log.changeSummary.toLowerCase().includes(q)
    );
  }, [auditLogs, auditSearchQuery]);

  const paginatedAuditLogs = useMemo(() => {
    const start = (auditPage - 1) * auditPageSize;
    return filteredAuditLogs.slice(start, start + auditPageSize);
  }, [filteredAuditLogs, auditPage]);

  const totalAuditPages = Math.ceil(filteredAuditLogs.length / auditPageSize) || 1;

  const handleOpenAddModal = () => {
    setFormPkmId(
      currentUser.role === 'PUSKESMAS' && currentUser.puskesmasId
        ? currentUser.puskesmasId
        : puskesmasList[0]?.id || ''
    );
    setFormIndicatorId(indicators[0]?.id || '');
    setFormYear('2026');
    setFormMonth(4);
    setFormNumerator('85');
    setFormDenominator('100');
    setFormAgeBracket('');
    setFormNotes('');
    setFormValidationError(null);
    setIsAddModalOpen(true);
  };

  // Business Rule 1: Strict Data Validation & Duplicate Checking
  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationError(null);

    // 1. Mandatory field checks
    if (!formPkmId || !formIndicatorId) {
      setFormValidationError('Puskesmas dan Indikator wajib dipilih.');
      return;
    }

    const pkm = puskesmasList.find(p => p.id === formPkmId);
    const ind = indicators.find(i => i.id === formIndicatorId);
    if (!pkm || !ind) {
      setFormValidationError('Puskesmas atau Indikator tidak terdaftar dalam sistem.');
      return;
    }

    // 2. Numeric format & year validation
    const year = Number(formYear);
    const numerator = Number(formNumerator);
    const denominator = Number(formDenominator);

    if (formYear.trim() === '' || !Number.isInteger(year) || year < 2020 || year > 2030) {
      setFormValidationError('Tahun tidak valid. Masukkan tahun antara 2020 - 2030.');
      return;
    }

    if (!Number.isInteger(formMonth) || formMonth < 1 || formMonth > 12) {
      setFormValidationError('Bulan tidak valid. Gunakan angka 1 sampai 12.');
      return;
    }

    if (formNumerator.trim() === '' || !Number.isFinite(numerator) || numerator < 0) {
      setFormValidationError('Numerator (realisasi) harus angka numerik non-negatif.');
      return;
    }

    if (formDenominator.trim() === '' || !Number.isFinite(denominator) || denominator <= 0) {
      setFormValidationError('Denominator (sasaran) harus angka numerik lebih besar dari 0.');
      return;
    }

    // 3. Duplicate Checking (Business Rule 1: Duplikasi harus diperiksa)
    const duplicateCheck = checkDuplicateRecord(
      records, formPkmId, formIndicatorId, year, formMonth, undefined, formAgeBracket || undefined
    );
    if (duplicateCheck.isDuplicate) {
      setFormValidationError(
        `Duplikasi data terdeteksi! Sudah terdapat catatan untuk ${pkm.name} - ${ind.name} pada periode ${formYear} Bulan ${formMonth}. Silakan edit baris data yang telah ada.`
      );
      return;
    }

    // Save record; the context revalidates before persistence and records the audit snapshot.
    const result = addRecord({
      puskesmasId: pkm.id,
      puskesmasName: pkm.name,
      indicatorId: ind.id,
      indicatorCode: ind.code,
      indicatorName: ind.name,
      category: ind.category,
      ageGroup: ind.ageGroup,
      year,
      month: formMonth,
      targetValue: ind.spmTarget,
      numerator,
      denominator,
      ageBracket: formAgeBracket || undefined,
      notes: formNotes || undefined,
    });
    if (!result.success) {
      setFormValidationError(result.message || 'Data tidak dapat disimpan.');
      return;
    }

    setIsAddModalOpen(false);
  };

  const handleOpenEdit = (rec: IndicatorDataRecord) => {
    setEditingRecord(rec);
    setFormNumerator(String(rec.numerator));
    setFormDenominator(String(rec.denominator));
    setFormAgeBracket(rec.ageBracket || '');
    setFormNotes(rec.notes || '');
    setFormValidationError(null);
  };

  // Edit save with validation & duplicate check
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setFormValidationError(null);

    const numerator = Number(formNumerator);
    const denominator = Number(formDenominator);

    if (formNumerator.trim() === '' || !Number.isFinite(numerator) || numerator < 0) {
      setFormValidationError('Numerator (realisasi) harus angka numerik non-negatif.');
      return;
    }

    if (formDenominator.trim() === '' || !Number.isFinite(denominator) || denominator <= 0) {
      setFormValidationError('Denominator (sasaran) harus angka numerik lebih besar dari 0.');
      return;
    }

    const result = updateRecord(editingRecord.id, {
      numerator,
      denominator,
      ageBracket: formAgeBracket || undefined,
      notes: formNotes || undefined,
    });
    if (!result.success) {
      setFormValidationError(result.message || 'Data tidak dapat diperbarui.');
      return;
    }

    setEditingRecord(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingRecord) return;
    deleteRecord(deletingRecord.id);
    setDeletingRecord(null);
  };

  const handleExportExcel = () => {
    exportHealthDataToExcel(filteredRecords, indicators, puskesmasList, {
      year: selectedYear,
      month: selectedMonth === 'ALL' ? 'Tahunan' : selectedMonth,
      pkmFilter: selectedPuskesmasId === 'ALL' ? 'Semua Puskesmas' : selectedPuskesmasId,
    });
  };

  const handleExportCSV = () => {
    exportToCSV(filteredRecords, `Manajemen_Data_Kesehatan_${selectedYear}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Title & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Manajemen Data & Entri Capaian Indikator
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengelolaan catatan riil, validasi input, pencegahan duplikasi, dan audit log perubahan data.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
            title="Ekspor ke Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
            title="Ekspor ke CSV"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span>CSV</span>
          </button>

          <button
            onClick={() => setActiveView('import')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Import Excel</span>
          </button>

          {!isReadOnly ? (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Entri Data Baru</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-100 rounded-lg border border-slate-200">
              <Lock className="w-3.5 h-3.5" />
              <span>Entri Dinonaktifkan (Read-Only)</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs: Data Capaian vs Audit Trail */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
        <button
          onClick={() => setActiveTab('DATA')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'DATA'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Daftar Data Capaian ({filteredRecords.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'AUDIT'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit Trail & Log Perubahan ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: DATA CAPAIAN */}
      {activeTab === 'DATA' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Menampilkan <strong className="text-slate-800">{paginatedRecords.length}</strong> dari <strong className="text-slate-800">{filteredRecords.length}</strong> catatan terpilih
            </span>
            <span>Halaman {currentPage} dari {totalPages}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Periode</th>
                  <th className="py-2.5 px-3">Kelompok Umur</th>
                  <th className="py-2.5 px-3">Puskesmas</th>
                  <th className="py-2.5 px-3">Indikator</th>
                  <th className="py-2.5 px-3 text-right">Target</th>
                  <th className="py-2.5 px-3 text-right">Numerator (Realisasi)</th>
                  <th className="py-2.5 px-3 text-right">Denominator (Sasaran)</th>
                  <th className="py-2.5 px-3 text-right">Capaian</th>
                  <th className="py-2.5 px-3 text-center">Status SPM</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center">
                      <div className="max-w-sm mx-auto text-center">
                        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                        <h4 className="text-xs font-bold text-slate-800">
                          Tidak ada data untuk filter yang dipilih.
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Sistem tidak menampilkan nilai 0 sebagai pengganti data kosong tanpa aturan yang jelas. Sesuaikan filter untuk memuat data.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((rec) => {
                    const ind = indicators.find(i => i.id === rec.indicatorId);
                    const status = ind ? getIndicatorSPMStatus(ind, rec.achievementRate) : 'WASPADA';
                    const isAllowed = canModifyRecord(rec);

                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                          {rec.year} - Bln {String(rec.month).padStart(2, '0')}
                        </td>
                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                            {rec.ageBracket ? `${rec.ageBracket} Tahun` : '-'}
                          </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                          {rec.puskesmasName}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-800">{rec.indicatorName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{rec.indicatorCode}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {rec.targetValue}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-800 font-medium">
                          {formatNumberID(rec.numerator)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {formatNumberID(rec.denominator)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {rec.achievementRate}%
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            status === 'TERCAPAI'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : status === 'WASPADA'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          {isAllowed ? (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEdit(rec)}
                                className="p-1 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded"
                                title="Edit Data"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingRecord(rec)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded"
                                title="Hapus Data"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Terkunci</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="p-3 bg-slate-50/60 border-t border-slate-200 flex items-center justify-between text-xs">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
            </button>

            <span className="text-slate-500 font-mono">
              Halaman {currentPage} dari {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Selanjutnya <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT TRAIL (Business Rule 7) */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Audit Trail & Log Perubahan Data (Business Rule 7)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mencatat siapa yang mengubah, kapan diubah, data sebelum perubahan, dan data setelah perubahan.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative min-w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari petugas, puskesmas..."
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Waktu (WIB)</th>
                  <th className="py-2.5 px-3">Petugas & Role</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                  <th className="py-2.5 px-3">Puskesmas & Indikator</th>
                  <th className="py-2.5 px-3">Periode</th>
                  <th className="py-2.5 px-3">Data Sebelum</th>
                  <th className="py-2.5 px-3">Data Setelah</th>
                  <th className="py-2.5 px-3">Ringkasan Perubahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Belum ada catatan log audit yang tercatat atau cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  paginatedAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {log.timestamp.replace('T', ' ').slice(0, 19)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{log.user}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{log.userRole}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          log.action === 'CREATE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : log.action === 'UPDATE'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : log.action === 'DELETE'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800">{log.puskesmasName}</div>
                        <div className="text-[10px] text-slate-400">{log.indicatorName}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {log.period}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                        {log.previousData ? (
                          <details>
                            <summary className="cursor-pointer">{String(log.previousValue ?? 'Lihat data')}</summary>
                            <pre className="mt-2 max-w-sm max-h-56 overflow-auto whitespace-pre-wrap break-all rounded bg-slate-50 p-2 text-[10px]">
                              {JSON.stringify(log.previousData, null, 2)}
                            </pre>
                          </details>
                        ) : log.previousValue !== null && log.previousValue !== undefined ? String(log.previousValue) : '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-teal-700 font-semibold text-[11px]">
                        {log.newData ? (
                          <details>
                            <summary className="cursor-pointer">{String(log.newValue ?? 'Lihat data')}</summary>
                            <pre className="mt-2 max-w-sm max-h-56 overflow-auto whitespace-pre-wrap break-all rounded bg-slate-50 p-2 text-[10px]">
                              {JSON.stringify(log.newData, null, 2)}
                            </pre>
                          </details>
                        ) : log.newValue !== null && log.newValue !== undefined ? String(log.newValue) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={log.changeSummary}>
                        {log.changeSummary}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Audit Pagination */}
          <div className="p-3 bg-slate-50/60 border-t border-slate-200 flex items-center justify-between text-xs">
            <button
              onClick={() => setAuditPage(p => Math.max(1, p - 1))}
              disabled={auditPage === 1}
              className="flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
            </button>

            <span className="text-slate-500 font-mono">
              Halaman {auditPage} dari {totalAuditPages}
            </span>

            <button
              onClick={() => setAuditPage(p => Math.min(totalAuditPages, p + 1))}
              disabled={auditPage >= totalAuditPages}
              className="flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Selanjutnya <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Add New Record (with Business Rule 1 validations) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveNew} className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-teal-600" />
                Tambah Entri Capaian Indikator Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {formValidationError && (
              <div className="mx-4 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{formValidationError}</span>
              </div>
            )}

            <div className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Puskesmas Pelapor <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formPkmId}
                  disabled={currentUser.role === 'PUSKESMAS'}
                  onChange={(e) => setFormPkmId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                >
                  {puskesmasList.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Indikator Kesehatan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formIndicatorId}
                  onChange={(e) => setFormIndicatorId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                >
                  {indicators.map(i => (
                    <option key={i.id} value={i.id}>[{i.code}] {i.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Kelompok Umur (opsional)</label>
                <select
                  value={formAgeBracket}
                  onChange={(e) => setFormAgeBracket(e.target.value as StandardAgeBracket | '')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                >
                  <option value="">Tidak ada data umur</option>
                  {STANDARD_AGE_BRACKETS.map(group => (
                    <option key={group.bracket} value={group.bracket}>{group.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Tahun <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="2020"
                    max="2030"
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Bulan Pelaporan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formMonth}
                    onChange={(e) => setFormMonth(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  >
                    {MONTH_NAMES_ID.map((name, idx) => (
                      <option key={idx + 1} value={idx + 1}>{idx + 1} - {name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Kelompok Umur (opsional)</label>
                <select
                  value={formAgeBracket}
                  onChange={(e) => setFormAgeBracket(e.target.value as StandardAgeBracket | '')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                >
                  <option value="">Tidak ada data umur</option>
                  {STANDARD_AGE_BRACKETS.map(group => (
                    <option key={group.bracket} value={group.bracket}>{group.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Numerator (Realisasi) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formNumerator}
                    onChange={(e) => setFormNumerator(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Denominator (Sasaran) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formDenominator}
                    onChange={(e) => setFormDenominator(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>

              {/* Calculated Rate Preview (Business Rule 3) */}
              <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-between text-xs">
                <span className="text-teal-800 font-medium">Kalkulasi Capaian Otomatis:</span>
                <span className="font-mono font-bold text-teal-900 text-sm">
                  {formNumerator.trim() !== '' && Number.isFinite(Number(formNumerator)) &&
                    formDenominator.trim() !== '' && Number.isFinite(Number(formDenominator)) && Number(formDenominator) > 0
                    ? `${((Number(formNumerator) / Number(formDenominator)) * 100).toFixed(1)}%`
                    : '-'}
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Catatan hasil verifikasi atau sumber data Posyandu..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
              >
                Simpan & Validasi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Edit Record */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveEdit} className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Perbarui Data Capaian (Audit Log Aktif)
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  {editingRecord.puskesmasName} · {editingRecord.indicatorName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {formValidationError && (
              <div className="mx-4 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{formValidationError}</span>
              </div>
            )}

            <div className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-400 block">Periode Laporan:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {editingRecord.year} - Bulan {editingRecord.month}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Capaian Saat Ini:</span>
                  <span className="font-mono font-bold text-teal-700">
                    {editingRecord.achievementRate}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Numerator (Realisasi) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formNumerator}
                    onChange={(e) => setFormNumerator(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Denominator (Sasaran) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formDenominator}
                    onChange={(e) => setFormDenominator(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-between text-xs">
                <span className="text-teal-800 font-medium">Kalkulasi Capaian Baru:</span>
                <span className="font-mono font-bold text-teal-900 text-sm">
                  {formNumerator.trim() !== '' && Number.isFinite(Number(formNumerator)) &&
                    formDenominator.trim() !== '' && Number.isFinite(Number(formDenominator)) && Number(formDenominator) > 0
                    ? `${((Number(formNumerator) / Number(formDenominator)) * 100).toFixed(1)}%`
                    : '-'}
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Catatan Koreksi</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Alasan perubahan atau rujukan verifikasi data..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Delete Confirmation */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full border border-slate-200 p-5 text-center">
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Konfirmasi Hapus Data Capaian?
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Anda akan menghapus data <strong className="text-slate-800">{deletingRecord.indicatorName}</strong> untuk <strong>{deletingRecord.puskesmasName}</strong> periode {deletingRecord.year} Bln {deletingRecord.month}. Tindakan ini akan dicatat dalam Audit Trail.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setDeletingRecord(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
