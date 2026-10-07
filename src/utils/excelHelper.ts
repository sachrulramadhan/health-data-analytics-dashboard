import * as XLSX from 'xlsx';
import { HealthIndicator, IndicatorDataRecord, Puskesmas } from '../types/health';
import { getIndicatorSPMStatus } from './healthCalculations';

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

  // Duplicate tracker within uploaded file
  const fileDuplicatesTracker = new Set<string>();

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
    const rawYear = row['Tahun'] || row['tahun'];
    const rawMonth = row['Bulan (1-12)'] || row['Bulan'] || row['bulan'];

    if (rawYear === '' || rawYear === undefined) {
      errors.push('Field Tahun wajib diisi (tidak boleh kosong).');
    }
    const year = Number(rawYear);

    if (isNaN(year) || year < 2020 || year > 2030) {
      errors.push(`Tahun tidak valid: '${rawYear}'. Angka harus berada di rentang 2020-2030.`);
    }

    if (rawMonth === '' || rawMonth === undefined) {
      errors.push('Field Bulan wajib diisi (tidak boleh kosong).');
    }
    const month = Number(rawMonth);

    if (isNaN(month) || month < 1 || month > 12) {
      errors.push(`Bulan tidak valid: '${rawMonth}'. Gunakan angka numerik 1 sampai 12.`);
    }

    // Numerator and Denominator
    const rawNum = row['Numerator (Realisasi)'] ?? row['Numerator'] ?? row['realisasi'] ?? row['numerator'];
    const rawDenom = row['Denominator (Sasaran)'] ?? row['Denominator'] ?? row['sasaran'] ?? row['denominator'];

    if (rawNum === '' || rawNum === undefined) {
      errors.push('Field Numerator (realisasi) wajib diisi.');
    }
    if (rawDenom === '' || rawDenom === undefined) {
      errors.push('Field Denominator (sasaran) wajib diisi.');
    }

    const numerator = Number(rawNum);
    const denominator = Number(rawDenom);

    if (isNaN(numerator) || numerator < 0) {
      errors.push(`Numerator harus berupa angka numerik non-negatif. Ditemukan: '${rawNum}'.`);
    }

    if (isNaN(denominator) || denominator <= 0) {
      errors.push(`Denominator harus berupa angka numerik lebih besar dari 0. Ditemukan: '${rawDenom}'.`);
    }

    // Duplicate Check (Business Rule 1: Duplikasi harus diperiksa)
    if (matchedPkm && matchedInd && !isNaN(year) && !isNaN(month)) {
      const rowKey = `${matchedPkm.id}_${matchedInd.id}_${year}_${month}`;
      if (fileDuplicatesTracker.has(rowKey)) {
        errors.push(`Duplikasi file: Data ${matchedPkm.name} - ${matchedInd.name} periode ${year} bln ${month} muncul ganda dalam file Excel ini.`);
      } else {
        fileDuplicatesTracker.add(rowKey);
      }

      // Check against current database
      const existingInDb = existingRecords.find(r => 
        r.puskesmasId === matchedPkm!.id && 
        r.indicatorId === matchedInd!.id && 
        r.year === year && 
        r.month === month
      );
      if (existingInDb) {
        errors.push(`Duplikasi database: Sudah ada catatan tersimpan untuk ${matchedPkm.name} - ${matchedInd.name} periode ${year} bln ${month} (Nilai saat ini: ${existingInDb.achievementRate}%).`);
      }
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
      const achievementRate = Number(((numerator / denominator) * 100).toFixed(1));
      const record: IndicatorDataRecord = {
        id: `REC-IMP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        puskesmasId: matchedPkm.id,
        puskesmasName: matchedPkm.name,
        indicatorId: matchedInd.id,
        indicatorCode: matchedInd.code,
        indicatorName: matchedInd.name,
        category: matchedInd.category,
        ageGroup: matchedInd.ageGroup,
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
