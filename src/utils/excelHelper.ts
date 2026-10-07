import * as XLSX from 'xlsx';
import { HealthIndicator, IndicatorDataRecord, Puskesmas } from '../types/health';
import { getIndicatorSPMStatus } from './healthCalculations';
import {
  calculateIndicatorPercentage,
  getStandardAgeBracket,
  parseStandardAgeBracket,
  validateIndicatorRecord,
} from './dataValidation';

export interface ParsedRowResult {
  isValid: boolean;
  rowNumber: number;
  data?: Partial<IndicatorDataRecord>;
  errors: string[];
  rawRow: Record<string, any>;
}

export interface ExcelImportResult {
  fileName: string;
  totalRows: number;
  validRecords: IndicatorDataRecord[];
  invalidRows: ParsedRowResult[];
  errors: string[];
}

/**
 * Download an official, standardized Excel template for Puskesmas reporting
 */
export function downloadOfficialExcelTemplate(indicators: HealthIndicator[], puskesmasList: Puskesmas[]): void {
  const wb = XLSX.utils.book_new();

  // Template Data Sheet
  const sampleRows = [
    {
      'Kode Puskesmas': 'P320101',
      'Nama Puskesmas': 'Puskesmas Melati',
      'Tahun': 2026,
      'Bulan (1-12)': 4,
      'Kelompok Umur': '',
      'Kode Indikator': 'K4-BUMIL',
      'Nama Indikator': 'Cakupan Kunjungan Ibu Hamil K4/K6',
      'Numerator (Realisasi)': 342,
      'Denominator (Sasaran)': 360,
      'Catatan': 'Sweeping ibu hamil terlaksana lancar',
    },
    {
      'Kode Puskesmas': 'P320101',
      'Nama Puskesmas': 'Puskesmas Melati',
      'Tahun': 2026,
      'Bulan (1-12)': 4,
      'Kelompok Umur': '',
      'Kode Indikator': 'IDL-BALITA',
      'Nama Indikator': 'Cakupan Imunisasi Dasar Lengkap (IDL) Bayi',
      'Numerator (Realisasi)': 395,
      'Denominator (Sasaran)': 415,
      'Catatan': 'Posyandu aktif 100%',
    },
    {
      'Kode Puskesmas': 'P320102',
      'Nama Puskesmas': 'Puskesmas Mawar',
      'Tahun': 2026,
      'Bulan (1-12)': 4,
      'Kelompok Umur': '',
      'Kode Indikator': 'STUNTING-PREV',
      'Nama Indikator': 'Prevalensi Balita Stunting (Pendek & Sangat Pendek)',
      'Numerator (Realisasi)': 215,
      'Denominator (Sasaran)': 1800,
      'Catatan': 'Pengukuran berkala balita Posyandu',
    },
    {
      'Kode Puskesmas': 'P320102',
      'Nama Puskesmas': 'Puskesmas Mawar',
      'Tahun': 2026,
      'Bulan (1-12)': 4,
      'Kelompok Umur': '',
      'Kode Indikator': 'TB-TEMUKAN',
      'Nama Indikator': 'Penemuan Kasus Tuberkulosis (Treatment Coverage)',
      'Numerator (Realisasi)': 118,
      'Denominator (Sasaran)': 135,
      'Catatan': 'Investigasi kontak erat keluarga indeks',
    },
  ];

  const wsTemplate = XLSX.utils.json_to_sheet(sampleRows);
  XLSX.utils.book_append_sheet(wb, wsTemplate, 'Format_Entri_Data');

  // Reference Sheet: Master Puskesmas
  const pkmRef = puskesmasList.map(p => ({
    'Kode': p.code,
    'Nama Puskesmas': p.name,
    'Kecamatan': p.district,
    'Kepala Puskesmas': p.headDoctor,
  }));
  const wsPkm = XLSX.utils.json_to_sheet(pkmRef);
  XLSX.utils.book_append_sheet(wb, wsPkm, 'Ref_Puskesmas');

  // Reference Sheet: Master Indikator
  const indRef = indicators.map(ind => ({
    'Kode Indikator': ind.code,
    'Nama Indikator': ind.name,
    'Kategori': ind.category,
    'Target SPM': `${ind.spmTarget}${ind.unit}`,
    'Arah Capaian': ind.direction === 'LOWER_IS_BETTER' ? 'Semakin Rendah Semakin Baik' : 'Semakin Tinggi Semakin Baik',
    'Ambang Kritis': `${ind.criticalThreshold}${ind.unit}`,
  }));
  const wsInd = XLSX.utils.json_to_sheet(indRef);
  XLSX.utils.book_append_sheet(wb, wsInd, 'Ref_Master_Indikator');

  // Trigger download
  XLSX.writeFile(wb, 'Template_Laporan_Kesehatan_Puskesmas.xlsx');
}

/**
 * Parse and validate an uploaded Excel file
 */
export async function parseUploadedExcel(
  file: File,
  indicators: HealthIndicator[],
  puskesmasList: Puskesmas[],
  currentUserName: string,
  existingRecords: IndicatorDataRecord[] = []
): Promise<ExcelImportResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  // Use first sheet
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const pkmByCode = new Map<string, Puskesmas>();
  const pkmByName = new Map<string, Puskesmas>();
  puskesmasList.forEach(p => {
    pkmByCode.set(p.code.toUpperCase().trim(), p);
    pkmByName.set(p.name.toLowerCase().trim(), p);
  });

  const indByCode = new Map<string, HealthIndicator>();
  const indByName = new Map<string, HealthIndicator>();
  indicators.forEach(i => {
    indByCode.set(i.code.toUpperCase().trim(), i);
    indByName.set(i.name.toLowerCase().trim(), i);
  });

  const validRecords: IndicatorDataRecord[] = [];
  const invalidRows: ParsedRowResult[] = [];
  const globalErrors: string[] = [];

  if (rawRows.length === 0) {
    globalErrors.push('File Excel kosong atau tidak memiliki baris data.');
    return {
      fileName: file.name,
      totalRows: 0,
      validRecords: [],
      invalidRows: [],
      errors: globalErrors,
    };
  }

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2; // considering 1-based header
    const errors: string[] = [];

    // Find Puskesmas
    const rawPkmCode = String(row['Kode Puskesmas'] || row['Kode_Puskesmas'] || row['kode'] || '').toUpperCase().trim();
    const rawPkmName = String(row['Nama Puskesmas'] || row['Nama_Puskesmas'] || row['puskesmas'] || '').trim();

    if (!rawPkmCode && !rawPkmName) {
      errors.push('Field Puskesmas wajib diisi (tidak boleh kosong).');
    }

    let matchedPkm = pkmByCode.get(rawPkmCode);
    if (!matchedPkm && rawPkmName) {
      matchedPkm = pkmByName.get(rawPkmName.toLowerCase());
    }

    if (!matchedPkm && (rawPkmCode || rawPkmName)) {
      errors.push(`Puskesmas tidak terdaftar dalam sistem ('${rawPkmCode || rawPkmName}'). Periksa kode/nama di lembar referensi.`);
    }

    // Find Indicator
    const rawIndCode = String(row['Kode Indikator'] || row['Kode_Indikator'] || row['indikator_kode'] || '').toUpperCase().trim();
    const rawIndName = String(row['Nama Indikator'] || row['Nama_Indikator'] || row['indikator'] || '').trim();

    if (!rawIndCode && !rawIndName) {
      errors.push('Field Indikator wajib diisi (tidak boleh kosong).');
    }

    let matchedInd = indByCode.get(rawIndCode);
    if (!matchedInd && rawIndName) {
      matchedInd = indByName.get(rawIndName.toLowerCase());
    }

    if (!matchedInd && (rawIndCode || rawIndName)) {
      errors.push(`Indikator tidak terdaftar dalam sistem ('${rawIndCode || rawIndName}'). Cocokkan dengan master kode.`);
    }

    // Year & Month
    const rawYear = row['Tahun'] ?? row['tahun'];
    const rawMonth = row['Bulan (1-12)'] ?? row['Bulan'] ?? row['bulan'];

    if (rawYear === undefined || rawYear === null || String(rawYear).trim() === '') {
      errors.push('Field Tahun wajib diisi (tidak boleh kosong).');
    }
    const year = rawYear === undefined || rawYear === null || String(rawYear).trim() === '' ? Number.NaN : Number(rawYear);

    if (!Number.isInteger(year) || year < 2020 || year > 2030) {
      errors.push(`Tahun tidak valid: '${rawYear}'. Masukkan angka bulat antara 2020-2030.`);
    }

    if (rawMonth === undefined || rawMonth === null || String(rawMonth).trim() === '') {
      errors.push('Field Bulan wajib diisi (tidak boleh kosong).');
    }
    const month = rawMonth === undefined || rawMonth === null || String(rawMonth).trim() === '' ? Number.NaN : Number(rawMonth);

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      errors.push(`Bulan tidak valid: '${rawMonth}'. Gunakan angka bulat 1 sampai 12.`);
    }

    // Numerator and Denominator
    const rawNum = row['Numerator (Realisasi)'] ?? row['Numerator'] ?? row['realisasi'] ?? row['numerator'];
    const rawDenom = row['Denominator (Sasaran)'] ?? row['Denominator'] ?? row['sasaran'] ?? row['denominator'];

    if (rawNum === '' || rawNum === undefined || rawNum === null || String(rawNum).trim() === '') {
      errors.push('Field Numerator (realisasi) wajib diisi.');
    }
    if (rawDenom === '' || rawDenom === undefined || rawDenom === null || String(rawDenom).trim() === '') {
      errors.push('Field Denominator (sasaran) wajib diisi.');
    }

    const numerator = rawNum === '' || rawNum === undefined || rawNum === null || String(rawNum).trim() === '' ? Number.NaN : Number(rawNum);
    const denominator = rawDenom === '' || rawDenom === undefined || rawDenom === null || String(rawDenom).trim() === '' ? Number.NaN : Number(rawDenom);

    if (!Number.isFinite(numerator) || numerator < 0) {
      errors.push(`Numerator harus berupa angka numerik non-negatif. Ditemukan: '${rawNum}'.`);
    }

    if (!Number.isFinite(denominator) || denominator <= 0) {
      errors.push(`Denominator harus berupa angka numerik lebih besar dari 0. Ditemukan: '${rawDenom}'.`);
    }

    const rawAge = row['Umur'] ?? row['Usia'] ?? row['umur'] ?? row['usia'];
    const rawAgeBracket = row['Kelompok Umur'] ?? row['Kelompok_Umur'] ?? row['age_group'] ?? row['ageBracket'];
    let ageBracket = parseStandardAgeBracket(rawAgeBracket);
    const hasAge = rawAge !== undefined && rawAge !== null && String(rawAge).trim() !== '';
    const hasAgeBracket = rawAgeBracket !== undefined && rawAgeBracket !== null && String(rawAgeBracket).trim() !== '';

    if (hasAgeBracket && !ageBracket) {
      errors.push(`Kelompok umur '${rawAgeBracket}' tidak valid. Gunakan rentang 10-14 sampai 45-49 tahun.`);
    }
    if (hasAge && !ageBracket) {
      const age = Number(rawAge);
      if (!Number.isInteger(age) || age < 10 || age > 49) {
        errors.push(`Umur '${rawAge}' harus berupa angka bulat antara 10 dan 49 tahun.`);
      } else {
        ageBracket = getStandardAgeBracket(age);
      }
    } else if (hasAge && ageBracket) {
      const age = Number(rawAge);
      if (!Number.isInteger(age) || age < 10 || age > 49) {
        errors.push(`Umur '${rawAge}' harus berupa angka bulat antara 10 dan 49 tahun.`);
      } else if (getStandardAgeBracket(age) !== ageBracket) {
        errors.push(`Umur ${age} tahun tidak sesuai dengan kelompok umur ${rawAgeBracket}.`);
      }
    }

    if (matchedPkm && matchedInd) {
      const validation = validateIndicatorRecord(
        { puskesmasId: matchedPkm.id, indicatorId: matchedInd.id, year, month, numerator, denominator, ageBracket },
        indicators,
        puskesmasList,
        [...existingRecords, ...validRecords]
      );
      errors.push(...validation.errors);
    }

    const notes = String(row['Catatan'] || row['Keterangan'] || row['notes'] || '').trim();

    if (errors.length > 0 || !matchedPkm || !matchedInd) {
      invalidRows.push({
        isValid: false,
        rowNumber,
        errors,
        rawRow: row,
      });
    } else {
      const achievementRate = matchedInd
        ? calculateIndicatorPercentage(numerator, denominator)
        : null;
      if (achievementRate === null) {
        invalidRows.push({
          isValid: false,
          rowNumber,
          errors: ['Persentase tidak dapat dihitung karena denominator tidak valid.'],
          rawRow: row,
        });
        return;
      }
      const record: IndicatorDataRecord = {
        id: `REC-IMP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        puskesmasId: matchedPkm.id,
        puskesmasName: matchedPkm.name,
        indicatorId: matchedInd.id,
        indicatorCode: matchedInd.code,
        indicatorName: matchedInd.name,
        category: matchedInd.category,
        ageGroup: matchedInd.ageGroup,
        ageBracket,
        year,
        month,
        targetValue: matchedInd.spmTarget,
        numerator,
        denominator,
        achievementRate,
        notes: notes || undefined,
        updatedAt: new Date().toISOString(),
        updatedBy: `${currentUserName} (Import Excel)`,
      };

      validRecords.push(record);
    }
  });

  return {
    fileName: file.name,
    totalRows: rawRows.length,
    validRecords,
    invalidRows,
    errors: globalErrors,
  };
}

/**
 * Export filtered health dataset to comprehensive Excel workbook (.xlsx)
 */
export function exportHealthDataToExcel(
  records: IndicatorDataRecord[],
  indicators: HealthIndicator[],
  puskesmasList: Puskesmas[],
  titleMeta: { year: number | string; month: number | string; pkmFilter: string }
): void {
  const wb = XLSX.utils.book_new();

  const indMap = new Map<string, HealthIndicator>();
  indicators.forEach(i => indMap.set(i.id, i));

  // Sheet 1: Detail Records
  const detailData = records.map((r, index) => {
    const ind = indMap.get(r.indicatorId);
    const status = ind ? getIndicatorSPMStatus(ind, r.achievementRate) : 'WASPADA';
    return {
      'No': index + 1,
      'Kode Puskesmas': r.puskesmasId,
      'Nama Puskesmas': r.puskesmasName,
      'Tahun': r.year,
      'Bulan': r.month,
      'Kelompok Umur': r.ageBracket ? `${r.ageBracket} Tahun` : '',
      'Kategori': r.category,
      'Kode Indikator': r.indicatorCode,
      'Nama Indikator': r.indicatorName,
      'Target SPM (%)': r.targetValue,
      'Realisasi (Numerator)': r.numerator,
      'Sasaran (Denominator)': r.denominator,
      'Capaian (%)': r.achievementRate,
      'Status SPM': status,
      'Catatan': r.notes || '-',
      'Terakhir Diperbarui': r.updatedAt.split('T')[0],
      'Petugas': r.updatedBy,
    };
  });

  const wsDetail = XLSX.utils.json_to_sheet(detailData);
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Detail_Capaian_Indikator');

  // Sheet 2: Matriks Ringkasan Capaian per Puskesmas
  const summaryMatrix: Record<string, any>[] = [];
  puskesmasList.forEach(p => {
    const pkmRecords = records.filter(r => r.puskesmasId === p.id);
    if (pkmRecords.length === 0) return;

    const row: Record<string, any> = {
      'Kode': p.code,
      'Nama Puskesmas': p.name,
      'Kecamatan': p.district,
      'Jumlah Data': pkmRecords.length,
    };

    let totalScore = 0;
    pkmRecords.forEach(r => {
      row[r.indicatorCode] = `${r.achievementRate}%`;
      totalScore += r.achievementRate;
    });

    row['Rata-rata Capaian'] = `${(totalScore / pkmRecords.length).toFixed(1)}%`;
    summaryMatrix.push(row);
  });

  const wsSummary = XLSX.utils.json_to_sheet(summaryMatrix);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Matriks_Komparasi_Puskesmas');

  // File naming
  const fileName = `Laporan_Data_Kesehatan_${titleMeta.year}_Bulan_${titleMeta.month}.xlsx`.replace(/\s+/g, '_');
  XLSX.writeFile(wb, fileName);
}

/**
 * Dashboard Specification 7: Export records to CSV format
 */
export function exportToCSV(records: IndicatorDataRecord[], filename: string = 'Ekspor_Data_Kesehatan.csv'): void {
  const csvRows: Record<string, any>[] = records.map((r, idx) => ({
    'No': idx + 1,
    'Kode Puskesmas': r.puskesmasId,
    'Nama Puskesmas': r.puskesmasName,
    'Tahun': r.year,
    'Bulan': r.month,
    'Kelompok Umur': r.ageBracket ? `${r.ageBracket} Tahun` : '',
    'Kategori': r.category,
    'Kode Indikator': r.indicatorCode,
    'Nama Indikator': r.indicatorName,
    'Target SPM (%)': r.targetValue,
    'Realisasi (Numerator)': r.numerator,
    'Sasaran (Denominator)': r.denominator,
    'Capaian (%)': r.achievementRate,
    'Status Nilai': r.achievementRate >= r.targetValue ? 'TERCAPAI' : 'BELUM TERCAPAI',
    'Catatan': r.notes || '-',
    'Terakhir Diperbarui': r.updatedAt.split('T')[0],
    'Petugas': r.updatedBy,
  }));

  const worksheet = XLSX.utils.json_to_sheet(csvRows);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);

  // Download with BOM for UTF-8 Excel compatibility
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
