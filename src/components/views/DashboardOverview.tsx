import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  ChevronRight, 
  ShieldAlert, 
  BarChart3, 
  Building, 
  Eye, 
  Info,
  FileSpreadsheet,
  Download,
  Printer,
  Sparkles,
  PieChart as PieChartIcon,
  Award,
  AlertCircle,
  HelpCircle,
  X,
  FileText
} from 'lucide-react';
import { useHealthData } from '../../context/HealthDataContext';
import { 
  computeSummaryStats, 
  findCriticalIndicators, 
  getIndicatorSPMStatus, 
  formatNumberID, 
  formatPercentage,
  generateAutomaticInsights,
  computeRankings,
  formatDataValue
} from '../../utils/healthCalculations';
import { HEALTH_CATEGORIES, MONTH_NAMES_SHORT_ID, MONTH_NAMES_ID } from '../../data/mockData';
import { HealthIndicator, Puskesmas, IndicatorDataRecord } from '../../types/health';
import { exportHealthDataToExcel, exportToCSV } from '../../utils/excelHelper';

interface DashboardOverviewProps {
  setActiveView: (view: string) => void;
  setSelectedIndicatorId?: (id: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ 
  setActiveView,
}) => {
  const { 
    filteredRecords, 
    indicators, 
    puskesmasList, 
    records,
    selectedYear,
    selectedMonth,
    selectedPuskesmasId,
    selectedKecamatan,
    setSelectedYear,
    setSelectedMonth,
    setSelectedPuskesmasId,
    setSelectedKecamatan,
    setSelectedCategory,
    setSelectedAgeGroup,
    setSelectedAgeBracket,
    setSelectedIndicatorId: setGlobalIndicatorId,
  } = useHealthData();

  const [activeTabChart, setActiveTabChart] = useState<'KATEGORI' | 'PUSKESMAS'>('KATEGORI');
  
  // Drill-down Modal State (Dashboard Spec 6: Dashboard -> Klik indikator -> Detail indikator -> Puskesmas -> Detail data)
  const [drilldownIndicator, setDrilldownIndicator] = useState<HealthIndicator | null>(null);
  const [drilldownPuskesmas, setDrilldownPuskesmas] = useState<Puskesmas | null>(null);

  // Compute stats on active filtered records
  const stats = useMemo(() => {
    return computeSummaryStats(filteredRecords, indicators, puskesmasList);
  }, [filteredRecords, indicators, puskesmasList]);

  // Compute critical alert indicators
  const criticalAlerts = useMemo(() => {
    return findCriticalIndicators(filteredRecords, indicators);
  }, [filteredRecords, indicators]);

  // Compute automated data-driven insights (Dashboard Spec 5)
  const automatedInsights = useMemo(() => {
    return generateAutomaticInsights(filteredRecords, indicators, puskesmasList);
  }, [filteredRecords, indicators, puskesmasList]);

  // Compute performance rankings (Dashboard Spec 4: Ranking)
  const rankings = useMemo(() => {
    return computeRankings(filteredRecords, indicators, puskesmasList);
  }, [filteredRecords, indicators, puskesmasList]);

  // Category aggregate calculation
  const categoryAggregates = useMemo(() => {
    return HEALTH_CATEGORIES.map(cat => {
      const catRecords = filteredRecords.filter(r => r.category === cat.id);
      if (catRecords.length === 0) return { ...cat, avgRate: null, count: 0, target: 90 };

      const sum = catRecords.reduce((acc, curr) => acc + curr.achievementRate, 0);
      const avg = Number((sum / catRecords.length).toFixed(1));
      return {
        ...cat,
        avgRate: avg,
        count: catRecords.length,
        target: 90,
      };
    });
  }, [filteredRecords]);

  // Puskesmas ranking calculation
  const puskesmasRankings = useMemo(() => {
    const list = puskesmasList.map(pkm => {
      const pkmRecs = filteredRecords.filter(r => r.puskesmasId === pkm.id);
      if (pkmRecs.length === 0) return { ...pkm, avgRate: null, recordCount: 0 };

      const sum = pkmRecs.reduce((acc, curr) => acc + curr.achievementRate, 0);
      const avg = Number((sum / pkmRecs.length).toFixed(1));
      return {
        ...pkm,
        avgRate: avg,
        recordCount: pkmRecs.length,
      };
    });

    return list.sort((a, b) => ((b.avgRate ?? -1) - (a.avgRate ?? -1)));
  }, [filteredRecords, puskesmasList]);

  // 12-month trend calculation for current year
  const monthlyTrends = useMemo(() => {
    const currentYr = typeof selectedYear === 'number' ? selectedYear : 2025;
    const yearRecs = records.filter(r => r.year === currentYr);

    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const mRecs = yearRecs.filter(r => r.month === m);
      if (mRecs.length === 0) return { month: m, monthName: MONTH_NAMES_SHORT_ID[i], avgRate: null };
      const avg = Number((mRecs.reduce((sum, r) => sum + r.achievementRate, 0) / mRecs.length).toFixed(1));
      return {
        month: m,
        monthName: MONTH_NAMES_SHORT_ID[i],
        avgRate: avg,
      };
    });
  }, [records, selectedYear]);

  // Indicator priority highlights
  const indicatorHighlights = useMemo(() => {
    return indicators.map(ind => {
      const recs = filteredRecords.filter(r => r.indicatorId === ind.id);
      const hasData = recs.length > 0;
      const avgRate = hasData 
        ? Number((recs.reduce((s, r) => s + r.achievementRate, 0) / recs.length).toFixed(1))
        : null;
      const status = avgRate !== null ? getIndicatorSPMStatus(ind, avgRate) : null;
      const totalNum = recs.reduce((s, r) => s + r.numerator, 0);
      const totalDen = recs.reduce((s, r) => s + r.denominator, 0);

      return {
        indicator: ind,
        hasData,
        avgRate,
        status,
        totalNum,
        totalDen,
      };
    });
  }, [indicators, filteredRecords]);

  // Export handlers (Dashboard Spec 7: PDF, Excel, CSV)
  const handleExportExcel = () => {
    exportHealthDataToExcel(filteredRecords, indicators, puskesmasList, {
      year: selectedYear,
      month: selectedMonth === 'ALL' ? 'Tahunan' : selectedMonth,
      pkmFilter: selectedPuskesmasId === 'ALL' ? 'Semua Puskesmas' : selectedPuskesmasId,
    });
  };

  const handleExportCSV = () => {
    exportToCSV(filteredRecords, `Dashboard_Health_Data_${selectedYear}_${selectedMonth}.csv`);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const resetAllFilters = () => {
    setSelectedYear(2025);
    setSelectedMonth('ALL');
    setSelectedPuskesmasId('ALL');
    setSelectedKecamatan('ALL');
    setSelectedCategory('ALL');
    setSelectedAgeGroup('ALL');
    setSelectedAgeBracket('ALL');
    if (setGlobalIndicatorId) setGlobalIndicatorId('ALL');
  };

  // Active Puskesmas count in filtered context
  const activePuskesmasCount = useMemo(() => {
    if (selectedPuskesmasId !== 'ALL') return 1;
    if (selectedKecamatan !== 'ALL') {
      return puskesmasList.filter(p => p.district === selectedKecamatan).length;
    }
    return puskesmasList.length;
  }, [selectedPuskesmasId, selectedKecamatan, puskesmasList]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Ringkasan Eksekutif Indikator Kesehatan
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pemantauan agregat capaian Standar Pelayanan Minimal (SPM) faskes tingkat pertama
          </p>
        </div>

        {/* Specification 7: Quick Export Buttons (PDF, Excel, CSV) */}
        <div className="flex items-center gap-2 self-start sm:self-auto no-print">
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
            title="Cetak tampilan dashboard atau simpan sebagai PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>PDF / Cetak</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg shadow-xs transition-colors"
            title="Ekspor data aktif ke spreadsheet Excel multi-sheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ekspor Excel</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg shadow-xs transition-colors"
            title="Ekspor data terfilter ke format CSV"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Business Rule 5: Empty Data Handling */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white border border-amber-200 rounded-xl p-8 text-center my-6 shadow-xs">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-amber-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Tidak ada data untuk filter yang dipilih.</h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
            Data tidak ditemukan untuk kombinasi filter tahun, periode, Puskesmas, atau kategori saat ini. Sistem mematuhi aturan bisnis dan tidak menampilkan nilai 0 sebagai pengganti data kosong tanpa verifikasi.
          </p>
          <div className="mt-4">
            <button
              onClick={resetAllFilters}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
            >
              Reset Semua Filter ke Bawaan
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* DASHBOARD SPECIFICATION 2: 6 Required Primary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* KPI 1: Total Puskesmas */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Total Puskesmas</span>
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Building className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-slate-900 font-mono">
                  {activePuskesmasCount}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {selectedPuskesmasId === 'ALL' ? 'Faskes Terpantau' : 'Puskesmas Terpilih'}
                </div>
              </div>
            </div>

            {/* KPI 2: Total Indikator */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Total Indikator</span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-slate-900 font-mono">
                  {indicators.length}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  Indikator SPM Resmi
                </div>
              </div>
            </div>

            {/* KPI 3: Total Data */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Total Data</span>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-slate-900 font-mono">
                  {formatNumberID(filteredRecords.length)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  Baris Capaian Terfilter
                </div>
              </div>
            </div>

            {/* KPI 4: Total Kasus / Kejadian */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Total Kasus/Kejadian</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-emerald-800 font-mono truncate">
                  {formatNumberID(stats.totalTargetNumerator)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  Realisasi / Pasien Terlayani
                </div>
              </div>
            </div>

            {/* KPI 5: Persentase Indikator */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Persentase Indikator</span>
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-slate-900 font-mono">
                  {formatPercentage(stats.averageAchievement)}
                </div>
                <div className="text-[10px] text-teal-600 font-medium mt-0.5 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> Rata-rata Capaian SPM
                </div>
              </div>
            </div>

            {/* KPI 6: Indikator Butuh Perhatian */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Perlu Perhatian</span>
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-rose-600 font-mono">
                  {criticalAlerts.length}
                </div>
                <div className="text-[10px] text-rose-600 font-medium mt-0.5 truncate">
                  Status Kritis / Dibawah SPM
                </div>
              </div>
            </div>
          </div>

          {/* DASHBOARD SPECIFICATION 5: Automated Insights Panel (Berbasis Data Aktual) */}
          {automatedInsights.length > 0 && (
            <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm border border-slate-800">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-bold tracking-wide uppercase text-teal-300">
                    Insight Otomatis Berbasis Data Aktual
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">Dihitung otomatis tanpa asumsi</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {automatedInsights.map((insight) => (
                  <div 
                    key={insight.id}
                    className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-white truncate">
                          {insight.title}
                        </span>
                        {insight.metricLabel && (
                          <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            insight.severity === 'success' 
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : insight.severity === 'danger'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : 'bg-teal-950 text-teal-400 border border-teal-800'
                          }`}>
                            {insight.metricLabel}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {insight.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DASHBOARD SPECIFICATION 4: Rankings Block (Top & Bottom Puskesmas, Tertinggi & Terendah Indikator) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Top Puskesmas */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600" /> Top Puskesmas
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Tertinggi
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {rankings.topPuskesmas.length > 0 ? (
                  rankings.topPuskesmas.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-4 text-slate-400 font-mono font-semibold">#{idx + 1}</span>
                        <span className="font-medium text-slate-800 truncate">{p.name}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-600 ml-2">{p.score}%</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">Tidak ada data</span>
                )}
              </div>
            </div>

            {/* Bottom Puskesmas */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Bottom Puskesmas
                </span>
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                  Butuh Dukungan
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {rankings.bottomPuskesmas.length > 0 ? (
                  rankings.bottomPuskesmas.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-4 text-slate-400 font-mono font-semibold">#{idx + 1}</span>
                        <span className="font-medium text-slate-800 truncate">{p.name}</span>
                      </div>
                      <span className="font-mono font-bold text-amber-600 ml-2">{p.score}%</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">Tidak ada data</span>
                )}
              </div>
            </div>

            {/* Indikator Tertinggi */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" /> Indikator Tertinggi
                </span>
                <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                  Optimal
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {rankings.highestIndicators.length > 0 ? (
                  rankings.highestIndicators.map((ind, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="truncate mr-2">
                        <div className="font-medium text-slate-800 truncate">{ind.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{ind.code}</div>
                      </div>
                      <span className="font-mono font-bold text-teal-700 shrink-0">{ind.rate}%</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">Tidak ada data</span>
                )}
              </div>
            </div>

            {/* Indikator Terendah */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-500" /> Indikator Terendah
                </span>
                <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                  Defisit
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {rankings.lowestIndicators.length > 0 ? (
                  rankings.lowestIndicators.map((ind, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="truncate mr-2">
                        <div className="font-medium text-slate-800 truncate">{ind.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{ind.code}</div>
                      </div>
                      <span className="font-mono font-bold text-rose-600 shrink-0">{ind.rate}%</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">Tidak ada data</span>
                )}
              </div>
            </div>
          </div>

          {/* Visualizations Grid: Bar Chart, Trend Chart, & Donut Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1 & 2: Bar Chart Comparison (Puskesmas vs Kategori) */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Visualisasi Bar Chart Capaian
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Membandingkan pencapaian indikator terhadap garis target SPM 90%
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                    <button
                      onClick={() => setActiveTabChart('KATEGORI')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        activeTabChart === 'KATEGORI' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Kategori Program
                    </button>
                    <button
                      onClick={() => setActiveTabChart('PUSKESMAS')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        activeTabChart === 'PUSKESMAS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Puskesmas
                    </button>
                  </div>
                </div>

                {activeTabChart === 'KATEGORI' ? (
                  <div className="mt-5 space-y-3.5">
                    {categoryAggregates.map((cat) => {
                      const isUnderTarget = cat.avgRate !== null && cat.avgRate < 85;
                      return (
                        <div key={cat.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-800">{cat.name}</span>
                            <div className="flex items-center gap-2">
                              <span className={`font-mono font-bold ${
                                cat.avgRate === null 
                                  ? 'text-slate-400' 
                                  : isUnderTarget 
                                  ? 'text-amber-600' 
                                  : 'text-teal-700'
                              }`}>
                                {cat.avgRate !== null ? `${cat.avgRate}%` : 'Belum Ada Data'}
                              </span>
                              <span className="text-[11px] text-slate-400">Target 90%</span>
                            </div>
                          </div>
                          {/* Progress bar with benchmark line at 90% */}
                          <div className="relative w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            {cat.avgRate !== null && (
                              <div
                                className="h-3 rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(100, cat.avgRate)}%`,
                                  backgroundColor: isUnderTarget ? '#d97706' : '#0d9488',
                                }}
                              />
                            )}
                            <div 
                              className="absolute top-0 bottom-0 w-0.5 bg-slate-400/80 z-10" 
                              style={{ left: '90%' }}
                              title="Batas SPM Nasional 90%"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {puskesmasRankings.map((pkm, idx) => (
                      <div key={pkm.id} className="flex items-center gap-3">
                        <span className="w-5 text-xs font-mono font-bold text-slate-400 text-right">
                          #{idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center text-xs mb-1">
                            <span className="font-medium text-slate-800 truncate">{pkm.name}</span>
                            <span className="font-mono font-bold text-slate-700">
                              {pkm.avgRate !== null ? `${pkm.avgRate}%` : 'Belum Ada Data'}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            {pkm.avgRate !== null && (
                              <div 
                                className="bg-teal-600 h-2 rounded-full"
                                style={{ width: `${Math.min(100, pkm.avgRate)}%` }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-600 inline-block"></span> Optimal (&ge;85%)
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block ml-1"></span> Waspada (&lt;85%)
                </span>
                <button
                  onClick={() => setActiveView('comparison')}
                  className="text-teal-600 hover:text-teal-700 font-semibold hover:underline flex items-center gap-1"
                >
                  Lihat Perbandingan Lengkap <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Column 3: Donut Chart Distribusi Kategori (Dashboard Spec 4) */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <PieChartIcon className="w-4 h-4 text-teal-600" /> Distribusi Kategori
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Komposisi proporsi entri data per program
                    </p>
                  </div>
                </div>

                {/* SVG Donut Chart */}
                <div className="mt-4 flex flex-col items-center">
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      {(() => {
                        const totalRecordsCount = filteredRecords.length;
                        if (totalRecordsCount === 0) return null;

                        const radius = 38;
                        const circumference = 2 * Math.PI * radius;
                        let accumulatedOffset = 0;

                        return categoryAggregates.map((cat) => {
                          const sliceShare = cat.count / totalRecordsCount;
                          const strokeDasharray = `${sliceShare * circumference} ${circumference}`;
                          const strokeDashoffset = -accumulatedOffset;
                          accumulatedOffset += sliceShare * circumference;

                          return (
                            <circle
                              key={cat.id}
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="transparent"
                              stroke={cat.color}
                              strokeWidth="16"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              className="transition-all duration-300 hover:opacity-85"
                            />
                          );
                        });
                      })()}
                    </svg>
                    {/* Inner Donut Center Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl font-bold font-mono text-slate-900">
                        {categoryAggregates.filter(c => c.count > 0).length}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">Kategori Aktif</span>
                    </div>
                  </div>

                  {/* Donut Legend */}
                  <div className="mt-4 w-full space-y-1.5">
                    {categoryAggregates.map((cat) => {
                      const share = filteredRecords.length > 0 
                        ? Math.round((cat.count / filteredRecords.length) * 100) 
                        : null;
                      return (
                        <div key={cat.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 truncate">
                            <span 
                              className="w-2.5 h-2.5 rounded-full shrink-0" 
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="font-medium text-slate-700 truncate">{cat.shortName}</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono text-slate-500">
                            <span>{cat.count} data</span>
                            <span className="font-bold text-slate-800">{share === null ? '—' : `${share}%`}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Total: {filteredRecords.length} entri</span>
                <span className="text-teal-600 font-medium">Sesuai Permenkes</span>
              </div>
            </div>
          </div>

          {/* 12-Month Trend Line Chart Section (Dashboard Spec 4: Trend Chart) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  Tren Capaian Waktu (12 Bulan)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perubahan trajektori indikator agregat tahun {selectedYear} (Januari - Desember)
                </p>
              </div>
              <button
                onClick={() => setActiveView('trends')}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 self-start sm:self-auto"
              >
                Analisis Tren Lengkap <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4">
              <div className="h-44 w-full relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 600 150">
                  {/* Grid Lines */}
                  <line x1="40" y1="20" x2="590" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="65" x2="590" y2="65" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="110" x2="590" y2="110" stroke="#f1f5f9" strokeWidth="1" />

                  {/* Y-axis labels */}
                  <text x="5" y="24" fontSize="10" fill="#94a3b8" fontFamily="monospace">100%</text>
                  <text x="10" y="69" fontSize="10" fill="#94a3b8" fontFamily="monospace">80%</text>
                  <text x="10" y="114" fontSize="10" fill="#94a3b8" fontFamily="monospace">60%</text>

                  {/* Calculate points for 12 months */}
                  {(() => {
                    const validPoints = monthlyTrends.map((item, idx) => {
                      const x = 50 + idx * 48;
                      const val = item.avgRate !== null ? item.avgRate : 50;
                      const y = 140 - ((Math.max(50, Math.min(100, val)) - 50) / 50) * 120;
                      return { x, y, hasData: item.avgRate !== null, val: item.avgRate };
                    });

                    const polylinePoints = validPoints.map(p => `${p.x},${p.y}`).join(' ');

                    return (
                      <>
                        <polygon
                          points={`50,135 ${polylinePoints} ${50 + 11 * 48},135`}
                          fill="rgba(13, 148, 136, 0.08)"
                        />
                        <polyline
                          fill="none"
                          stroke="#0d9488"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={polylinePoints}
                        />
                        {validPoints.map((p, idx) => (
                          <g key={idx}>
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r={p.hasData ? "4" : "2"}
                              fill={p.hasData ? "#ffffff" : "#cbd5e1"}
                              stroke={p.hasData ? "#0d9488" : "#94a3b8"}
                              strokeWidth="2"
                            />
                            {p.hasData && idx % 2 === 1 && (
                              <text
                                x={p.x}
                                y={p.y - 8}
                                textAnchor="middle"
                                fontSize="9"
                                fill="#0f766e"
                                fontWeight="bold"
                                fontFamily="monospace"
                              >
                                {p.val}%
                              </text>
                            )}
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* X-axis months */}
              <div className="flex justify-between text-xs font-mono text-slate-500 mt-2 px-6">
                {monthlyTrends.map((m) => (
                  <span key={m.month} className="text-center">
                    {m.monthName}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* DASHBOARD SPECIFICATION 4 & 6: Detailed Table with Interactive Drill-Down */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Tabel Detail Capaian & Drill Down Indikator SPM
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Klik tombol <strong>Drill Down</strong> pada indikator untuk melihat rincian per Puskesmas dan data mentah
                </p>
              </div>
              <button
                onClick={() => setActiveView('indicators')}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline flex items-center gap-1 self-start sm:self-auto"
              >
                Analisis SPM Lengkap ({indicators.length} Indikator) <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Kode & Nama Indikator</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3 text-right">Target SPM</th>
                    <th className="py-2.5 px-3 text-right">Realisasi (Numerator)</th>
                    <th className="py-2.5 px-3 text-right">Sasaran (Denominator)</th>
                    <th className="py-2.5 px-3 text-right">Capaian</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Aksi Drill Down</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {indicatorHighlights.map(({ indicator, hasData, avgRate, status, totalNum, totalDen }) => (
                    <tr 
                      key={indicator.id} 
                      className="hover:bg-teal-50/40 transition-colors cursor-pointer group"
                      onClick={() => {
                        setDrilldownIndicator(indicator);
                        setDrilldownPuskesmas(null);
                      }}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 group-hover:text-teal-700 transition-colors">
                          {indicator.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{indicator.code}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-slate-600 font-medium">
                          {indicator.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-700">
                        {indicator.spmTarget}{indicator.unit}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {hasData ? formatNumberID(totalNum) : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {hasData ? formatNumberID(totalDen) : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                        {hasData && avgRate !== null ? `${avgRate}${indicator.unit}` : 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {status ? (
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            status === 'TERCAPAI'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : status === 'WASPADA'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {status}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Belum Ada Data</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDrilldownIndicator(indicator);
                            setDrilldownPuskesmas(null);
                          }}
                          className="px-2.5 py-1 text-xs text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md transition-colors font-medium inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Drill Down</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* DASHBOARD SPECIFICATION 6: Interactive Drill-Down Modal Flow */}
      {/* (Dashboard -> Klik Indikator -> Detail Indikator -> Puskesmas -> Detail Data) */}
      {drilldownIndicator && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {drilldownIndicator.code}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Alur Drill Down Dashboard
                  </span>
                  {drilldownPuskesmas && (
                    <>
                      <span className="text-slate-300">/</span>
                      <span className="text-xs font-semibold text-slate-800">
                        {drilldownPuskesmas.name}
                      </span>
                    </>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {drilldownIndicator.name}
                </h3>
              </div>
              <button
                onClick={() => {
                  setDrilldownIndicator(null);
                  setDrilldownPuskesmas(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Indicator Metadata Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-400 block">Target SPM Standar:</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    {drilldownIndicator.spmTarget}{drilldownIndicator.unit}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Kategori Program:</span>
                  <span className="font-semibold text-slate-800">
                    {drilldownIndicator.category.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Rekomendasi Dinas:</span>
                  <span className="text-slate-600 truncate block" title={drilldownIndicator.interventionRecommendation}>
                    {drilldownIndicator.interventionRecommendation}
                  </span>
                </div>
              </div>

              {/* Step 1: Puskesmas Breakdown for this indicator */}
              {!drilldownPuskesmas ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                      Capaian per Puskesmas (Klik Faskes untuk Melihat Data Mentah)
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {puskesmasList.length} Faskes
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Nama Puskesmas</th>
                          <th className="py-2 px-3">Kecamatan</th>
                          <th className="py-2 px-3 text-right">Realisasi</th>
                          <th className="py-2 px-3 text-right">Sasaran</th>
                          <th className="py-2 px-3 text-right">Capaian</th>
                          <th className="py-2 px-3 text-center">Status SPM</th>
                          <th className="py-2 px-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {puskesmasList.map((pkm) => {
                          const pkmRecs = filteredRecords.filter(
                            r => r.puskesmasId === pkm.id && r.indicatorId === drilldownIndicator.id
                          );
                          const hasPkmData = pkmRecs.length > 0;
                          const avgRate = hasPkmData
                            ? Number((pkmRecs.reduce((s, r) => s + r.achievementRate, 0) / pkmRecs.length).toFixed(1))
                            : null;
                          const sumNum = pkmRecs.reduce((s, r) => s + r.numerator, 0);
                          const sumDen = pkmRecs.reduce((s, r) => s + r.denominator, 0);
                          const status = avgRate !== null ? getIndicatorSPMStatus(drilldownIndicator, avgRate) : null;

                          return (
                            <tr
                              key={pkm.id}
                              onClick={() => setDrilldownPuskesmas(pkm)}
                              className="hover:bg-teal-50/60 cursor-pointer transition-colors"
                            >
                              <td className="py-2.5 px-3 font-semibold text-slate-800">
                                {pkm.name}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500">
                                {pkm.district}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                                {hasPkmData ? formatNumberID(sumNum) : '-'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                                {hasPkmData ? formatNumberID(sumDen) : '-'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                                {avgRate !== null ? `${avgRate}%` : 'N/A'}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {status ? (
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    status === 'TERCAPAI'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : status === 'WASPADA'
                                      ? 'bg-amber-50 text-amber-700'
                                      : 'bg-rose-50 text-rose-700'
                                  }`}>
                                    {status}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic text-[10px]">Belum Ada Data</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <span className="text-teal-600 hover:text-teal-800 font-semibold inline-flex items-center gap-0.5 text-[11px]">
                                  Buka Data <ChevronRight className="w-3 h-3" />
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Step 2: Raw data records for selected Puskesmas & Indicator */
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDrilldownPuskesmas(null)}
                        className="text-teal-600 hover:underline font-semibold flex items-center gap-1"
                      >
                        &larr; Kembali ke Daftar Faskes
                      </button>
                      <span className="text-slate-400">|</span>
                      <span className="font-bold text-slate-800">
                        Data Mentah: {drilldownPuskesmas.name}
                      </span>
                    </div>
                  </div>

                  {(() => {
                    const rawRecords = records.filter(
                      r => r.puskesmasId === drilldownPuskesmas.id && r.indicatorId === drilldownIndicator.id
                    );

                    if (rawRecords.length === 0) {
                      return (
                        <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-lg">
                          Tidak ada catatan entri data untuk Puskesmas ini pada indikator terpilih.
                        </div>
                      );
                    }

                    return (
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="py-2 px-3">Periode</th>
                              <th className="py-2 px-3 text-right">Numerator</th>
                              <th className="py-2 px-3 text-right">Denominator</th>
                              <th className="py-2 px-3 text-right">Capaian</th>
                              <th className="py-2 px-3">Petugas Penginput</th>
                              <th className="py-2 px-3">Catatan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {rawRecords.map((rec) => (
                              <tr key={rec.id} className="hover:bg-slate-50">
                                <td className="py-2 px-3 font-semibold text-slate-800">
                                  {rec.year} - {MONTH_NAMES_ID[rec.month - 1]}
                                </td>
                                <td className="py-2 px-3 text-right text-slate-700">
                                  {formatNumberID(rec.numerator)}
                                </td>
                                <td className="py-2 px-3 text-right text-slate-700">
                                  {formatNumberID(rec.denominator)}
                                </td>
                                <td className="py-2 px-3 text-right font-bold text-teal-700">
                                  {rec.achievementRate}%
                                </td>
                                <td className="py-2 px-3 text-[11px] font-sans text-slate-600">
                                  {rec.updatedBy}
                                </td>
                                <td className="py-2 px-3 text-[11px] font-sans text-slate-500 italic">
                                  {rec.notes || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Data Dictionary & SPM Standar Terverifikasi
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setDrilldownIndicator(null);
                    setDrilldownPuskesmas(null);
                  }}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    setDrilldownIndicator(null);
                    setDrilldownPuskesmas(null);
                    setActiveView('data');
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
                >
                  Buka di Manajemen Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
