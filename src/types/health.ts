export type UserRole = 'ADMIN' | 'DATA_MANAGER' | 'DINKES' | 'PUSKESMAS' | 'VIEWER' | 'READ_ONLY';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  puskesmasId?: string;
  puskesmasName?: string;
  avatarUrl?: string;
  password?: string;
}

export type AgeGroup = 
  | 'NEONATUS'      // 0 - 28 hari
  | 'BAYI'          // 0 - 11 bulan
  | 'BALITA'        // 12 - 59 bulan
  | 'REMAJA'        // 6 - 18 tahun (usia sekolah & remaja)
  | 'PRODUKTIF'     // 19 - 59 tahun
  | 'LANSIA'        // >= 60 tahun
  | 'SEMUA_UMUR';   // Populasi umum / keluarga

export interface AgeGroupInfo {
  id: AgeGroup;
  label: string;
  rangeDescription: string;
  description: string;
  color: string;
}

export type HealthCategory = 
  | 'KIA_KB'
  | 'IMUNISASI'
  | 'GIZI_STUNTING'
  | 'PENYAKIT_MENULAR'
  | 'PTM_JIWA'
  | 'KESLING';

export interface HealthCategoryInfo {
  id: HealthCategory;
  name: string;
  shortName: string;
  description: string;
  color: string;
}

export type IndicatorDirection = 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER';

export interface HealthIndicator {
  id: string;
  code: string;
  name: string;
  category: HealthCategory;
  ageGroup: AgeGroup;
  spmTarget: number; // e.g., 100% or 14%
  unit: string; // '%', 'kasus', etc.
  description: string;
  direction: IndicatorDirection;
  criticalThreshold: number; // value threshold that triggers urgent alert
  interventionRecommendation: string;
}

export interface Period {
  id: string;
  year: number;
  month?: number;
}

export interface Puskesmas {
  id: string;
  code: string;
  name: string;
  status: boolean; // Data Dictionary: Status aktif
  district: string; // Kecamatan
  headDoctor: string;
  address: string;
  totalPopulation: number;
  contact: string;
}

export interface IndicatorDataRecord {
  id: string;
  // Data Dictionary fields (mapped & optional for full compatibility)
  puskesmas_id?: string; // FK Puskesmas (Data Dictionary)
  indicator_id?: string; // FK Indikator (Data Dictionary)
  period_id?: string;    // FK Periode (Data Dictionary)
  value?: number;        // Nilai indikator (Decimal)
  target?: number;      // Target (Decimal)
  percentage?: number;  // Persentase capaian (Decimal)
  notes?: string;       // Catatan (Text)

  // Convenience aliases and populated relation fields
  puskesmasId: string;
  puskesmasName: string;
  indicatorId: string;
  indicatorCode: string;
  indicatorName: string;
  category: HealthCategory;
  ageGroup: AgeGroup;
  ageBracket?: StandardAgeBracket;
  year: number;
  month: number;
  targetValue: number;
  numerator: number;
  denominator: number;
  achievementRate: number;
  updatedAt: string;
  updatedBy: string;
}

export interface ImportRecord {
  id: string;
  filename?: string;    // Data Dictionary
  imported_by?: string; // Data Dictionary
  imported_at?: string; // Data Dictionary
  status: 'SUCCESS' | 'WARNING' | 'FAILED' | string;
  total_rows?: number;  // Data Dictionary
  valid_rows?: number;  // Data Dictionary
  invalid_rows?: number;// Data Dictionary

  // Aliases for compatibility
  fileName: string;
  importedAt: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: string[];
}

export type SPMStatus = 'TERCAPAI' | 'WASPADA' | 'KRITIS';

// Business Rule 2: Age Group specifications (10-49 years in 5-year brackets)
export type StandardAgeBracket = 
  | '10-14'
  | '15-19'
  | '20-24'
  | '25-29'
  | '30-34'
  | '35-39'
  | '40-44'
  | '45-49';

export interface StandardAgeBracketInfo {
  bracket: StandardAgeBracket;
  label: string; // e.g. "10–14 Tahun"
  minAge: number;
  maxAge: number;
  description: string;
}

// Business Rule 7: Audit Trail
export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  userRole: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT';
  recordId?: string;
  puskesmasName: string;
  indicatorName: string;
  period: string; // e.g. "2025 - Bulan 06"
  previousValue?: string | number | null;
  newValue?: string | number | null;
  previousData?: IndicatorDataRecord | null;
  newData?: IndicatorDataRecord | IndicatorDataRecord[] | null;
  changeSummary: string;
}
