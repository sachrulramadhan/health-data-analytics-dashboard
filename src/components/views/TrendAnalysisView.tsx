import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { useHealthData } from '../../context/HealthDataContext';
import { MONTH_NAMES_SHORT_ID, MONTH_NAMES_ID } from '../../data/mockData';
import { calculateTargetGap } from '../../utils/healthCalculations';

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

  // Monthly points for 2024 and 2025
  const trendPoints = React.useMemo(() => {
    const filterPkm = (r: any) => selectedPkmId === 'ALL' || r.puskesmasId === selectedPkmId;

    const data2024 = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const recs = records.filter(r => r.indicatorId === activeIndicator.id && r.year === 2024 && r.month === m && filterPkm(r));
      const avg = recs.length > 0
        ? Number((recs.reduce((s, r) => s + r.achievementRate, 0) / recs.length).toFixed(1))
        : 0;
      return { month: m, monthName: MONTH_NAMES_SHORT_ID[i], rate: avg };
    });

    const data2025 = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const recs = records.filter(r => r.indicatorId === activeIndicator.id && r.year === 2025 && r.month === m && filterPkm(r));
      const avg = recs.length > 0
        ? Number((recs.reduce((s, r) => s + r.achievementRate, 0) / recs.length).toFixed(1))
        : 0;
      return { month: m, monthName: MONTH_NAMES_SHORT_ID[i], rate: avg };
    });

    const data2026 = Array.from({ length: 4 }, (_, i) => {
      const m = i + 1;
      const recs = records.filter(r => r.indicatorId === activeIndicator.id && r.year === 2026 && r.month === m && filterPkm(r));
      const avg = recs.length > 0
        ? Number((recs.reduce((s, r) => s + r.achievementRate, 0) / recs.length).toFixed(1))
        : 0;
      return { month: m, monthName: MONTH_NAMES_SHORT_ID[i], rate: avg };
    });

    return { data2024, data2025, data2026 };
  }, [records, activeIndicator, selectedPkmId]);

  // Selected year data for detailed cards
  const activeYearData = comparedYear === 2024 ? trendPoints.data2024 : trendPoints.data2025;

  // Growth rate calculation
  const startRate = activeYearData[0]?.rate || 0;
  const endRate = activeYearData[11]?.rate || 0;
  const yearlyGrowth = Number((endRate - startRate).toFixed(1));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Analisis Tren Capaian Waktu
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Eksplorasi tren bulanan dan perbandingan kinerja tahunan (2024 vs 2025).
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
            <option value="2025">Tahun 2025 (12 Bulan Lengkap)</option>
            <option value="2024">Tahun 2024 (Baseline Historis)</option>
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
              Grafik Komparasi Tren Bulanan: 2024 vs 2025
            </h2>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-teal-600 rounded"></span> Tahun 2025 (Aktif)
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-1 bg-slate-300 rounded"></span> Tahun 2024 (Historis)
            </span>
          </div>
        </div>

        {/* SVG Chart with Dual Lines */}
        <div className="h-64 w-full relative pt-4">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 700 220">
            {/* Horizontal Grid lines */}
            <line x1="40" y1="20" x2="680" y2="20" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="40" y1="65" x2="680" y2="65" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="40" y1="110" x2="680" y2="110" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="40" y1="155" x2="680" y2="155" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="40" y1="200" x2="680" y2="200" stroke="#f1f5f9" strokeWidth="1" />

            {/* Y Axis Labels */}
            <text x="5" y="24" fontSize="10" fill="#94a3b8" fontFamily="monospace">100%</text>
            <text x="12" y="69" fontSize="10" fill="#94a3b8" fontFamily="monospace">80%</text>
            <text x="12" y="114" fontSize="10" fill="#94a3b8" fontFamily="monospace">60%</text>
            <text x="12" y="159" fontSize="10" fill="#94a3b8" fontFamily="monospace">40%</text>
            <text x="12" y="204" fontSize="10" fill="#94a3b8" fontFamily="monospace">20%</text>

            {/* 2024 Grey Polyline */}
            {(() => {
              const pts2024 = trendPoints.data2024.map((pt, idx) => {
                const x = 50 + idx * 56;
                const y = 200 - ((pt.rate - 20) / 80) * 180;
                return `${x},${Math.max(20, Math.min(200, y))}`;
              }).join(' ');

              const pts2025 = trendPoints.data2025.map((pt, idx) => {
                const x = 50 + idx * 56;
                const y = 200 - ((pt.rate - 20) / 80) * 180;
                return `${x},${Math.max(20, Math.min(200, y))}`;
              }).join(' ');

              return (
                <>
                  <polyline
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    points={pts2024}
                  />
                  <polyline
                    fill="none"
                    stroke="#0d9488"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={pts2025}
                  />

                  {/* Data Points 2025 */}
                  {trendPoints.data2025.map((pt, idx) => {
                    const x = 50 + idx * 56;
                    const y = Math.max(20, Math.min(200, 200 - ((pt.rate - 20) / 80) * 180));
                    return (
                      <g key={idx}>
                        <circle
                          cx={x}
                          cy={y}
                          r="4.5"
                          fill="#ffffff"
                          stroke="#0d9488"
                          strokeWidth="2.5"
                        />
                        <text
                          x={x}
                          y={y - 8}
                          fontSize="9"
                          fill="#0f766e"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {pt.rate}%
                        </text>
                      </g>
                    );
                  })}
                </>
              );
            })()}
          </svg>
        </div>

        {/* X-axis months */}
        <div className="grid grid-cols-12 text-center text-xs font-mono text-slate-500 pt-2 border-t border-slate-100">
          {MONTH_NAMES_SHORT_ID.map((name, idx) => (
            <div key={name}>
              <span className="font-semibold text-slate-700">{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Details Grid & MoM Progress */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-3">
          Rekapitulasi Bulanan & Laju Pertumbuhan (Tahun {comparedYear})
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {activeYearData.map((item, idx) => {
            const prevRate = idx > 0 ? activeYearData[idx - 1].rate : item.rate;
            const diff = Number((item.rate - prevRate).toFixed(1));
            const isUp = diff >= 0;

            return (
              <div key={item.month} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  {MONTH_NAMES_ID[idx]}
                </span>
                <span className="text-lg font-bold font-mono text-slate-800 block mt-1">
                  {item.rate}%
                </span>
                <div className="flex items-center gap-1 text-[10px] mt-1">
                  {idx === 0 ? (
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
        </div>
      </div>
    </div>
  );
};
