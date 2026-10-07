import React, { useState } from 'react';
import { 
  GitCompare, 
  Award, 
  AlertCircle, 
  BarChart3, 
  Grid3X3, 
  ArrowUpDown,
  CheckCircle,
  Building2,
  Download
} from 'lucide-react';
import { useHealthData } from '../../context/HealthDataContext';
import { getIndicatorSPMStatus, formatNumberID } from '../../utils/healthCalculations';
import { HealthIndicator, Puskesmas } from '../../types/health';

interface PuskesmasComparisonViewProps {
  initialIndicatorId?: string;
}

export const PuskesmasComparisonView: React.FC<PuskesmasComparisonViewProps> = ({ 
  initialIndicatorId 
}) => {
  const { 
    indicators, 
    puskesmasList, 
    filteredRecords, 
    selectedYear,
    selectedMonth 
  } = useHealthData();

  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string>(
    initialIndicatorId || indicators[3]?.id || indicators[0]?.id
  );
  const [viewMode, setViewMode] = useState<'CHART' | 'MATRIX'>('CHART');
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');

  const activeIndicator = indicators.find(i => i.id === selectedIndicatorId) || indicators[0];

  // Calculate comparison data for the selected indicator
  const comparisonData = React.useMemo(() => {
    if (!activeIndicator) return [];

    const data = puskesmasList.map((pkm) => {
      const recs = filteredRecords.filter(
        r => r.puskesmasId === pkm.id && r.indicatorId === activeIndicator.id
      );

      const totalNum = recs.reduce((s, r) => s + r.numerator, 0);
      const totalDen = recs.reduce((s, r) => s + r.denominator, 0);
      const rate = recs.length > 0 && totalDen > 0
        ? Number(((totalNum / totalDen) * 100).toFixed(1))
        : null;
      const status = rate === null ? null : getIndicatorSPMStatus(activeIndicator, rate);

      return {
        puskesmas: pkm,
        rate,
        status,
        num: totalNum,
        den: totalDen,
        recordsCount: recs.length,
      };
    });

    return [...data].sort((a, b) => {
      if (a.rate === null) return b.rate === null ? 0 : 1;
      if (b.rate === null) return -1;
      if (sortOrder === 'DESC') return b.rate - a.rate;
      return a.rate - b.rate;
    });
  }, [puskesmasList, filteredRecords, activeIndicator, sortOrder]);

  // Overall performance leaderboard (average of all indicators)
  const overallLeaderboard = React.useMemo(() => {
    return puskesmasList.map((pkm) => {
      const pkmRecs = filteredRecords.filter(r => r.puskesmasId === pkm.id);
      const avgRate = pkmRecs.length > 0
        ? Number((pkmRecs.reduce((s, r) => s + r.achievementRate, 0) / pkmRecs.length).toFixed(1))
        : null;

      const reachedCount = indicators.filter(ind => {
        const indRecs = pkmRecs.filter(r => r.indicatorId === ind.id);
        if (indRecs.length === 0) return false;
        const rate = Number((indRecs.reduce((s, r) => s + r.achievementRate, 0) / indRecs.length).toFixed(1));
        return getIndicatorSPMStatus(ind, rate) === 'TERCAPAI';
      }).length;

      return {
        puskesmas: pkm,
        avgRate,
        reachedCount,
        totalIndicators: indicators.length,
      };
    }).sort((a, b) => {
      if (a.avgRate === null) return b.avgRate === null ? 0 : 1;
      if (b.avgRate === null) return -1;
      return b.avgRate - a.avgRate;
    }).filter(item => item.avgRate !== null);
  }, [puskesmasList, filteredRecords, indicators]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Perbandingan Kinerja Antar Puskesmas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Komparasi capaian indikator, evaluasi kesenjangan antar faskes, dan pemetaan wilayah.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('CHART')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'CHART' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Grafik Komparasi
            </button>
            <button
              onClick={() => setViewMode('MATRIX')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'MATRIX' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              Matriks Heatmap
            </button>
          </div>
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="bg-white border border-amber-200 rounded-xl p-8 text-center shadow-xs">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800">Tidak ada data untuk filter yang dipilih.</h4>
          <p className="text-xs text-slate-500 mt-1">
            Sistem tidak menampilkan nilai 0 sebagai pengganti data kosong tanpa aturan yang jelas. Sesuaikan filter wilayah atau periode untuk memuat data.
          </p>
        </div>
      ) : (
        <>
          {/* Top 3 & Bottom 3 Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top 3 Puskesmas */}
        <div className="bg-white border border-emerald-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" />
              Top 3 Puskesmas Capaian Tertinggi
            </span>
            <span className="text-[11px] text-slate-400">Rata-rata SPM</span>
          </div>
          <div className="mt-3 space-y-2.5">
            {overallLeaderboard.slice(0, 3).map((item, idx) => (
              <div key={item.puskesmas.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold flex items-center justify-center text-[11px] shrink-0">
                    {idx + 1}
                  </span>
                  <div className="truncate">
                    <span className="font-semibold text-slate-800 block truncate">{item.puskesmas.name}</span>
                    <span className="text-[10px] text-slate-400">{item.puskesmas.district}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-emerald-700 text-sm">{item.avgRate ?? '—'}{item.avgRate === null ? '' : '%'}</span>
                  <span className="text-[10px] text-slate-400 block">{item.reachedCount}/{item.totalIndicators} target</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom 3 Puskesmas (Needing Dinkes supervision) */}
        <div className="bg-white border border-amber-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Puskesmas Prioritas Pembinaan (Gap Tertinggi)
            </span>
            <span className="text-[11px] text-slate-400">Perlu Supervisi</span>
          </div>
          <div className="mt-3 space-y-2.5">
            {overallLeaderboard.slice(-3).reverse().map((item, idx) => (
              <div key={item.puskesmas.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-mono font-bold flex items-center justify-center text-[11px] shrink-0">
                    !
                  </span>
                  <div className="truncate">
                    <span className="font-semibold text-slate-800 block truncate">{item.puskesmas.name}</span>
                    <span className="text-[10px] text-slate-400">{item.puskesmas.district}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-amber-700 text-sm">{item.avgRate ?? '—'}{item.avgRate === null ? '' : '%'}</span>
                  <span className="text-[10px] text-rose-500 block">
                    {item.totalIndicators - item.reachedCount} target tertinggal
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {viewMode === 'CHART' ? (
        /* Chart Comparison View */
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
          {/* Controls: Pick Indicator & Sort */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Pilih Indikator yang Dibandingkan:
              </label>
              <select
                value={selectedIndicatorId}
                onChange={(e) => setSelectedIndicatorId(e.target.value)}
                className="w-full md:max-w-md text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-teal-500"
              >
                {indicators.map((ind) => (
                  <option key={ind.id} value={ind.id}>
                    [{ind.code}] {ind.name} (Target: {ind.spmTarget}{ind.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 self-start md:self-end">
              <button
                onClick={() => setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Urutkan: {sortOrder === 'DESC' ? 'Tertinggi ke Terendah' : 'Terendah ke Tertinggi'}</span>
              </button>
            </div>
          </div>

          {/* Indicator Info Banner */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="font-bold text-slate-800">{activeIndicator.name}</span>
              <p className="text-slate-500 mt-0.5">{activeIndicator.description}</p>
            </div>
            <div className="flex items-center gap-4 shrink-0 font-mono">
              <div>
                <span className="text-[11px] text-slate-400 block">Target SPM:</span>
                <span className="font-bold text-teal-700">{activeIndicator.spmTarget}{activeIndicator.unit}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Batas Kritis:</span>
                <span className="font-bold text-rose-600">{activeIndicator.criticalThreshold}{activeIndicator.unit}</span>
              </div>
            </div>
          </div>

          {/* Interactive Bar Chart */}
          <div className="space-y-3 pt-2">
            {comparisonData.every(item => item.rate === null) ? (
              <p className="py-8 text-center text-sm text-slate-500">Tidak ada data untuk filter yang dipilih.</p>
            ) : comparisonData.map((item, idx) => {
              const isTargetAchieved = item.status === 'TERCAPAI';
              const isCritical = item.status === 'KRITIS';

              return (
                <div key={item.puskesmas.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 font-mono text-slate-400 text-[11px] text-right">
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800 truncate">
                        {item.puskesmas.name}
                      </span>
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        ({item.puskesmas.district})
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                        {item.recordsCount === 0
                          ? '—'
                          : `${formatNumberID(item.num)} / ${formatNumberID(item.den)}`}
                      </span>
                      <span className={`font-mono font-bold text-xs ${
                        item.rate === null ? 'text-slate-400' : isTargetAchieved ? 'text-teal-700' : isCritical ? 'text-rose-600' : 'text-amber-600'
                      }`}>
                        {item.rate === null ? '—' : `${item.rate}%`}
                      </span>
                      {item.status !== null && <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                        isTargetAchieved 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : isCritical 
                          ? 'bg-rose-50 text-rose-700 border-rose-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {item.status}
                      </span>}
                    </div>
                  </div>

                  {/* Horizontal Bar with Target Marker */}
                  <div className="relative w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
                    {item.rate !== null && (
                      <div
                        className={`h-3.5 rounded-full transition-all duration-500 ${
                          isTargetAchieved
                            ? 'bg-teal-600'
                            : isCritical
                            ? 'bg-rose-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, item.rate)}%` }}
                      />
                    )}
                    {/* Target Benchmark indicator line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-800 z-10"
                      style={{ left: `${Math.min(100, activeIndicator.spmTarget)}%` }}
                      title={`Target SPM: ${activeIndicator.spmTarget}%`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Benchmark Legend */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-teal-600"></span> Tercapai Target SPM
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> Waspada
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span> Kritis / Intervensi
              </span>
            </div>
            <span className="flex items-center gap-1 font-mono">
              <span className="w-1 h-3 bg-slate-800"></span> Garis Target SPM: {activeIndicator.spmTarget}%
            </span>
          </div>
        </div>
      ) : (
        /* Matrix Heatmap View */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">
              Matriks Heatmap Capaian 12 Indikator SPM per Puskesmas
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Warna mengindikasikan status capaian (Hijau = Tercapai, Kuning = Waspada, Merah = Kritis).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                    Nama Puskesmas
                  </th>
                  {indicators.map(ind => (
                    <th key={ind.id} className="py-2.5 px-2 text-center whitespace-nowrap min-w-20" title={ind.name}>
                      <span className="font-mono text-[11px] block">{ind.code}</span>
                      <span className="text-[10px] text-slate-400 font-normal">Tgt {ind.spmTarget}%</span>
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-right sticky right-0 bg-slate-50 border-l border-slate-200">
                    Rata-rata
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {puskesmasList.map(pkm => {
                  const pkmRecs = filteredRecords.filter(r => r.puskesmasId === pkm.id);
                  let totalRate = 0;
                  let rateCount = 0;

                  return (
                    <tr key={pkm.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-semibold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200 whitespace-nowrap">
                        {pkm.name}
                        <div className="text-[10px] text-slate-400 font-normal">{pkm.district}</div>
                      </td>

                      {indicators.map(ind => {
                        const recs = pkmRecs.filter(r => r.indicatorId === ind.id);
                        const rate = recs.length > 0
                          ? Number((recs.reduce((s, r) => s + r.achievementRate, 0) / recs.length).toFixed(1))
                          : null;
                        if (rate !== null) {
                          totalRate += rate;
                          rateCount += 1;
                        }
                        const status = rate === null ? null : getIndicatorSPMStatus(ind, rate);

                        return (
                          <td key={ind.id} className="py-2 px-1 text-center font-mono text-[11px]">
                            <span className={`inline-block px-1.5 py-0.5 rounded font-semibold w-14 text-center ${
                              status === 'TERCAPAI'
                                ? 'bg-emerald-100 text-emerald-800'
                                : status === 'WASPADA'
                                ? 'bg-amber-100 text-amber-800'
                                : status === 'KRITIS'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {rate === null ? '—' : `${rate}%`}
                            </span>
                          </td>
                        );
                      })}

                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 sticky right-0 bg-white border-l border-slate-200">
                        {rateCount > 0
                          ? `${(totalRate / rateCount).toFixed(1)}%`
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
