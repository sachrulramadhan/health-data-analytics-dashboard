import React, { useState } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Target, 
  Search,
  Filter,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useHealthData } from '../../context/HealthDataContext';
import { 
  getIndicatorSPMStatus, 
  calculateTargetGap, 
  formatNumberID 
} from '../../utils/healthCalculations';
import { HEALTH_CATEGORIES } from '../../data/mockData';
import { HealthCategory, HealthIndicator, SPMStatus } from '../../types/health';

interface IndicatorAnalysisViewProps {
  setActiveView: (view: string) => void;
  onSelectIndicatorForComparison?: (indicatorId: string) => void;
}

export const IndicatorAnalysisView: React.FC<IndicatorAnalysisViewProps> = ({ 
  setActiveView,
  onSelectIndicatorForComparison 
}) => {
  const { 
    indicators, 
    filteredRecords, 
    puskesmasList,
    selectedCategory,
    setSelectedCategory
  } = useHealthData();

  const [statusFilter, setStatusFilter] = useState<'ALL' | SPMStatus>('ALL');
  const [expandedIndicatorId, setExpandedIndicatorId] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState('');

  // Process indicators with current filtered records
  const analyzedIndicators = React.useMemo(() => {
    return indicators.map((ind) => {
      const recs = filteredRecords.filter(r => r.indicatorId === ind.id);
      const hasData = recs.length > 0;
      
      const totalNum = recs.reduce((sum, r) => sum + r.numerator, 0);
      const totalDen = recs.reduce((sum, r) => sum + r.denominator, 0);
      const avgRate = hasData && totalDen > 0 
        ? Number(((totalNum / totalDen) * 100).toFixed(1))
        : null;

      const status = avgRate !== null ? getIndicatorSPMStatus(ind, avgRate) : null;
      const gap = avgRate !== null ? calculateTargetGap(ind, avgRate) : null;

      // Puskesmas breakdown for this indicator
      const pkmBreakdown = puskesmasList.map((pkm) => {
        const pkmRecs = recs.filter(r => r.puskesmasId === pkm.id);
        const pkmAvg = pkmRecs.length > 0
          ? Number((pkmRecs.reduce((sum, r) => sum + r.achievementRate, 0) / pkmRecs.length).toFixed(1))
          : 0;
        const pkmStatus = getIndicatorSPMStatus(ind, pkmAvg);
        const num = pkmRecs.reduce((sum, r) => sum + r.numerator, 0);
        const den = pkmRecs.reduce((sum, r) => sum + r.denominator, 0);

        return {
          puskesmas: pkm,
          rate: pkmAvg,
          status: pkmStatus,
          num,
          den,
          recordCount: pkmRecs.length,
        };
      });

      // Best and worst Puskesmas
      const sortedByRate = [...pkmBreakdown].sort((a, b) => {
        if (ind.direction === 'LOWER_IS_BETTER') {
          return a.rate - b.rate; // Lower is best
        }
        return b.rate - a.rate; // Higher is best
      });

      const bestPkm = sortedByRate[0];
      const worstPkm = sortedByRate[sortedByRate.length - 1];
      const disparityGap = Math.abs(Number((bestPkm.rate - worstPkm.rate).toFixed(1)));

      return {
        indicator: ind,
        avgRate,
        status,
        gap,
        totalNum,
        totalDen,
        recordsCount: recs.length,
        pkmBreakdown,
        bestPkm,
        worstPkm,
        disparityGap,
      };
    });
  }, [indicators, filteredRecords, puskesmasList]);

  // Filter by status and search
  const filteredList = analyzedIndicators.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (selectedCategory !== 'ALL' && item.indicator.category !== selectedCategory) return false;
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      const matchName = item.indicator.name.toLowerCase().includes(q);
      const matchCode = item.indicator.code.toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    return true;
  });

  const countTercapai = analyzedIndicators.filter(i => i.status === 'TERCAPAI').length;
  const countWaspada = analyzedIndicators.filter(i => i.status === 'WASPADA').length;
  const countKritis = analyzedIndicators.filter(i => i.status === 'KRITIS').length;

  return (
    <div className="space-y-6">
      {/* Title & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Analisis Komprehensif Indikator Kesehatan (SPM)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Identifikasi dini disparitas faskes, gap terhadap target Permenkes, dan rekomendasi intervensi.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500">Total Indikator:</span>
          <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
            {indicators.length} Indikator SPM
          </span>
        </div>
      </div>

      {/* Status Segmented Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Semua Status ({analyzedIndicators.length})
          </button>
          <button
            onClick={() => setStatusFilter('KRITIS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              statusFilter === 'KRITIS'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Kritis / Perlu Perhatian ({countKritis})
          </button>
          <button
            onClick={() => setStatusFilter('WASPADA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              statusFilter === 'WASPADA'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Waspada ({countWaspada})
          </button>
          <button
            onClick={() => setStatusFilter('TERCAPAI')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              statusFilter === 'TERCAPAI'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Tercapai ({countTercapai})
          </button>
        </div>

        {/* Local Search Input */}
        <div className="relative min-w-44">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari indikator..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Indicators List */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="bg-white border border-amber-200 rounded-xl p-8 text-center shadow-xs">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">Tidak ada data untuk filter yang dipilih.</h4>
            <p className="text-xs text-slate-500 mt-1">
              Sistem tidak menampilkan nilai 0 sebagai pengganti data kosong tanpa aturan yang jelas. Sesuaikan filter untuk memuat data.
            </p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">Tidak ada indikator yang sesuai dengan filter.</p>
            <p className="text-xs text-slate-400 mt-1">Coba sesuaikan status capaian atau kata kunci pencarian.</p>
          </div>
        ) : (
          filteredList.map((item) => {
            const isExpanded = expandedIndicatorId === item.indicator.id;
            const ind = item.indicator;

            return (
              <div
                key={ind.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 transition-all"
              >
                {/* Header row */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {ind.code}
                      </span>
                      <span className="text-xs text-slate-500">
                        {ind.category.replace('_', ' ')}
                      </span>
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        item.status === 'TERCAPAI'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.status === 'WASPADA'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : item.status === 'KRITIS'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.status || 'Belum Ada Data'}
                      </span>
                      {ind.direction === 'LOWER_IS_BETTER' && (
                        <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                          Target Rendah
                        </span>
                      )}
                    </div>

                    <h2 className="text-sm font-bold text-slate-900 mt-1.5">
                      {ind.name}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {ind.description}
                    </p>
                  </div>

                  {/* Quantitative Stats & Target comparison */}
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Target SPM</span>
                      <span className="text-xs font-mono font-bold text-slate-700">
                        {ind.spmTarget}{ind.unit}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Realisasi Rata-rata</span>
                      <span className={`text-base font-mono font-bold ${
                        item.status === 'TERCAPAI'
                          ? 'text-emerald-600'
                          : item.status === 'WASPADA'
                          ? 'text-amber-600'
                          : item.status === 'KRITIS'
                          ? 'text-rose-600'
                          : 'text-slate-400'
                      }`}>
                        {item.avgRate !== null ? `${item.avgRate}${ind.unit}` : 'N/A'}
                      </span>
                    </div>

                    <div className="w-28 hidden sm:block">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Capaian</span>
                        <span className="font-mono">{item.avgRate !== null ? `${item.avgRate}%` : 'N/A'}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        {item.avgRate !== null && (
                          <div
                            className={`h-2 rounded-full ${
                              item.status === 'TERCAPAI' ? 'bg-emerald-600' : item.status === 'WASPADA' ? 'bg-amber-500' : 'bg-rose-600'
                            }`}
                            style={{ width: `${Math.min(100, item.avgRate)}%` }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Expand/Collapse Button */}
                    <button
                      onClick={() => setExpandedIndicatorId(isExpanded ? null : ind.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title={isExpanded ? 'Tutup Rincian' : 'Buka Rincian Per Faskes'}
                      aria-label="Buka Rincian Per Faskes"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Disparity strip */}
                <div className="px-4 py-2 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-2">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span>
                      <strong className="text-slate-700">Capaian Tertinggi:</strong> {item.bestPkm.puskesmas.name} ({item.bestPkm.rate}%)
                    </span>
                    <span className="text-slate-300">|</span>
                    <span>
                      <strong className="text-slate-700">Capaian Terendah:</strong> {item.worstPkm.puskesmas.name} ({item.worstPkm.rate}%)
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-amber-800 font-medium">
                      Disparitas: {item.disparityGap}% selisih
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (onSelectIndicatorForComparison) {
                        onSelectIndicatorForComparison(ind.id);
                      }
                      setActiveView('comparison');
                    }}
                    className="text-teal-700 hover:text-teal-900 font-medium flex items-center gap-1 self-start sm:self-auto hover:underline"
                  >
                    Bandingkan di Peta Wilayah <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Expandable Deep-dive breakdown per Puskesmas */}
                {isExpanded && (
                  <div className="p-4 border-t border-slate-200 bg-slate-50/30 space-y-4">
                    {/* Public Health Recommendation Box */}
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200/80">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold text-amber-900 block">
                            Rekomendasi Intervensi Kebijakan:
                          </span>
                          <p className="text-xs text-amber-800 mt-0.5">
                            {ind.interventionRecommendation}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown Table */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 mb-2">
                        Rincian Capaian per Puskesmas ({item.pkmBreakdown.length} Faskes)
                      </h4>
                      <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                              <th className="py-2 px-3">Kode</th>
                              <th className="py-2 px-3">Nama Puskesmas</th>
                              <th className="py-2 px-3">Kecamatan</th>
                              <th className="py-2 px-3 text-right">Realisasi (Numerator)</th>
                              <th className="py-2 px-3 text-right">Sasaran (Denominator)</th>
                              <th className="py-2 px-3 text-right">Capaian (%)</th>
                              <th className="py-2 px-3 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {item.pkmBreakdown.map((p) => (
                              <tr key={p.puskesmas.id} className="hover:bg-slate-50/60">
                                <td className="py-2 px-3 font-mono text-slate-500">{p.puskesmas.code}</td>
                                <td className="py-2 px-3 font-medium text-slate-800">{p.puskesmas.name}</td>
                                <td className="py-2 px-3 text-slate-500">{p.puskesmas.district}</td>
                                <td className="py-2 px-3 text-right font-mono text-slate-700">
                                  {formatNumberID(p.num)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-slate-700">
                                  {formatNumberID(p.den)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                                  {p.rate}%
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                    p.status === 'TERCAPAI'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : p.status === 'WASPADA'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}>
                                    {p.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
