import React, { useState } from 'react';
import { 
  Users, 
  Baby, 
  Heart, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useHealthData } from '../../context/HealthDataContext';
import { AGE_GROUPS } from '../../data/mockData';
import { AgeGroup, HealthIndicator } from '../../types/health';
import { getIndicatorSPMStatus, formatNumberID } from '../../utils/healthCalculations';

export const AgeGroupAnalyticsView: React.FC<{ setActiveView: (view: string) => void }> = ({ setActiveView }) => {
  const { 
    filteredRecords, 
    indicators, 
    puskesmasList,
    selectedYear,
    selectedMonth 
  } = useHealthData();

  const [activeAgeGroup, setActiveAgeGroup] = useState<AgeGroup | 'ALL'>('ALL');

  // Compute performance per age group
  const ageGroupMetrics = React.useMemo(() => {
    return AGE_GROUPS.map((group) => {
      const groupIndicators = indicators.filter(i => i.ageGroup === group.id);
      const groupRecords = filteredRecords.filter(r => r.ageGroup === group.id);

      const totalNum = groupRecords.reduce((sum, r) => sum + r.numerator, 0);
      const totalDen = groupRecords.reduce((sum, r) => sum + r.denominator, 0);
      const avgRate = groupRecords.length > 0
        ? Number((groupRecords.reduce((sum, r) => sum + r.achievementRate, 0) / groupRecords.length).toFixed(1))
        : 0;

      const criticalCount = groupIndicators.filter(ind => {
        const indRecs = groupRecords.filter(r => r.indicatorId === ind.id);
        const rate = indRecs.length > 0 
          ? Number((indRecs.reduce((sum, r) => sum + r.achievementRate, 0) / indRecs.length).toFixed(1))
          : 0;
        return getIndicatorSPMStatus(ind, rate) === 'KRITIS';
      }).length;

      return {
        ...group,
        indicators: groupIndicators,
        totalNumerator: totalNum,
        totalDenominator: totalDen,
        averageAchievement: avgRate,
        criticalCount,
        recordsCount: groupRecords.length,
      };
    });
  }, [indicators, filteredRecords]);

  // Selected age group detail
  const currentGroupData = activeAgeGroup === 'ALL' 
    ? null 
    : ageGroupMetrics.find(g => g.id === activeAgeGroup);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Analisis Indikator Berdasarkan Kelompok Umur
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluasi siklus hidup: Neonatus, Bayi, Balita, Remaja, Usia Produktif, dan Lansia.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
          <span>Periode: {selectedYear}</span>
        </div>
      </div>

      {/* Demographic Age Group Segment Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {ageGroupMetrics.map((group) => {
          const isSelected = activeAgeGroup === group.id;

          return (
            <div
              key={group.id}
              onClick={() => setActiveAgeGroup(isSelected ? 'ALL' : group.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-teal-600 bg-teal-50/50 shadow-xs ring-1 ring-teal-600'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-slate-900">
                  {group.label}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                  {group.rangeDescription}
                </span>
              </div>

              <div className="flex items-baseline justify-between mt-3">
                <div>
                  <span className="text-[11px] text-slate-400 block">Rata-rata Capaian:</span>
                  <span className={`text-xl font-mono font-bold ${
                    group.averageAchievement >= 85 ? 'text-teal-700' : 'text-amber-700'
                  }`}>
                    {group.averageAchievement}%
                  </span>
                </div>
                {group.criticalCount > 0 ? (
                  <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {group.criticalCount} Kritis
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Optimal
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                <div
                  className="bg-teal-600 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, group.averageAchievement)}%` }}
                />
              </div>

              <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
                <span>{group.indicators.length} Indikator SPM</span>
                <span className="font-mono text-slate-700 font-medium">
                  {formatNumberID(group.totalNumerator)} jiwa
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparative Lifecycle Bar Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Perbandingan Capaian Antar Siklus Hidup (Kelompok Umur)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifikasi tahapan usia dengan kesenjangan layanan kesehatan tertinggi.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Benchmark: SPM 90%</span>
        </div>

        <div className="space-y-3 pt-2">
          {ageGroupMetrics.map((group) => (
            <div key={group.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{group.label}</span>
                  <span className="text-[11px] text-slate-400 font-mono">({group.rangeDescription})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {formatNumberID(group.totalNumerator)} / {formatNumberID(group.totalDenominator)} sasaran
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {group.averageAchievement}%
                  </span>
                </div>
              </div>
              <div className="relative w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    group.averageAchievement >= 85 ? 'bg-teal-600' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, group.averageAchievement)}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-slate-800 z-10"
                  style={{ left: '90%' }}
                  title="Target SPM 90%"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Indicators List for Selected or All Groups */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Daftar Indikator Berdasarkan Kelompok Usia {currentGroupData ? `(${currentGroupData.label})` : '(Semua Kelompok)'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rincian capaian, target SPM nasional, dan faskes dengan intervensi prioritas.
            </p>
          </div>

          {activeAgeGroup !== 'ALL' && (
            <button
              onClick={() => setActiveAgeGroup('ALL')}
              className="text-xs text-teal-600 hover:underline font-medium"
            >
              Tampilkan Semua Kelompok
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Kelompok Umur</th>
                <th className="py-2.5 px-3">Kode & Nama Indikator</th>
                <th className="py-2.5 px-3 text-right">Target SPM</th>
                <th className="py-2.5 px-3 text-right">Realisasi Sasaran</th>
                <th className="py-2.5 px-3 text-right">Capaian Rata-rata</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-4">Rekomendasi Intervensi Usia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                    Tidak ada data untuk filter yang dipilih.
                  </td>
                </tr>
              ) : (
                indicators
                  .filter(i => activeAgeGroup === 'ALL' || i.ageGroup === activeAgeGroup)
                  .map((ind) => {
                    const recs = filteredRecords.filter(r => r.indicatorId === ind.id);
                    const hasData = recs.length > 0;
                    const num = recs.reduce((s, r) => s + r.numerator, 0);
                    const den = recs.reduce((s, r) => s + r.denominator, 0);
                    const rate = hasData && den > 0 ? Number(((num / den) * 100).toFixed(1)) : null;
                    const status = rate !== null ? getIndicatorSPMStatus(ind, rate) : null;
                    const grp = AGE_GROUPS.find(g => g.id === ind.ageGroup);

                    return (
                      <tr key={ind.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-800 block">{grp?.label}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{grp?.rangeDescription}</span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{ind.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{ind.code}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium text-slate-700">
                          {ind.spmTarget}{ind.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {hasData ? `${formatNumberID(num)} / ${formatNumberID(den)}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {rate !== null ? `${rate}%` : 'N/A'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {status ? (
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              status === 'TERCAPAI'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : status === 'WASPADA'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {status}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs text-[11px] leading-relaxed">
                          {ind.interventionRecommendation}
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Business Rule 2: Standar Pengelompokan Umur (10-49 Tahun Rentang 5 Tahun) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Standar Business Rule 2: Spesifikasi Kelompok Umur 10–49 Tahun
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Sistem mematuhi aturan baku pengelompokan usia 5-tahunan untuk agregasi data surveilans dan skrining kesehatan.
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-200">
            Business Rule 2
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1">
          {[
            { age: '10–14', group: '10–14 Tahun', desc: 'Remaja Awal / SMP' },
            { age: '15–19', group: '15–19 Tahun', desc: 'Remaja Lanjut / SMA' },
            { age: '20–24', group: '20–24 Tahun', desc: 'Dewasa Muda / Pranikah' },
            { age: '25–29', group: '25–29 Tahun', desc: 'Reproduksi Matang' },
            { age: '30–34', group: '30–34 Tahun', desc: 'Reproduksi & Produktif' },
            { age: '35–39', group: '35–39 Tahun', desc: 'Waspada Risiko Maternal' },
            { age: '40–44', group: '40–44 Tahun', desc: 'Skrining PTM / DM' },
            { age: '45–49', group: '45–49 Tahun', desc: 'PTM Intensif / Kanker' },
          ].map((item, idx) => (
            <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <div className="text-xs font-bold text-slate-900 font-mono">{item.age}</div>
              <div className="text-[11px] font-semibold text-teal-700 mt-0.5">{item.group}</div>
              <div className="text-[9px] text-slate-400 mt-1">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
