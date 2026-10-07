import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck, 
  RefreshCw, 
  History,
  Lock,
  ArrowRight
} from 'lucide-react';
import { useHealthData } from '../../context/HealthDataContext';
import { 
  downloadOfficialExcelTemplate, 
  parseUploadedExcel, 
  ExcelImportResult 
} from '../../utils/excelHelper';
import * as XLSX from 'xlsx';

export const ExcelImportView: React.FC<{ setActiveView: (view: string) => void }> = ({ setActiveView }) => {
  const { 
    indicators, 
    puskesmasList, 
    currentUser, 
    records,
    importRecordsBatch, 
    importLogs 
  } = useHealthData();

  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ExcelImportResult | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isReadOnly = currentUser.role === 'READ_ONLY' || currentUser.role === 'VIEWER';

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportSuccessMessage(null);

    try {
      const result = await parseUploadedExcel(file, indicators, puskesmasList, currentUser.name, records);
      setImportResult(result);
    } catch (err: any) {
      alert(`Gagal memproses file Excel: ${err?.message || 'Format tidak valid'}`);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Generate and load synthetic sample Excel file for immediate testing
  const handleLoadSampleExcel = async () => {
    setIsProcessing(true);
    setImportSuccessMessage(null);

    // Create a mock File object with realistic Excel data
    const wb = XLSX.utils.book_new();
    const sampleData = [
      {
        'Kode Puskesmas': 'P320101',
        'Nama Puskesmas': 'Puskesmas Melati',
        'Tahun': 2026,
        'Bulan (1-12)': 4,
        'Kode Indikator': 'K4-BUMIL',
        'Nama Indikator': 'Cakupan Kunjungan Ibu Hamil K4/K6',
        'Numerator (Realisasi)': 345,
        'Denominator (Sasaran)': 370,
        'Catatan': 'Laporan Terverifikasi Bidan Koordinator',
      },
      {
        'Kode Puskesmas': 'P320101',
        'Nama Puskesmas': 'Puskesmas Melati',
        'Tahun': 2026,
        'Bulan (1-12)': 4,
        'Kode Indikator': 'IDL-BALITA',
        'Nama Indikator': 'Cakupan Imunisasi Dasar Lengkap (IDL) Bayi',
        'Numerator (Realisasi)': 398,
        'Denominator (Sasaran)': 415,
        'Catatan': 'Pekan Imunisasi Dunia Berjalan Baik',
      },
      {
        'Kode Puskesmas': 'P320103',
        'Nama Puskesmas': 'Puskesmas Dahlia Sehat',
        'Tahun': 2026,
        'Bulan (1-12)': 4,
        'Kode Indikator': 'STUNTING-PREV',
        'Nama Indikator': 'Prevalensi Balita Stunting (Pendek & Sangat Pendek)',
        'Numerator (Realisasi)': 280,
        'Denominator (Sasaran)': 1750,
        'Catatan': 'Pemberian PMT telur mulai menunjukkan penurunan kasus',
      },
      {
        'Kode Puskesmas': 'P320104',
        'Nama Puskesmas': 'Puskesmas Harapan Baru',
        'Tahun': 2026,
        'Bulan (1-12)': 4,
        'Kode Indikator': 'TB-TEMUKAN',
        'Nama Indikator': 'Penemuan Kasus Tuberkulosis (Treatment Coverage)',
        'Numerator (Realisasi)': 132,
        'Denominator (Sasaran)': 145,
        'Catatan': 'Hasil kontak tracing aktif kader TB',
      },
      {
        'Kode Puskesmas': 'P320105',
        'Nama Puskesmas': 'Puskesmas Sentosa',
        'Tahun': 2026,
        'Bulan (1-12)': 4,
        'Kode Indikator': 'SKRIN-HT',
        'Nama Indikator': 'Pelayanan Kesehatan Penderita Hipertensi Sesuai Standar',
        'Numerator (Realisasi)': 1220,
        'Denominator (Sasaran)': 1420,
        'Catatan': 'Skrining di posbindu perkantoran',
      },
      // Intentionally include 1 invalid row to demonstrate validation safety
      {
        'Kode Puskesmas': 'P320999', // Unknown puskesmas
        'Nama Puskesmas': 'Puskesmas Luar Wilayah',
        'Tahun': 2026,
        'Bulan (1-12)': 4,
        'Kode Indikator': 'UNKNOWN-IND',
        'Nama Indikator': 'Indikator Tidak Terdaftar',
        'Numerator (Realisasi)': 50,
        'Denominator (Sasaran)': 100,
        'Catatan': 'Baris uji validasi sistem',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(wb, ws, 'Entri_Data');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const file = new File([wbout], 'Laporan_Puskesmas_Sample_Uji.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const result = await parseUploadedExcel(file, indicators, puskesmasList, currentUser.name, records);
    setImportResult(result);
    setIsProcessing(false);
  };

  // Confirm committing valid records to data context
  const handleCommitImport = () => {
    if (!importResult || importResult.validRecords.length === 0) return;

    importRecordsBatch(importResult.validRecords, {
      fileName: importResult.fileName,
      importedAt: new Date().toISOString(),
      totalRows: importResult.totalRows,
      validRows: importResult.validRecords.length,
      invalidRows: importResult.invalidRows.length,
      status: importResult.invalidRows.length > 0 ? 'WARNING' : 'SUCCESS',
      errors: importResult.invalidRows.flatMap(r => r.errors),
    });

    setImportSuccessMessage(
      `Berhasil mengimpor ${importResult.validRecords.length} data capaian ke sistem!`
    );
    setImportResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Import Data Laporan Excel (.xlsx)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Unggah berkas laporan standar Puskesmas, validasi otomatis numerik dan kode indikator SPM.
          </p>
        </div>

        <button
          onClick={() => downloadOfficialExcelTemplate(indicators, puskesmasList)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Unduh Template Excel Resmi (.xlsx)</span>
        </button>
      </div>

      {/* Success Banner */}
      {importSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{importSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActiveView('dashboard')}
            className="font-bold underline hover:text-emerald-900 flex items-center gap-1"
          >
            Buka Dasbor <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Upload Box & Sample Action */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        {isReadOnly ? (
          <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            <Lock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-600">Fitur Import Dinonaktifkan untuk Akun Baca Saja</p>
            <p className="mt-1">Ganti peran ke Pengelola Data atau Administrator untuk mengimpor berkas Excel.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-teal-200 hover:border-teal-400 bg-teal-50/20 hover:bg-teal-50/40 rounded-xl p-8 text-center cursor-pointer transition-all"
            >
              <UploadCloud className="w-10 h-10 text-teal-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">
                Pilih Berkas Excel Laporan Puskesmas
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Mendukung format .xlsx, .xls, atau .csv. Berkas akan divalidasi berdasarkan kode Puskesmas dan indikator SPM.
              </p>
              <button
                type="button"
                className="mt-4 px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
              >
                Pilih File dari Komputer
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Quick Demo Test Button */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-slate-600">
                Ingin mencoba tanpa mengunggah file sendiri?
              </span>
              <button
                onClick={handleLoadSampleExcel}
                disabled={isProcessing}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>Muat Contoh Berkas Excel Pengujian</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Validation Result Preview Card */}
      {importResult && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-mono text-slate-400">Hasil Pemindaian Excel:</span>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                {importResult.fileName} ({importResult.totalRows} Baris Terbaca)
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{importResult.validRecords.length} Baris Valid</span>
              </div>

              {importResult.invalidRows.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-rose-700 font-semibold bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{importResult.invalidRows.length} Baris Tidak Valid</span>
                </div>
              )}
            </div>
          </div>

          {/* Error warnings if invalid rows exist */}
          {importResult.invalidRows.length > 0 && (
            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-lg text-xs space-y-1">
              <span className="font-bold text-rose-900 block">
                Catatan Validasi ({importResult.invalidRows.length} baris dilewati):
              </span>
              <ul className="list-disc list-inside text-rose-800 space-y-0.5">
                {importResult.invalidRows.map((inv, idx) => (
                  <li key={idx}>
                    Baris #{inv.rowNumber}: {inv.errors.join('; ')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Valid rows preview table */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 mb-2">
              Pratinjau Data Valid yang Siap Disimpan:
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Puskesmas</th>
                    <th className="py-2 px-3">Periode</th>
                    <th className="py-2 px-3">Indikator</th>
                    <th className="py-2 px-3 text-right">Realisasi</th>
                    <th className="py-2 px-3 text-right">Sasaran</th>
                    <th className="py-2 px-3 text-right">Capaian (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importResult.validRecords.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/60">
                      <td className="py-2 px-3 font-medium text-slate-800">{r.puskesmasName}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">{r.year} - Bln {r.month}</td>
                      <td className="py-2 px-3 font-medium text-slate-800">{r.indicatorName}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-700">{r.numerator}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-700">{r.denominator}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-teal-700">{r.achievementRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Commit button */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              onClick={() => setImportResult(null)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
            >
              Batalkan
            </button>
            <button
              onClick={handleCommitImport}
              disabled={importResult.validRecords.length === 0}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs disabled:opacity-50"
            >
              Simpan {importResult.validRecords.length} Data ke Sistem
            </button>
          </div>
        </div>
      )}

      {/* Import History Logs Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">
              Riwayat Log Import Berkas
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {importLogs.length} Aktivitas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Nama Berkas</th>
                <th className="py-2.5 px-3">Waktu Import</th>
                <th className="py-2.5 px-3 text-right">Total Baris</th>
                <th className="py-2.5 px-3 text-right">Valid</th>
                <th className="py-2.5 px-3 text-right">Ditolak</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {importLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-3 font-medium text-slate-800 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-teal-600" />
                    {log.fileName}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono">
                    {log.importedAt.split('T')[0]} {log.importedAt.split('T')[1]?.slice(0, 5)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">{log.totalRows}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-semibold">{log.validRows}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-semibold">{log.invalidRows}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                      log.status === 'SUCCESS'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {log.status === 'SUCCESS' ? 'Sukses' : 'Peringatan'}
                    </span>
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
