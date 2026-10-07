import { HealthIndicator, IndicatorDataRecord, SPMStatus, Puskesmas } from '../types/health';

/**
 * Determine SPM compliance status based on indicator direction
 */
export function getIndicatorSPMStatus(indicator: HealthIndicator, rate: number): SPMStatus {
  if (indicator.direction === 'LOWER_IS_BETTER') {
    // e.g. Stunting: Target <= 14%, Critical >= 18%
    if (rate <= indicator.spmTarget) return 'TERCAPAI';
    if (rate >= indicator.criticalThreshold) return 'KRITIS';
    return 'WASPADA';
  } else {
    // Higher is better: e.g. IDL Target >= 95%, Critical <= 70%
    if (rate >= indicator.spmTarget) return 'TERCAPAI';
    if (rate <= indicator.criticalThreshold) return 'KRITIS';
    return 'WASPADA';
  }
}

/**
 * Format number with Indonesian locale (comma decimal, dot thousand)
 */
export function formatNumberID(value: number, decimals: number = 0): string {
  if (isNaN(value)) return '0';
  return value.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${formatNumberID(value, decimals)}%`;
}

/**
 * Calculate gap to SPM target (+ for surplus, - for deficit)
 */
export function calculateTargetGap(indicator: HealthIndicator, rate: number): {
  gapValue: number;
  isPositive: boolean;
  label: string;
} {
  if (indicator.direction === 'LOWER_IS_BETTER') {
    // For lower is better, target 14%, actual 11% means +3% (good)
    const gap = indicator.spmTarget - rate;
    const isPositive = gap >= 0;
    return {
      gapValue: Math.abs(gap),
      isPositive,
      label: isPositive 
        ? `${gap.toFixed(1)}% di bawah pagu target (Optimal)`
        : `${Math.abs(gap).toFixed(1)}% di atas batas toleransi (Defisit)`,
    };
  } else {
    // For higher is better, actual 92% vs target 95% = -3% (deficit)
    const gap = rate - indicator.spmTarget;
    const isPositive = gap >= 0;
    return {
      gapValue: Math.abs(gap),
      isPositive,
      label: isPositive
        ? `+${gap.toFixed(1)}% di atas target SPM`
        : `${gap.toFixed(1)}% dari target SPM`,
    };
  }
}

/**
 * Get aggregate statistics for a set of records
 */
export interface SummaryStats {
  averageAchievement: number;
  totalTargetAchieved: number;
  totalWarningCount: number;
  totalCriticalCount: number;
  totalPopulationServed: number;
  totalTargetNumerator: number;
  totalTargetDenominator: number;
  totalIndicatorsMonitored: number;
}

export function computeSummaryStats(
  records: IndicatorDataRecord[],
  indicators: HealthIndicator[],
  puskesmasList: Puskesmas[]
): SummaryStats {
  if (records.length === 0) {
    return {
      averageAchievement: 0,
      totalTargetAchieved: 0,
      totalWarningCount: 0,
      totalCriticalCount: 0,
      totalPopulationServed: 0,
      totalTargetNumerator: 0,
      totalTargetDenominator: 0,
      totalIndicatorsMonitored: indicators.length,
    };
  }

  const indicatorMap = new Map<string, HealthIndicator>();
  indicators.forEach(ind => indicatorMap.set(ind.id, ind));

  let achievedCount = 0;
  let warningCount = 0;
  let criticalCount = 0;
  let totalRates = 0;
  let totalNumerator = 0;
  let totalDenominator = 0;

  records.forEach((rec) => {
    const ind = indicatorMap.get(rec.indicatorId);
    if (!ind) return;

    totalRates += rec.achievementRate;
    totalNumerator += rec.numerator;
    totalDenominator += rec.denominator;

    const status = getIndicatorSPMStatus(ind, rec.achievementRate);
    if (status === 'TERCAPAI') achievedCount++;
    else if (status === 'WASPADA') warningCount++;
    else if (status === 'KRITIS') criticalCount++;
  });

  const uniquePuskesmasIds = new Set(records.map(r => r.puskesmasId));
  const totalPopulation = puskesmasList
    .filter(p => uniquePuskesmasIds.has(p.id))
    .reduce((sum, p) => sum + p.totalPopulation, 0);

  return {
    averageAchievement: records.length > 0 ? Number((totalRates / records.length).toFixed(1)) : 0,
    totalTargetAchieved: achievedCount,
    totalWarningCount: warningCount,
    totalCriticalCount: criticalCount,
    totalPopulationServed: totalPopulation,
    totalTargetNumerator: totalNumerator,
    totalTargetDenominator: totalDenominator,
    totalIndicatorsMonitored: indicators.length,
  };
}

/**
 * Get critical indicators needing immediate attention across Puskesmas
 */
export interface CriticalAlertItem {
  indicator: HealthIndicator;
  averageRate: number;
  affectedPuskesmasCount: number;
  criticalPuskesmasNames: string[];
  lowestRate: number;
  lowestPuskesmasName: string;
  recommendation: string;
}

export function findCriticalIndicators(
  records: IndicatorDataRecord[],
  indicators: HealthIndicator[]
): CriticalAlertItem[] {
  const alertItems: CriticalAlertItem[] = [];

  indicators.forEach((indicator) => {
    const matchingRecords = records.filter(r => r.indicatorId === indicator.id);
    if (matchingRecords.length === 0) return;

    const criticalRecords = matchingRecords.filter(r => {
      return getIndicatorSPMStatus(indicator, r.achievementRate) === 'KRITIS';
    });

    if (criticalRecords.length > 0) {
      const avgRate = Number(
        (matchingRecords.reduce((sum, r) => sum + r.achievementRate, 0) / matchingRecords.length).toFixed(1)
      );

      // Find worst record
      let worstRecord = matchingRecords[0];
      if (indicator.direction === 'LOWER_IS_BETTER') {
        // Highest is worst for stunting
        worstRecord = matchingRecords.reduce((prev, curr) => (curr.achievementRate > prev.achievementRate ? curr : prev));
      } else {
        // Lowest is worst for IDL
        worstRecord = matchingRecords.reduce((prev, curr) => (curr.achievementRate < prev.achievementRate ? curr : prev));
      }

      alertItems.push({
        indicator,
        averageRate: avgRate,
        affectedPuskesmasCount: criticalRecords.length,
        criticalPuskesmasNames: criticalRecords.map(r => r.puskesmasName),
        lowestRate: worstRecord.achievementRate,
        lowestPuskesmasName: worstRecord.puskesmasName,
        recommendation: indicator.interventionRecommendation,
      });
    }
  });

  return alertItems.sort((a, b) => b.affectedPuskesmasCount - a.affectedPuskesmasCount);
}

/**
 * Business Rule 1: Check if a duplicate record exists for the same Puskesmas, Indicator, Year, and Month
 */
export function checkDuplicateRecord(
  records: IndicatorDataRecord[],
  puskesmasId: string,
  indicatorId: string,
  year: number,
  month: number,
  excludeRecordId?: string
): { isDuplicate: boolean; existingRecord?: IndicatorDataRecord } {
  const existing = records.find(r => 
    r.puskesmasId === puskesmasId &&
    r.indicatorId === indicatorId &&
    r.year === year &&
    r.month === month &&
    r.id !== excludeRecordId
  );

  return {
    isDuplicate: !!existing,
    existingRecord: existing,
  };
}

/**
 * Business Rule 5: Empty data display helper
 * Do NOT display 0 as a replacement for absent data without a clear rule.
 */
export function formatDataValue(
  value: number | undefined | null, 
  suffix: string = '%', 
  emptyPlaceholder: string = 'N/A'
): string {
  if (value === undefined || value === null || isNaN(value)) {
    return emptyPlaceholder;
  }
  return `${formatNumberID(value, 1)}${suffix}`;
}

export interface AutomatedInsight {
  id: string;
  type: 'TREND_UP' | 'TREND_DOWN' | 'TOP_PERFORMER' | 'NEEDS_ATTENTION' | 'EQUITY_GAP';
  title: string;
  message: string;
  metricLabel?: string;
  severity: 'info' | 'success' | 'warning' | 'danger';
}

/**
 * Dashboard Specification 5: Generate automated data-driven insights based solely on actual data
 */
export function generateAutomaticInsights(
  records: IndicatorDataRecord[],
  indicators: HealthIndicator[],
  puskesmasList: Puskesmas[]
): AutomatedInsight[] {
  const insights: AutomatedInsight[] = [];
  if (records.length === 0) return insights;

  // 1. Puskesmas with highest and lowest overall average
  const puskesmasAvgMap = new Map<string, { total: number; count: number; name: string }>();
  records.forEach(r => {
    const curr = puskesmasAvgMap.get(r.puskesmasId) || { total: 0, count: 0, name: r.puskesmasName };
    curr.total += r.achievementRate;
    curr.count += 1;
    puskesmasAvgMap.set(r.puskesmasId, curr);
  });

  const pkmAverages = Array.from(puskesmasAvgMap.entries()).map(([id, val]) => ({
    id,
    name: val.name,
    avg: Number((val.total / val.count).toFixed(1)),
  })).sort((a, b) => b.avg - a.avg);

  if (pkmAverages.length > 0) {
    const topPkm = pkmAverages[0];
    insights.push({
      id: 'insight-top-pkm',
      type: 'TOP_PERFORMER',
      title: 'Puskesmas Capaian Tertinggi',
      message: `${topPkm.name} mencatatkan rata-rata capaian tertinggi sebesar ${topPkm.avg}% di seluruh indikator yang dilaporkan.`,
      metricLabel: `${topPkm.avg}%`,
      severity: 'success',
    });

    if (pkmAverages.length > 1) {
      const bottomPkm = pkmAverages[pkmAverages.length - 1];
      const gap = Number((topPkm.avg - bottomPkm.avg).toFixed(1));
      insights.push({
        id: 'insight-gap-pkm',
        type: 'EQUITY_GAP',
        title: 'Disparitas Capaian Wilayah',
        message: `Terdapat selisih capaian ${gap}% antara ${topPkm.name} (${topPkm.avg}%) dan ${bottomPkm.name} (${bottomPkm.avg}%).`,
        metricLabel: `Gap ${gap}%`,
        severity: gap > 15 ? 'warning' : 'info',
      });
    }
  }

  // 2. Indicator with greatest recent movement or critical status
  const criticalList = findCriticalIndicators(records, indicators);
  if (criticalList.length > 0) {
    const topCritical = criticalList[0];
    insights.push({
      id: 'insight-critical',
      type: 'NEEDS_ATTENTION',
      title: 'Perhatian Segera Diperlukan',
      message: `${topCritical.indicator.name} berada pada level kritis di ${topCritical.affectedPuskesmasCount} Puskesmas (rata-rata ${topCritical.averageRate}%, target SPM ${topCritical.indicator.spmTarget}%). ${topCritical.recommendation}`,
      metricLabel: `${topCritical.averageRate}%`,
      severity: 'danger',
    });
  }

  // 3. Time comparison (latest month vs previous month if multi-month records exist)
  const months = Array.from(new Set(records.map(r => r.month))).sort((a, b) => a - b);
  if (months.length >= 2) {
    const lastMonth = months[months.length - 1];
    const prevMonth = months[months.length - 2];

    const lastMonthRecs = records.filter(r => r.month === lastMonth);
    const prevMonthRecs = records.filter(r => r.month === prevMonth);

    if (lastMonthRecs.length > 0 && prevMonthRecs.length > 0) {
      const avgLast = lastMonthRecs.reduce((sum, r) => sum + r.achievementRate, 0) / lastMonthRecs.length;
      const avgPrev = prevMonthRecs.reduce((sum, r) => sum + r.achievementRate, 0) / prevMonthRecs.length;
      const delta = Number((avgLast - avgPrev).toFixed(1));

      if (delta >= 0) {
        insights.push({
          id: 'insight-trend-month',
          type: 'TREND_UP',
          title: 'Tren Peningkatan Bulanan',
          message: `Rata-rata capaian SPM mengalami peningkatan sebesar +${delta}% dari Bulan ${prevMonth} (${avgPrev.toFixed(1)}%) ke Bulan ${lastMonth} (${avgLast.toFixed(1)}%).`,
          metricLabel: `+${delta}%`,
          severity: 'success',
        });
      } else {
        insights.push({
          id: 'insight-trend-month',
          type: 'TREND_DOWN',
          title: 'Penurunan Capaian Periode',
          message: `Rata-rata capaian SPM mengalami penurunan sebesar ${delta}% dibandingkan Bulan ${prevMonth}. Disarankan evaluasi pelaporan faskes.`,
          metricLabel: `${delta}%`,
          severity: 'warning',
        });
      }
    }
  }

  return insights;
}

/**
 * Dashboard Specification 4: Ranking helpers
 */
export interface PerformanceRankings {
  topPuskesmas: { name: string; score: number; district: string }[];
  bottomPuskesmas: { name: string; score: number; district: string }[];
  highestIndicators: { code: string; name: string; rate: number; target: number }[];
  lowestIndicators: { code: string; name: string; rate: number; target: number }[];
}

export function computeRankings(
  records: IndicatorDataRecord[],
  indicators: HealthIndicator[],
  puskesmasList: Puskesmas[]
): PerformanceRankings {
  if (records.length === 0) {
    return {
      topPuskesmas: [],
      bottomPuskesmas: [],
      highestIndicators: [],
      lowestIndicators: [],
    };
  }

  // Puskesmas ranking
  const puskesmasMap = new Map<string, { total: number; count: number; pkm: Puskesmas }>();
  records.forEach(r => {
    const pkm = puskesmasList.find(p => p.id === r.puskesmasId);
    if (!pkm) return;
    const curr = puskesmasMap.get(r.puskesmasId) || { total: 0, count: 0, pkm };
    curr.total += r.achievementRate;
    curr.count += 1;
    puskesmasMap.set(r.puskesmasId, curr);
  });

  const pkmRanked = Array.from(puskesmasMap.values()).map(item => ({
    name: item.pkm.name,
    district: item.pkm.district,
    score: Number((item.total / item.count).toFixed(1)),
  })).sort((a, b) => b.score - a.score);

  // Indicators ranking
  const indicatorMap = new Map<string, { total: number; count: number; ind: HealthIndicator }>();
  records.forEach(r => {
    const ind = indicators.find(i => i.id === r.indicatorId);
    if (!ind) return;
    const curr = indicatorMap.get(r.indicatorId) || { total: 0, count: 0, ind };
    curr.total += r.achievementRate;
    curr.count += 1;
    indicatorMap.set(r.indicatorId, curr);
  });

  const indRanked = Array.from(indicatorMap.values()).map(item => ({
    code: item.ind.code,
    name: item.ind.name,
    rate: Number((item.total / item.count).toFixed(1)),
    target: item.ind.spmTarget,
  })).sort((a, b) => b.rate - a.rate);

  return {
    topPuskesmas: pkmRanked.slice(0, 3),
    bottomPuskesmas: pkmRanked.slice(-3).reverse(),
    highestIndicators: indRanked.slice(0, 3),
    lowestIndicators: indRanked.slice(-3).reverse(),
  };
}
