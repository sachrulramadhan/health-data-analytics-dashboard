import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  HealthIndicator, 
  Puskesmas, 
  IndicatorDataRecord, 
  UserAccount, 
  HealthCategory, 
  AgeGroup,
  ImportRecord,
  AuditLog,
  StandardAgeBracket
} from '../types/health';
import { 
  INITIAL_INDICATORS, 
  INITIAL_PUSKESMAS, 
  INITIAL_USERS, 
  generateSeedDataRecords 
} from '../data/mockData';
import { calculateIndicatorPercentage, validateIndicatorRecord } from '../utils/dataValidation';

interface MutationResult {
  success: boolean;
  message?: string;
}

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'AUD-001',
    timestamp: '2026-04-05T09:15:00Z',
    user: 'Siti Rahmawati, S.Tr.Keb',
    userRole: 'DATA_MANAGER',
    action: 'IMPORT',
    puskesmasName: 'Wilayah Terpadu Kab/Kota',
    indicatorName: 'Batch 96 Indikator SPM Triwulan',
    period: '2026 - Q1',
    previousValue: null,
    newValue: '96 data entri berhasil divalidasi',
    changeSummary: 'Import data massal via file Laporan_Rutin_Puskesmas_Q1_2026.xlsx',
  },
  {
    id: 'AUD-002',
    timestamp: '2026-03-22T11:20:00Z',
    user: 'dr. Farhan Hakim, M.Kes',
    userRole: 'DINKES',
    action: 'UPDATE',
    recordId: 'REC-000045',
    puskesmasName: 'Puskesmas Melati',
    indicatorName: 'Prevalensi Balita Stunting',
    period: '2025 - Bulan 12',
    previousValue: '14.2% (128 / 900)',
    newValue: '11.8% (106 / 900)',
    changeSummary: 'Koreksi verifikasi hasil sweeping posyandu penimbangan serentak',
  },
  {
    id: 'AUD-003',
    timestamp: '2026-02-14T08:45:00Z',
    user: 'Administrator Sistem',
    userRole: 'ADMIN',
    action: 'CREATE',
    recordId: 'REC-000012',
    puskesmasName: 'Puskesmas Cempaka',
    indicatorName: 'Cakupan Imunisasi Dasar Lengkap (IDL)',
    period: '2025 - Bulan 01',
    previousValue: null,
    newValue: '96.2% (77 / 80)',
    changeSummary: 'Entri manual capaian program imunisasi catch-up Posyandu Mawar',
  },
];

interface HealthDataContextType {
  indicators: HealthIndicator[];
  puskesmasList: Puskesmas[];
  records: IndicatorDataRecord[];
  currentUser: UserAccount;
  allUsers: UserAccount[];
  setCurrentUser: (user: UserAccount) => void;
  importLogs: ImportRecord[];
  
  // Auth state & methods (F01)
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
  resetPassword: (email: string) => { success: boolean; message: string };
  changePassword: (currentPass: string, newPass: string) => { success: boolean; message: string };
  authModal: { isOpen: boolean; mode: 'LOGIN' | 'RESET' | 'CHANGE_PASSWORD' };
  openAuthModal: (mode?: 'LOGIN' | 'RESET' | 'CHANGE_PASSWORD') => void;
  closeAuthModal: () => void;

  // Filter state
  selectedYear: number | 'ALL';
  setSelectedYear: (y: number | 'ALL') => void;
  selectedMonth: number | 'ALL';
  setSelectedMonth: (m: number | 'ALL') => void;
  selectedPuskesmasId: string | 'ALL';
  setSelectedPuskesmasId: (id: string | 'ALL') => void;
  selectedKecamatan: string | 'ALL';
  setSelectedKecamatan: (k: string | 'ALL') => void;
  kecamatanList: string[];
  selectedCategory: HealthCategory | 'ALL';
  setSelectedCategory: (cat: HealthCategory | 'ALL') => void;
  selectedAgeGroup: AgeGroup | 'ALL';
  setSelectedAgeGroup: (ag: AgeGroup | 'ALL') => void;
  selectedAgeBracket: StandardAgeBracket | 'ALL';
  setSelectedAgeBracket: (bracket: StandardAgeBracket | 'ALL') => void;
  selectedIndicatorId: string | 'ALL';
  setSelectedIndicatorId: (indId: string | 'ALL') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Active filtered records
  filteredRecords: IndicatorDataRecord[];

  // Audit Trail (Business Rule 7)
  auditLogs: AuditLog[];

  // Mutations
  addRecord: (record: Omit<IndicatorDataRecord, 'id' | 'updatedAt' | 'achievementRate' | 'updatedBy'>) => MutationResult;
  updateRecord: (id: string, updates: Partial<IndicatorDataRecord>) => MutationResult;
  deleteRecord: (id: string) => void;
  importRecordsBatch: (records: IndicatorDataRecord[], log: Omit<ImportRecord, 'id'>) => MutationResult;
  resetToDefaultData: () => void;
  updateIndicator: (id: string, updates: Partial<HealthIndicator>) => void;
}

const STORAGE_KEYS = {
  RECORDS: 'hda_health_records_v1',
  INDICATORS: 'hda_health_indicators_v1',
  PUSKESMAS: 'hda_health_puskesmas_v1',
  CURRENT_USER: 'hda_health_user_v1',
  IMPORT_LOGS: 'hda_health_import_logs_v1',
  AUDIT_LOGS: 'hda_health_audit_logs_v1',
};

const HealthDataContext = createContext<HealthDataContextType | undefined>(undefined);

export const HealthDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [indicators, setIndicators] = useState<HealthIndicator[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INDICATORS);
    return saved ? JSON.parse(saved) : INITIAL_INDICATORS;
  });

  const [puskesmasList] = useState<Puskesmas[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PUSKESMAS);
    return saved ? JSON.parse(saved) : INITIAL_PUSKESMAS;
  });

  const [records, setRecords] = useState<IndicatorDataRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved records', e);
      }
    }
    return generateSeedDataRecords();
  });

  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_USERS[0]; // Default: Dr. Farhan (Dinkes)
  });

  const [importLogs, setImportLogs] = useState<ImportRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.IMPORT_LOGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'LOG-001',
        fileName: 'Laporan_Rutin_Puskesmas_Q1_2026.xlsx',
        importedAt: '2026-04-05T09:15:00Z',
        totalRows: 96,
        validRows: 96,
        invalidRows: 0,
        status: 'SUCCESS',
        errors: [],
      },
      {
        id: 'LOG-002',
        fileName: 'Data_Gizi_Stunting_Dinkes_2025.xlsx',
        importedAt: '2026-03-20T14:40:00Z',
        totalRows: 120,
        validRows: 118,
        invalidRows: 2,
        status: 'WARNING',
        errors: ['Baris 45: Format sasaran kosong', 'Baris 78: Kode puskesmas salah'],
      },
    ];
  });

  // Auth states (F01)
  const [allUsersList, setAllUsersList] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('hda_all_users_v1');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('hda_is_authenticated_v1');
    return saved !== null ? saved === 'true' : true;
  });

  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'LOGIN' | 'RESET' | 'CHANGE_PASSWORD' }>({
    isOpen: false,
    mode: 'LOGIN',
  });

  // Filter states
  const [selectedYear, setSelectedYear] = useState<number | 'ALL'>(2025);
  const [selectedMonth, setSelectedMonth] = useState<number | 'ALL'>('ALL');
  const [selectedPuskesmasId, setSelectedPuskesmasId] = useState<string | 'ALL'>('ALL');
  const [selectedKecamatan, setSelectedKecamatan] = useState<string | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<HealthCategory | 'ALL'>('ALL');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroup | 'ALL'>('ALL');
  const [selectedAgeBracket, setSelectedAgeBracket] = useState<StandardAgeBracket | 'ALL'>('ALL');
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Business Rule 7: Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_AUDIT_LOGS;
  });

  // Derive unique Kecamatan from Puskesmas list
  const kecamatanList = useMemo(() => {
    const set = new Set<string>();
    puskesmasList.forEach(p => {
      if (p.district) set.add(p.district);
    });
    return Array.from(set).sort();
  }, [puskesmasList]);

  // Persist auth
  useEffect(() => {
    localStorage.setItem('hda_is_authenticated_v1', String(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('hda_all_users_v1', JSON.stringify(allUsersList));
  }, [allUsersList]);

  // Auth methods
  const openAuthModal = (mode: 'LOGIN' | 'RESET' | 'CHANGE_PASSWORD' = 'LOGIN') => {
    setAuthModal({ isOpen: true, mode });
  };

  const closeAuthModal = () => {
    setAuthModal(prev => ({ ...prev, isOpen: false }));
  };

  const login = (email: string, pass: string): { success: boolean; message?: string } => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = allUsersList.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      return { success: false, message: 'Akun dengan email tersebut tidak ditemukan dalam sistem.' };
    }

    if (user.password && user.password !== pass) {
      return { success: false, message: 'Kata sandi tidak sesuai. Silakan periksa kembali.' };
    }

    setCurrentUser(user);
    setIsAuthenticated(true);
    closeAuthModal();
    return { success: true, message: `Selamat datang kembali, ${user.name}!` };
  };

  const logout = () => {
    setIsAuthenticated(false);
    // Switch to Viewer (Read-only) default profile
    const viewer = allUsersList.find(u => u.role === 'VIEWER') || allUsersList[3];
    setCurrentUser(viewer);
  };

  const resetPassword = (email: string): { success: boolean; message: string } => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = allUsersList.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      return { success: false, message: 'Alamat email tidak terdaftar dalam database sistem kesehatan.' };
    }

    // Reset password to default 'password123'
    setAllUsersList(prev => prev.map(u => u.id === user.id ? { ...u, password: 'password123' } : u));
    return { 
      success: true, 
      message: `Tautan & token reset telah diverifikasi. Kata sandi akun ${user.name} direset ke: password123` 
    };
  };

  const changePassword = (currentPass: string, newPass: string): { success: boolean; message: string } => {
    if (currentUser.password && currentUser.password !== currentPass) {
      return { success: false, message: 'Kata sandi lama yang Anda masukkan tidak sesuai.' };
    }

    if (newPass.length < 6) {
      return { success: false, message: 'Kata sandi baru minimal harus 6 karakter.' };
    }

    setAllUsersList(prev => prev.map(u => u.id === currentUser.id ? { ...u, password: newPass } : u));
    setCurrentUser(prev => ({ ...prev, password: newPass }));
    closeAuthModal();
    return { success: true, message: 'Kata sandi Anda berhasil diperbarui.' };
  };

  // Persist records
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  }, [records]);

  // Persist indicators
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INDICATORS, JSON.stringify(indicators));
  }, [indicators]);

  // Persist current user
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    // If switched to a Puskesmas user, lock puskesmas filter to their facility by default
    if (currentUser.role === 'PUSKESMAS' && currentUser.puskesmasId) {
      setSelectedPuskesmasId(currentUser.puskesmasId);
    }
  }, [currentUser]);

  // Persist import logs
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IMPORT_LOGS, JSON.stringify(importLogs));
  }, [importLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Computed filtered records
  const filteredRecords = React.useMemo(() => {
    return records.filter((r) => {
      // Role enforcement: Puskesmas role can only view their own Puskesmas records
      if (currentUser.role === 'PUSKESMAS' && currentUser.puskesmasId && r.puskesmasId !== currentUser.puskesmasId) {
        return false;
      }

      // Year filter
      if (selectedYear !== 'ALL' && r.year !== selectedYear) return false;

      // Month filter
      if (selectedMonth !== 'ALL' && r.month !== selectedMonth) return false;

      // Puskesmas filter
      if (selectedPuskesmasId !== 'ALL' && r.puskesmasId !== selectedPuskesmasId) return false;

      // Kecamatan filter (Business Rule 4 & Dashboard Specification 3)
      if (selectedKecamatan !== 'ALL') {
        const pkm = puskesmasList.find(p => p.id === r.puskesmasId);
        if (!pkm || pkm.district !== selectedKecamatan) return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && r.category !== selectedCategory) return false;

      // Age group filter (F05 requirement)
      if (selectedAgeGroup !== 'ALL' && r.ageGroup !== selectedAgeGroup) return false;

      if (selectedAgeBracket !== 'ALL' && r.ageBracket !== selectedAgeBracket) return false;

      // Indicator filter (Flow 2 requirement)
      if (selectedIndicatorId !== 'ALL' && r.indicatorId !== selectedIndicatorId) return false;

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = r.indicatorName.toLowerCase().includes(q);
        const matchCode = r.indicatorCode.toLowerCase().includes(q);
        const matchPkm = r.puskesmasName.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchPkm) return false;
      }

      return true;
    });
  }, [records, currentUser, selectedYear, selectedMonth, selectedPuskesmasId, selectedKecamatan, puskesmasList, selectedCategory, selectedAgeGroup, selectedAgeBracket, selectedIndicatorId, searchQuery]);

  // Add record (with Business Rule 7 Audit Trail)
  const addRecord = (newRec: Omit<IndicatorDataRecord, 'id' | 'updatedAt' | 'achievementRate' | 'updatedBy'>) => {
    const validation = validateIndicatorRecord(newRec, indicators, puskesmasList, records);
    if (validation.errors.length > 0 || !validation.puskesmas || !validation.indicator) {
      return { success: false, message: validation.errors.join(' ') };
    }
    const rate = calculateIndicatorPercentage(newRec.numerator, newRec.denominator);
    if (rate === null) return { success: false, message: 'Tidak dapat menghitung persentase tanpa denominator yang valid.' };
    const timestamp = new Date().toISOString();
    const fullRecord: IndicatorDataRecord = {
      ...newRec,
      id: `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      puskesmasName: validation.puskesmas.name,
      indicatorCode: validation.indicator.code,
      indicatorName: validation.indicator.name,
      category: validation.indicator.category,
      ageGroup: validation.indicator.ageGroup,
      targetValue: validation.indicator.spmTarget,
      puskesmas_id: newRec.puskesmasId,
      indicator_id: newRec.indicatorId,
      period_id: `${newRec.year}-${newRec.month}`,
      value: rate,
      target: newRec.targetValue,
      percentage: rate,
      achievementRate: rate,
      updatedAt: timestamp,
      updatedBy: `${currentUser.name} (${currentUser.title})`,
    };

    setRecords(prev => [fullRecord, ...prev]);

    // Audit Log entry
    const createAudit: AuditLog = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      user: currentUser.name,
      userRole: currentUser.role,
      action: 'CREATE',
      recordId: fullRecord.id,
      puskesmasName: fullRecord.puskesmasName,
      indicatorName: fullRecord.indicatorName,
      period: `${fullRecord.year} - Bln ${String(fullRecord.month).padStart(2, '0')}`,
      previousValue: null,
      newValue: `${rate}% (${newRec.numerator} / ${newRec.denominator})`,
      previousData: null,
      newData: fullRecord,
      changeSummary: `Entri capaian baru untuk ${fullRecord.puskesmasName} - ${fullRecord.indicatorName}`,
    };
    setAuditLogs(prev => [createAudit, ...prev]);
    return { success: true };
  };

  // Update record (with Business Rule 7 Audit Trail)
  const updateRecord = (id: string, updates: Partial<IndicatorDataRecord>) => {
    const existing = records.find(r => r.id === id);
    if (!existing) return { success: false, message: 'Data yang akan diperbarui tidak ditemukan.' };
    const candidate = { ...existing, ...updates };
    const validation = validateIndicatorRecord(candidate, indicators, puskesmasList, records, id);
    if (validation.errors.length > 0 || !validation.puskesmas || !validation.indicator) {
      return { success: false, message: validation.errors.join(' ') };
    }
    const rate = calculateIndicatorPercentage(candidate.numerator, candidate.denominator);
    if (rate === null) return { success: false, message: 'Tidak dapat menghitung persentase tanpa denominator yang valid.' };
    const timestamp = new Date().toISOString();
    const updatedRecord: IndicatorDataRecord = {
      ...candidate,
      id: existing.id,
      puskesmasName: validation.puskesmas.name,
      indicatorCode: validation.indicator.code,
      indicatorName: validation.indicator.name,
      category: validation.indicator.category,
      ageGroup: validation.indicator.ageGroup,
      targetValue: validation.indicator.spmTarget,
      puskesmas_id: validation.puskesmas.id,
      indicator_id: validation.indicator.id,
      period_id: `${candidate.year}-${candidate.month}`,
      value: rate,
      target: validation.indicator.spmTarget,
      percentage: rate,
      achievementRate: rate,
      updatedAt: timestamp,
      updatedBy: `${currentUser.name} (${currentUser.title})`,
    };
    setRecords(prev => prev.map(rec => rec.id === id ? updatedRecord : rec));

    const updateAudit: AuditLog = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      user: currentUser.name,
      userRole: currentUser.role,
      action: 'UPDATE',
      recordId: id,
      puskesmasName: existing.puskesmasName,
      indicatorName: existing.indicatorName,
      period: `${existing.year} - Bln ${String(existing.month).padStart(2, '0')}`,
      previousValue: `${existing.achievementRate}% (${existing.numerator} / ${existing.denominator})`,
      newValue: `${rate}% (${candidate.numerator} / ${candidate.denominator})`,
      previousData: existing,
      newData: updatedRecord,
      changeSummary: `Pembaruan data capaian (${existing.achievementRate}% → ${rate}%)`,
    };
    setAuditLogs(prev => [updateAudit, ...prev]);
    return { success: true };
  };

  // Delete record (with Business Rule 7 Audit Trail)
  const deleteRecord = (id: string) => {
    const target = records.find(r => r.id === id);
    setRecords(prev => prev.filter(r => r.id !== id));

    if (target) {
      const deleteAudit: AuditLog = {
        id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        user: currentUser.name,
        userRole: currentUser.role,
        action: 'DELETE',
        recordId: id,
        puskesmasName: target.puskesmasName,
        indicatorName: target.indicatorName,
        period: `${target.year} - Bln ${String(target.month).padStart(2, '0')}`,
        previousValue: `${target.achievementRate}% (${target.numerator} / ${target.denominator})`,
        newValue: null,
        previousData: target,
        newData: null,
        changeSummary: `Penghapusan data capaian untuk ${target.puskesmasName} - ${target.indicatorName}`,
      };
      setAuditLogs(prev => [deleteAudit, ...prev]);
    }
  };

  // Batch import records (with Business Rule 7 Audit Trail)
  const importRecordsBatch = (newRecords: IndicatorDataRecord[], logData: Omit<ImportRecord, 'id'>) => {
    if (newRecords.length === 0) return { success: false, message: 'Tidak ada data valid untuk disimpan.' };
    if (logData.validRows !== newRecords.length) {
      return { success: false, message: 'Jumlah baris valid pada log import tidak sesuai dengan data yang akan disimpan.' };
    }

    // Ensure data dictionary compatibility for imported records
    const acceptedRecords: IndicatorDataRecord[] = [];
    for (const record of newRecords) {
      const validation = validateIndicatorRecord(
        record,
        indicators,
        puskesmasList,
        [...records, ...acceptedRecords]
      );
      if (validation.errors.length > 0 || !validation.puskesmas || !validation.indicator) {
        return {
          success: false,
          message: `Import dibatalkan: ${validation.errors.join(' ') || 'Referensi data tidak valid.'}`,
        };
      }
      const rate = calculateIndicatorPercentage(record.numerator, record.denominator);
      if (rate === null) {
        return { success: false, message: 'Import dibatalkan: denominator tidak valid untuk perhitungan persentase.' };
      }
      acceptedRecords.push({
        ...record,
        puskesmasName: validation.puskesmas.name,
        indicatorCode: validation.indicator.code,
        indicatorName: validation.indicator.name,
        category: validation.indicator.category,
        ageGroup: validation.indicator.ageGroup,
        targetValue: validation.indicator.spmTarget,
        puskesmas_id: validation.puskesmas.id,
        indicator_id: validation.indicator.id,
        period_id: `${record.year}-${record.month}`,
        value: rate,
        target: validation.indicator.spmTarget,
        percentage: rate,
        achievementRate: rate,
      });
    }

    setRecords(prev => [...acceptedRecords, ...prev]);
    const newLog: ImportRecord = {
      ...logData,
      id: `LOG-${Date.now()}`,
      filename: logData.fileName,
      imported_by: currentUser.name,
      imported_at: logData.importedAt,
      total_rows: logData.totalRows,
      valid_rows: logData.validRows,
      invalid_rows: logData.invalidRows,
    };
    setImportLogs(prev => [newLog, ...prev]);

    // Audit log for import batch
    const importAudit: AuditLog = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      user: currentUser.name,
      userRole: currentUser.role,
      action: 'IMPORT',
      puskesmasName: 'Wilayah Terpadu',
      indicatorName: `Batch ${acceptedRecords.length} Data Capaian`,
      period: 'Periode Beragam',
      previousValue: null,
      newValue: `${acceptedRecords.length} data tersimpan`,
      previousData: null,
      newData: acceptedRecords,
      changeSummary: `Import data via file ${logData.fileName} (${acceptedRecords.length} baris valid dari total ${logData.totalRows})`,
    };
    setAuditLogs(prev => [importAudit, ...prev]);
    return { success: true };
  };

  // Reset to default seed data
  const resetToDefaultData = () => {
    const seed = generateSeedDataRecords();
    setRecords(seed);
    setIndicators(INITIAL_INDICATORS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.RECORDS);
    localStorage.removeItem(STORAGE_KEYS.INDICATORS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
  };

  // Update indicator
  const updateIndicator = (id: string, updates: Partial<HealthIndicator>) => {
    setIndicators(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  return (
    <HealthDataContext.Provider
      value={{
        indicators,
        puskesmasList,
        records,
        currentUser,
        allUsers: allUsersList,
        setCurrentUser,
        importLogs,
        isAuthenticated,
        login,
        logout,
        resetPassword,
        changePassword,
        authModal,
        openAuthModal,
        closeAuthModal,
        selectedYear,
        setSelectedYear,
        selectedMonth,
        setSelectedMonth,
        selectedPuskesmasId,
        setSelectedPuskesmasId,
        selectedKecamatan,
        setSelectedKecamatan,
        kecamatanList,
        selectedCategory,
        setSelectedCategory,
        selectedAgeGroup,
        setSelectedAgeGroup,
        selectedAgeBracket,
        setSelectedAgeBracket,
        selectedIndicatorId,
        setSelectedIndicatorId,
        searchQuery,
        setSearchQuery,
        filteredRecords,
        auditLogs,
        addRecord,
        updateRecord,
        deleteRecord,
        importRecordsBatch,
        resetToDefaultData,
        updateIndicator,
      }}
    >
      {children}
    </HealthDataContext.Provider>
  );
};

export const useHealthData = () => {
  const context = useContext(HealthDataContext);
  if (!context) {
    throw new Error('useHealthData must be used within a HealthDataProvider');
  }
  return context;
};
