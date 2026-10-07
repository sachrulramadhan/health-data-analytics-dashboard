import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight
} from 'lucide-react';
import { useHealthData } from '../../context/HealthDataContext';
import { MONTH_NAMES_SHORT_ID } from '../../data/mockData';

export const TrendAnalysisView: React.FC = () => {
  const { 
    indicators, 
    puskesmasList, 
    records 
  } = useHealthData();

  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string>(indicators[3]?.id || indicators[0]?.id);
  const [selectedPkmId, setSelectedPkmId] = useState<string>('ALL');
  const [comparedYear, setComparedYear] = useState<number>(2025);

  const activeIndicator = indicators.find(i => i.id === selectedIndicatorId) || indicators[0];

  // Missing months remain null so chart and summary never treat them as zero.
  const trendPoints = React.useMemo(() => {
    const annualTrends: Record<number, { month: number; monthName: string; rate: number | null }[]> = {};
    const monthlyTotals = new Map<number, { total: number; count: number }>();
    records.forEach(record => {
      if (
        record.indicatorId !== activeIndicator.id ||
        (selectedPkmId !== 'ALL' && record.puskesmasId !== selectedPkmId)
      ) return;

      const key = record.year * 12 + record.month;
      const aggregate = monthlyTotals.get(key) || { total: 0, count: 0 };
      aggregate.total += record.achievementRate;
      aggregate.count += 1;
      monthlyTotals.set(key, aggregate);
    });

    for (let year = 2020; year <= 2030; year++) {
      annualTrends[year] = Array.from({ length: 12 }, (_, index) => {
        const month = index + 1;
        const aggregate = monthlyTotals.get(year * 12 + month);
        const rate = aggregate
          ? Number((aggregate.total / aggregate.count).toFixed(1))
          : null;
        return { month, monthName: MONTH_NAMES_SHORT_ID[index], rate };
      });
    }
    return annualTrends;
  }, [records, activeIndicator, selectedPkmId]);

  const activeYearData = trendPoints[comparedYear] || [];
  const baselineYear = comparedYear > 2020 ? comparedYear - 1 : null;
  const baselineYearData = baselineYear === null ? [] : trendPoints[baselineYear] || [];
  const toPolylineSegments = (data: typeof activeYearData) => {
    const segments: string[] = [];
    let points: string[] = [];
    data.forEach((point, index) => {
      if (point.rate === null) {
        if (points.length > 1) segments.push(points.join(' '));
        points = [];
        return;
      }
      const x = 50 + index * 56;
      const y = 200 - ((point.rate - 20) / 80) * 180;
      points.push(`${x},${Math.max(20, Math.min(200, y))}`);
    });
    if (points.length > 1) segments.push(points.join(' '));
    return segments;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Analisis Tren Capaian Waktu
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Eksplorasi tren bulanan dan perbandingan kinerja antar tahun berdasarkan data yang tersedia.
          </p>
        </div>
      </div>

      {/* Control Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Indikator Kesehatan:
          </label>
          <select
            value={selectedIndicatorId}
            onChange={(e) => setSelectedIndicatorId(e.target.value)}
            className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-teal-500"
          >
            {indicators.map(ind => (
              <option key={ind.id} value={ind.id}>
                {ind.name} ({ind.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Wilayah / Puskesmas:
          </label>
          <select
            value={selectedPkmId}
            onChange={(e) => setSelectedPkmId(e.target.value)}
            className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-teal-500"
          >
            <option value="ALL">Seluruh Wilayah (Agregat Semua Puskesmas)</option>
            {puskesmasList.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Tahun Fokus Evaluasi:
          </label>
          <select
            value={comparedYear}
            onChange={(e) => setComparedYear(Number(e.target.value))}
            className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-teal-500"
          >
            {Array.from({ length: 11 }, (_, index) => 2030 - index).map(year => (
              <option key={year} value={year}>Tahun {year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Multi-Year Comparison Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-mono text-teal-600 font-semibold uppercase">
              {activeIndicator.code} · Target SPM: {activeIndicator.spmTarget}{activeIndicator.unit}
            </span>
            <h2 className="text-sm font-bold text-slate-900 mt-0.5">
              Grafik Komparasi Tren Bulanan: {baselineYear ?? '—'} vs {comparedYear}
            </h2>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-teal-600 rounded"></span> Tahun {comparedYear} (Aktif)
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-1 bg-slate-300 rounded"></span> Tahun {baselineYear ?? '—'} (Historis)
            </span>
          </div>
        </div>

        {/* SVG Chart */}
        {baselineYearData.every(point => point.rate === null) && activeYearData.every(point => point.rate === null) ? (
          <div className="h-64 flex items-center justify-center text-sm text-slate-500">
            Tidak ada data untuk filter yang dipilih.
          </div>
        ) : (
          <>
            <div className="h-64 w-full relative pt-4">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 700 220">
                <line x1="40" y1="20" x2="680" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="65" x2="680" y2="65" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="110" x2="680" y2="110" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="155" x2="680" y2="155" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="200" x2="680" y2="200" stroke="#f1f5f9" strokeWidth="1" />
                <text x="5" y="24" fontSize="10" fill="#94a3b8" fontFamily="monospace">100%</text>
                <text x="12" y="69" fontSize="10" fill="#94a3b8" fontFamily="monospace">80%</text>
                <text x="12" y="114" fontSize="10" fill="#94a3b8" fontFamily="monospace">60%</text>
                <text x="12" y="159" fontSize="10" fill="#94a3b8" fontFamily="monospace">40%</text>
                <text x="12" y="204" fontSize="10" fill="#94a3b8" fontFamily="monospace">20%</text>

                {toPolylineSegments(baselineYearData).map((points, index) => (
                  <polyline key={`baseline-${index}`} fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 3" points={points} />
                ))}
                {toPolylineSegments(activeYearData).map((points, index) => (
                  <polyline key={`active-${index}`} fill="none" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} />
                ))}
                {activeYearData.flatMap((point, index) => {
                  if (point.rate === null) return [];
                  const x = 50 + index * 56;
                  const y = Math.max(20, Math.min(200, 200 - ((point.rate - 20) / 80) * 180));
                  return [(
                    <g key={point.month}>
                      <circle cx={x} cy={y} r="4.5" fill="#ffffff" stroke="#0d9488" strokeWidth="2.5" />
                      <text x={x} y={y - 8} fontSize="9" fill="#0f766e" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                        {point.rate}%
                      </text>
                    </g>
                  )];
                })}
              </svg>
            </div>
            <div className="grid grid-cols-12 text-center text-xs font-mono text-slate-500 pt-2 border-t border-slate-100">
              {MONTH_NAMES_SHORT_ID.map(name => (
                <div key={name}>
                  <span className="font-semibold text-slate-700">{name}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Monthly Details Grid & MoM Progress */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-3">
          Rekapitulasi Bulanan & Laju Pertumbuhan (Tahun {comparedYear})
        </h2>
        {activeYearData.every(point => point.rate === null) ? (
          <p className="text-sm text-slate-500">Tidak ada data untuk filter yang dipilih.</p>
        ) : <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {activeYearData.map((item, idx) => {
            const prevRate = idx > 0 ? activeYearData[idx - 1].rate : null;
            const diff = item.rate !== null && prevRate !== null
              ? Number((item.rate - prevRate).toFixed(1))
              : null;
            const isUp = diff !== null && diff >= 0;

            return (
              <div key={item.month} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  {item.monthName}
                </span>
                <span className="text-lg font-bold font-mono text-slate-800 block mt-1">
                  {item.rate === null ? '—' : `${item.rate}%`}
                </span>
                <div className="flex items-center gap-1 text-[10px] mt-1">
                  {item.rate === null ? (
                    <span className="text-slate-400">—</span>
                  ) : diff === null ? (
                    <span className="text-slate-400">Baseline awal</span>
                  ) : (
                    <span className={`font-mono font-medium flex items-center ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {diff > 0 ? `+${diff}%` : `${diff}%`} MoM
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>}
      </div>
    </div>
  );
};
