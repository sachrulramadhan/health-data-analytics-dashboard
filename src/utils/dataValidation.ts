import {
  HealthIndicator,
  IndicatorDataRecord,
  Puskesmas,
  StandardAgeBracket,
} from '../types/health';
import { STANDARD_AGE_BRACKETS } from '../data/mockData';

export type IndicatorRecordInput = Pick<
  IndicatorDataRecord,
  'puskesmasId' | 'indicatorId' | 'year' | 'month' | 'numerator' | 'denominator'
> & Pick<Partial<IndicatorDataRecord>, 'ageBracket'>;

export interface RecordValidationResult {
  errors: string[];
  puskesmas?: Puskesmas;
  indicator?: HealthIndicator;
}

export function getStandardAgeBracket(age: number): StandardAgeBracket | undefined {
  return STANDARD_AGE_BRACKETS.find(group => age >= group.minAge && age <= group.maxAge)?.bracket;
}

export function parseStandardAgeBracket(value: unknown): StandardAgeBracket | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().replace(/[–—]/g, '-').replace(/\s+/g, '').toLowerCase();
  const match = STANDARD_AGE_BRACKETS.find(group =>
    normalized === group.bracket || normalized === `${group.bracket}tahun`.toLowerCase()
  );
  return match?.bracket;
}

export function validateIndicatorRecord(
  record: IndicatorRecordInput,
  indicators: HealthIndicator[],
  puskesmasList: Puskesmas[],
  existingRecords: IndicatorDataRecord[],
  excludeRecordId?: string
): RecordValidationResult {
  const errors: string[] = [];
  const puskesmas = puskesmasList.find(item => item.id === record.puskesmasId);
  const indicator = indicators.find(item => item.id === record.indicatorId);

  if (!record.puskesmasId) errors.push('Puskesmas wajib dipilih.');
  else if (!puskesmas) errors.push('Puskesmas tidak terdaftar dalam sistem.');

  if (!record.indicatorId) errors.push('Indikator wajib dipilih.');
  else if (!indicator) errors.push('Indikator tidak terdaftar dalam sistem.');

  if (!Number.isInteger(record.year) || record.year < 2020 || record.year > 2030) {
    errors.push('Tahun harus berupa angka bulat antara 2020 dan 2030.');
  }
  if (!Number.isInteger(record.month) || record.month < 1 || record.month > 12) {
    errors.push('Periode bulan harus berupa angka bulat antara 1 dan 12.');
  }
  if (!Number.isFinite(record.numerator) || record.numerator < 0) {
    errors.push('Numerator harus berupa angka numerik non-negatif.');
  }
  if (!Number.isFinite(record.denominator) || record.denominator <= 0) {
    errors.push('Denominator harus berupa angka numerik lebih besar dari 0.');
  }
  if (
    record.ageBracket !== undefined &&
    !STANDARD_AGE_BRACKETS.some(group => group.bracket === record.ageBracket)
  ) {
    errors.push('Kelompok umur harus berada pada rentang 10–49 tahun dengan interval 5 tahun.');
  }

  if (puskesmas && indicator && Number.isInteger(record.year) && Number.isInteger(record.month)) {
    const duplicate = existingRecords.find(existing =>
      existing.id !== excludeRecordId &&
      existing.puskesmasId === puskesmas.id &&
      existing.indicatorId === indicator.id &&
      existing.year === record.year &&
      existing.month === record.month &&
      existing.ageBracket === record.ageBracket
    );
    if (duplicate) {
      errors.push(
        `Duplikasi data: catatan ${puskesmas.name} - ${indicator.name} periode ${record.year} bulan ${record.month}` +
        `${record.ageBracket ? ` kelompok umur ${record.ageBracket}` : ''} sudah terdaftar.`
      );
    }
  }

  return { errors, puskesmas, indicator };
}

export function calculateIndicatorPercentage(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return null;
  return Number(((numerator / denominator) * 100).toFixed(1));
}
