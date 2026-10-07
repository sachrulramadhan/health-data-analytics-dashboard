import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  AlertTriangle,
  Award,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { useHealthData } from '../../context/HealthDataContext';
import { exportHealthDataToExcel, exportToCSV } from '../../utils/excelHelper';
import { 
  computeSummaryStats, 
  findCriticalIndicators, 
  formatNumberID, 
  getIndicatorSPMStatus 
} from '../../utils/healthCalculations';

export const ReportsExportView: React.FC = () => {
  const { 
    filteredRecords, 
    indicators, 
    puskesmasList, 
    selectedYear, 
    selectedMonth, 
    selectedPuskesmasId, 
    currentUser 
  } = useHealthData();

  const [reportTitle, setReportTitle] = useState('Laporan Kinerja Standar Pelayanan Minimal (SPM) Kesehatan');
  const [reportNumber, setReportNumber] = useState(`440/${new Date().getFullYear()}/DINKES-SPM/04`);
  const [signatoryName, setSignatoryName] = useState('Dr. Farhan Santoso, M.Kes');
  const [signatoryNip, setSignatoryNip] = useState('NIP. 19780512 200312 1 004');
  const [signatoryTitle, setSignatoryTitle] = useState('Kepala Dinas Kesehatan');

  // Flow 5 Report Generator Parameters
  const [reportYear, setReportYear] = useState<number | 'ALL'>(selectedYear);
  const [reportMonth, setReportMonth] = useState<number | 'ALL'>(selectedMonth);
  const [reportPkmId, setReportPkmId] = useState<string | 'ALL'>(selectedPuskesmasId);
  const [reportIndicatorId, setReportIndicatorId] = useState<string | 'ALL'>('ALL');
  const [isGenerated, setIsGenerated] = useState(true);

  // Filter records based on report parameters
  const reportRecords = React.useMemo(() => {
    return filteredRecords.filter(r => {
      if (reportYear !== 'ALL' && r.year !== reportYear) return false;
      if (reportMonth !== 'ALL' && r.month !== reportMonth) return false;
      if (reportPkmId !== 'ALL' && r.puskesmasId !== reportPkmId) return false;
      if (reportIndicatorId !== 'ALL' && r.indicatorId !== reportIndicatorId) return false;
      return true;
    });
  }, [filteredRecords, reportYear, reportMonth, reportPkmId, reportIndicatorId]);

  // Compute stats for current report
  const stats = React.useMemo(() => {
    return computeSummaryStats(reportRecords, indicators, puskesmasList);
  }, [reportRecords, indicators, puskesmasList]);

  const criticalItems = React.useMemo(() => {
    return findCriticalIndicators(reportRecords, indicators);
  }, [reportRecords, indicators]);

  // Export to Excel
  const handleExportExcel = () => {
    const meta = {
      year: reportYear,
      month: reportMonth,
      pkmFilter: reportPkmId,
    };
    exportHealthDataToExcel(reportRecords, indicators, puskesmasList, meta);
  };

  // Export to CSV (Dashboard Specification 7)
  const handleExportCSV = () => {
    exportToCSV(reportRecords, `Laporan_Eksekutif_${reportYear}_${reportMonth}.csv`);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleGenerateReport = () => {
    setIsGenerated(true);
  };

  return (
    <div className="space-y-6">
      {/* Non-Printable Header & Action Controls */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Laporan Eksekutif & Ekspor Data
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pilih parameter laporan, generate pratinjau resmi, dan ekspor ke PDF, Excel (.xlsx), atau CSV.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-teal-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            onClick={handlePrintPdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Export PDF / Cetak</span>
          </button>
        </div>
      </div>

      {/* User Flow 5: Parameter Generator Box */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Parameter Pembuatan Laporan (User Flow 5):
          </span>
          <span className="text-[11px] text-teal-700 font-mono font-medium">
            {reportRecords.length} Catatan Data
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-slate-500 block mb-1 font-medium">Pilih Periode Tahun:</label>
            <select
              value={reportYear}
              onChange={(e) => setReportYear(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800"
            >
              <option value="ALL">Semua Tahun</option>
              <option value="2026">Tahun 2026</option>
              <option value="2025">Tahun 2025</option>
              <option value="2024">Tahun 2024</option>
            </select>
          </div>

          <div>
            <label className="text-slate-500 block mb-1 font-medium">Pilih Bulan:</label>
            <select
              value={reportMonth}
              onChange={(e) => setReportMonth(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800"
            >
              <option value="ALL">Semua Bulan (Tahunan)</option>
              <option value="1">Bulan 1 (Januari)</option>
              <option value="2">Bulan 2 (Februari)</option>
              <option value="3">Bulan 3 (Maret)</option>
              <option value="4">Bulan 4 (April)</option>
              <option value="5">Bulan 5 (Mei)</option>
              <option value="6">Bulan 6 (Juni)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-500 block mb-1 font-medium">Pilih Wilayah (Puskesmas):</label>
            <select
              value={reportPkmId}
              onChange={(e) => setReportPkmId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800"
            >
              <option value="ALL">Semua Puskesmas (Kabupaten)</option>
              {puskesmasList.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-500 block mb-1 font-medium">Pilih Indikator:</label>
            <select
              value={reportIndicatorId}
              onChange={(e) => setReportIndicatorId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 truncate"
            >
              <option value="ALL">Semua Indikator SPM ({indicators.length})</option>
              {indicators.map(i => (
                <option key={i.id} value={i.id}>[{i.code}] {i.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <div className="text-[11px] text-slate-500">
            Pratinjau otomatis disesuaikan secara dinamis.
          </div>
          <button
            onClick={handleGenerateReport}
            className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* Non-Printable Signature Customizer */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <h3 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wide">
          Konfigurasi Kepala Surat & Pejabat Penandatangan:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="text-slate-500 block mb-1">Judul Dokumen:</label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-medium text-slate-800"
            />
          </div>
          <div>
            <label className="text-slate-500 block mb-1">Nomor Registrasi Laporan:</label>
            <input
              type="text"
              value={reportNumber}
              onChange={(e) => setReportNumber(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-mono text-slate-800"
            />
          </div>
          <div>
            <label className="text-slate-500 block mb-1">Pejabat Penandatangan:</label>
            <input
              type="text"
              value={signatoryName}
              onChange={(e) => setSignatoryName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-medium text-slate-800"
            />
          </div>
        </div>
      </div>


      {/* Printable Official Document Preview Container */}
      <div className="bg-white border border-slate-300 rounded-xl p-8 shadow-sm text-slate-900 max-w-4xl mx-auto space-y-6">
        {/* Kop Surat Resmi */}
        <div className="border-b-2 border-slate-900 pb-4 text-center space-y-0.5">
          <div className="text-xs uppercase font-semibold tracking-wider text-slate-700">
            Pemerintah Kabupaten / Kota
          </div>
          <h2 className="text-base font-extrabold uppercase tracking-tight text-slate-900">
            DINAS KESEHATAN KABUPATEN
          </h2>
          <p className="text-xs text-slate-600">
            Jalan Kesehatan No. 01, Kompleks Perkantoran Pemda · Telp (021) 876-0000 · Email: dinkes@kab.go.id
          </p>
          <div className="text-[11px] font-mono text-slate-500 pt-1">
            Nomor: {reportNumber}
          </div>
        </div>

        {/* Report Title */}
        <div className="text-center space-y-1">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">
            {reportTitle}
          </h3>
          <div className="text-xs text-slate-600">
            Periode Evaluasi: Tahun {selectedYear} {selectedMonth !== 'ALL' ? `· Bulan ke-${selectedMonth}` : '· Rekap Tahunan'}
          </div>
        </div>

        {/* Executive Summary Highlights */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
          <h4 className="font-bold text-slate-900 uppercase tracking-wide text-[11px]">
            I. Ringkasan Eksekutif Kinerja Wilayah
          </h4>
          <p className="text-slate-700 leading-relaxed">
            Berdasarkan data laporan terverifikasi dari <strong>{puskesmasList.length} Puskesmas</strong>, rata-rata capaian pemenuhan Standar Pelayanan Minimal (SPM) bidang kesehatan pada periode ini tercatat sebesar <strong>{stats.averageAchievement}%</strong>.
            Sebanyak <strong>{stats.totalTargetAchieved} indikator</strong> telah mencapai target standar nasional, sementara terdapat <strong>{criticalItems.length} indikator</strong> yang memerlukan perhatian dan akselerasi intervensi intensif.
          </p>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 font-mono text-[11px]">
            <div>
              <span className="text-slate-500 block">Rata-rata SPM:</span>
              <strong className="text-teal-800 text-sm">{stats.averageAchievement}%</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Sasaran Terlayani:</span>
              <strong className="text-slate-900">{formatNumberID(stats.totalTargetNumerator)} jiwa</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Status Kritis:</span>
              <strong className="text-rose-700">{criticalItems.length} Indikator</strong>
            </div>
          </div>
        </div>

        {/* SPM Indicator Recap Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            II. Tabel Rekapitulasi Capaian Indikator SPM Kesehatan
          </h4>
          <div className="overflow-x-auto border border-slate-200 rounded-md">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-2.5">No</th>
                  <th className="py-2 px-2.5">Kode</th>
                  <th className="py-2 px-2.5">Nama Indikator Pelayanan</th>
                  <th className="py-2 px-2.5 text-right">Target</th>
                  <th className="py-2 px-2.5 text-right">Realisasi</th>
                  <th className="py-2 px-2.5 text-right">Sasaran</th>
                  <th className="py-2 px-2.5 text-right">Capaian</th>
                  <th className="py-2 px-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 font-medium">
                      Tidak ada data untuk filter yang dipilih.
                    </td>
                  </tr>
                ) : (
                  indicators.map((ind, index) => {
                    const recs = reportRecords.filter(r => r.indicatorId === ind.id);
                    const hasData = recs.length > 0;
                    const num = recs.reduce((s, r) => s + r.numerator, 0);
                    const den = recs.reduce((s, r) => s + r.denominator, 0);
                    const rate = hasData && den > 0 ? Number(((num / den) * 100).toFixed(1)) : null;
                    const status = rate !== null ? getIndicatorSPMStatus(ind, rate) : null;

                    return (
                      <tr key={ind.id} className="hover:bg-slate-50/50">
                        <td className="py-1.5 px-2.5 text-slate-400 font-mono">{index + 1}</td>
                        <td className="py-1.5 px-2.5 font-mono text-slate-600">{ind.code}</td>
                        <td className="py-1.5 px-2.5 font-medium text-slate-800">{ind.name}</td>
                        <td className="py-1.5 px-2.5 text-right font-mono">{ind.spmTarget}{ind.unit}</td>
                        <td className="py-1.5 px-2.5 text-right font-mono">{hasData ? formatNumberID(num) : '-'}</td>
                        <td className="py-1.5 px-2.5 text-right font-mono">{hasData ? formatNumberID(den) : '-'}</td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">
                          {rate !== null ? `${rate}%` : 'N/A'}
                        </td>
                        <td className="py-1.5 px-2.5 text-center">
                          {status ? (
                            <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                              status === 'TERCAPAI'
                                ? 'text-emerald-800 bg-emerald-50'
                                : status === 'WASPADA'
                                ? 'text-amber-800 bg-amber-50'
                                : 'text-rose-800 bg-rose-50'
                            }`}>
                              {status}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Priority Action Notes */}
        <div className="space-y-2 text-xs">
          <h4 className="font-bold text-slate-900 uppercase tracking-wide text-[11px]">
            III. Catatan & Arahan Tindak Lanjut
          </h4>
          <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1">
            <li>
              Puskesmas dengan capaian indikator di bawah 80% diinstruksikan melakukan validasi data berkala dan sweeping lapangan bersama kader Posyandu.
            </li>
            <li>
              Penguatan rujukan laboratorium cepat untuk penemuan terduga TBC dan penyuluhan gizi spesifik protein hewani untuk penanganan balita stunting.
            </li>
            <li>
              Laporan pertanggungjawaban berikutnya diserahkan paling lambat tanggal 10 bulan berikutnya.
            </li>
          </ol>
        </div>

        {/* Signatures */}
        <div className="pt-8 flex justify-between items-end text-xs">
          <div>
            <div className="text-slate-500">Mengetahui,</div>
            <div className="font-semibold text-slate-700 mt-1">Petugas Pengelola Data & SIM-Kes</div>
            <div className="h-16"></div>
            <div className="font-bold text-slate-900">{currentUser.name}</div>
            <div className="text-[11px] text-slate-500">{currentUser.title}</div>
          </div>

          <div className="text-right">
            <div className="text-slate-500">Dikeluarkan pada: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div className="font-semibold text-slate-700 mt-1">{signatoryTitle}</div>
            <div className="h-16"></div>
            <div className="font-bold text-slate-900 underline">{signatoryName}</div>
            <div className="text-[11px] text-slate-500 font-mono">{signatoryNip}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
