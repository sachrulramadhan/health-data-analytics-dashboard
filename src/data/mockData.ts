import { HealthCategoryInfo, HealthIndicator, Puskesmas, IndicatorDataRecord, UserAccount, AgeGroupInfo, StandardAgeBracketInfo } from '../types/health';

export const HEALTH_CATEGORIES: HealthCategoryInfo[] = [
  {
    id: 'KIA_KB',
    name: 'Kesehatan Ibu, Anak & KB',
    shortName: 'KIA & KB',
    description: 'Pelayanan antenatal care, persalinan faskes, dan kesehatan maternal & neonatal',
    color: '#0284c7', // Sky blue
  },
  {
    id: 'IMUNISASI',
    name: 'Imunisasi & Penyakit Menular',
    shortName: 'Imunisasi',
    description: 'Cakupan imunisasi dasar lengkap balita, eliminasi campak, dan surveilans',
    color: '#059669', // Emerald
  },
  {
    id: 'GIZI_STUNTING',
    name: 'Gizi Masyarakat & Penurunan Stunting',
    shortName: 'Gizi & Stunting',
    description: 'Prevalensi stunting, wasting, gizi kurang, dan intervensi gizi spesifik',
    color: '#d97706', // Amber
  },
  {
    id: 'PENYAKIT_MENULAR',
    name: 'Pengendalian Penyakit Menular (P2P)',
    shortName: 'P2P Menular',
    description: 'Tuberkulosis (TBC), HIV/AIDS, DBD, dan ISPA',
    color: '#dc2626', // Red
  },
  {
    id: 'PTM_JIWA',
    name: 'Penyakit Tidak Menular & Kesehatan Jiwa',
    shortName: 'PTM & Jiwa',
    description: 'Skrining hipertensi, diabetes melitus, kanker serviks, dan pelayanan ODGJ berat',
    color: '#7c3aed', // Purple
  },
  {
    id: 'KESLING',
    name: 'Kesehatan Lingkungan & Sanitasi',
    shortName: 'Kesling & STBM',
    description: 'Sanitasi Total Berbasis Masyarakat (STBM), air bersih, dan pengawasan TFU',
    color: '#0d9488', // Teal
  },
];

export const AGE_GROUPS: AgeGroupInfo[] = [
  {
    id: 'NEONATUS',
    label: 'Neonatus',
    rangeDescription: '0 - 28 hari',
    description: 'Pelayanan kesehatan bayi baru lahir (kunjungan KN lengkap)',
    color: '#0284c7',
  },
  {
    id: 'BAYI',
    label: 'Bayi',
    rangeDescription: '0 - 11 bulan',
    description: 'Imunisasi dasar lengkap dan pemantauan ASI eksklusif',
    color: '#059669',
  },
  {
    id: 'BALITA',
    label: 'Balita',
    rangeDescription: '12 - 59 bulan',
    description: 'Penurunan stunting, deteksi gizi buruk/kurang, dan PMT pemulihan',
    color: '#d97706',
  },
  {
    id: 'REMAJA',
    label: 'Usia Sekolah & Remaja',
    rangeDescription: '6 - 18 tahun',
    description: 'Skrining anemia siswi, kesehatan reproduksi, dan imunisasi berkala',
    color: '#7c3aed',
  },
  {
    id: 'PRODUKTIF',
    label: 'Usia Produktif & Maternal',
    rangeDescription: '19 - 59 tahun',
    description: 'Pelayanan antenatal K4/K6, persalinan faskes, skrining PTM Hipertensi & DM',
    color: '#0d9488',
  },
  {
    id: 'LANSIA',
    label: 'Lanjut Usia (Lansia)',
    rangeDescription: '≥ 60 tahun',
    description: 'Pelayanan kesehatan geriatri, posyandu lansia, dan penyakit kronis',
    color: '#dc2626',
  },
  {
    id: 'SEMUA_UMUR',
    label: 'Semua Umur / Sanitasi',
    rangeDescription: 'Lintas Generasi',
    description: 'Penemuan kasus TB paru, kesehatan jiwa berat (ODGJ), dan sanitasi STBM',
    color: '#475569',
  },
];

// Business Rule 2: Spesifikasi Kelompok Umur 10-49 Tahun (rentang 5 tahunan)
export const STANDARD_AGE_BRACKETS: StandardAgeBracketInfo[] = [
  { bracket: '10-14', label: '10–14 Tahun', minAge: 10, maxAge: 14, description: 'Kelompok Remaja Awal (Usia Pendidikan Dasar/SMP)' },
  { bracket: '15-19', label: '15–19 Tahun', minAge: 15, maxAge: 19, description: 'Kelompok Remaja Lanjut (Usia SMA / Prakonsepsi Awal)' },
  { bracket: '20-24', label: '20–24 Tahun', minAge: 20, maxAge: 24, description: 'Kelompok Dewasa Muda (Prakonsepsi & Skrining Pranikah)' },
  { bracket: '25-29', label: '25–29 Tahun', minAge: 25, maxAge: 29, description: 'Kelompok Usia Reproduksi Matang (Kesehatan Ibu Hamil Primipara)' },
  { bracket: '30-34', label: '30–34 Tahun', minAge: 30, maxAge: 34, description: 'Kelompok Usia Reproduksi & Produktif' },
  { bracket: '35-39', label: '35–39 Tahun', minAge: 35, maxAge: 39, description: 'Kelompok Usia Produktif & Waspada Risiko Tinggi Maternal' },
  { bracket: '40-44', label: '40–44 Tahun', minAge: 40, maxAge: 44, description: 'Kelompok Dewasa Menengah (Skrining PTM Hipertensi & Diabetes)' },
  { bracket: '45-49', label: '45–49 Tahun', minAge: 45, maxAge: 49, description: 'Kelompok Dewasa Menengah Lanjut (Skrining Kanker & PTM Lanjutan)' },
];

export const INITIAL_INDICATORS: HealthIndicator[] = [
  {
    id: 'IND-01',
    code: 'K4-BUMIL',
    name: 'Cakupan Kunjungan Ibu Hamil K4/K6',
    category: 'KIA_KB',
    ageGroup: 'PRODUKTIF',
    spmTarget: 100,
    unit: '%',
    description: 'Persentase ibu hamil yang memperoleh pelayanan antenatal minimal 6 kali sesuai standar.',
    direction: 'HIGHER_IS_BETTER',
    criticalThreshold: 75,
    interventionRecommendation: 'Tingkatkan pendampingan kader posyandu untuk sweeping ibu hamil trimester 1 dan koordinasi bidan desa.',
  },
  {
    id: 'IND-02',
    code: 'LINFAKES',
    name: 'Persalinan di Fasilitas Pelayanan Kesehatan',
    category: 'KIA_KB',
    ageGroup: 'PRODUKTIF',
    spmTarget: 100,
    unit: '%',
    description: 'Persentase persalinan ibu bersalin yang ditolong nakes di fasilitas pelayanan kesehatan resmi.',
    direction: 'HIGHER_IS_BETTER',
    criticalThreshold: 80,
    interventionRecommendation: 'Perkuat kemitraan bidan-dukun serta aktivasi program ambulans siaga desa di daerah terpencil.',
  },
  {
    id: 'IND-03',
    code: 'KN-LENGKAP',
    name: 'Pelayanan Kesehatan Bayi Baru Lahir (KN Lengkap)',
    category: 'KIA_KB',
    ageGroup: 'NEONATUS',
    spmTarget: 100,
    unit: '%',
    description: 'Cakupan pelayanan kesehatan neonatus (bayi usia 0-28 hari) minimal 3 kali kunjungan.',
    direction: 'HIGHER_IS_BETTER',
    criticalThreshold: 80,
    interventionRecommendation: 'Perketat jadwal home-visit bidan untuk KN1, KN2, dan KN3 pasca persalinan.',
  },
  {
    id: 'IND-04',
    code: 'IDL-BALITA',
    name: 'Cakupan Imunisasi Dasar Lengkap (IDL) Bayi',
    category: 'IMUNISASI',
    ageGroup: 'BAYI',
    spmTarget: 95,
    unit: '%',
    description: 'Persentase bayi usia 0-11 bulan yang telah menerima imunisasi HB0, BCG, DPT-HB-Hib, Polio, dan Campak/MR.',
    direction: 'HIGHER_IS_BETTER',
    criticalThreshold: 70,
    interventionRecommendation: 'Gelar Gerakan Imunisasi Kejar (Catch-up) dan edukasi anti-hoaks vaksin melalui tokoh agama.',
  },
  {
    id: 'IND-05',
    code: 'STUNTING-PREV',
    name: 'Prevalensi Balita Stunting (Pendek & Sangat Pendek)',
    category: 'GIZI_STUNTING',
    ageGroup: 'BALITA',
    spmTarget: 14,
    unit: '%',
    description: 'Persentase balita (0-59 bulan) dengan indeks TB/U di bawah -2 standar deviasi WHO (Target Nasional < 14%).',
    direction: 'LOWER_IS_BETTER',
    criticalThreshold: 18,
    interventionRecommendation: 'Distribusi PMT (Pemberian Makanan Tambahan) protein hewani (telur, ikan) dan audit kasus stunting terpadu.',
  },
  {
    id: 'IND-06',
    code: 'GIZI-KURANG-PMT',
    name: 'Pelayanan Balita Gizi Kurang Mendapat PMT',
    category: 'GIZI_STUNTING',
    ageGroup: 'BALITA',
    spmTarget: 90,
    unit: '%',
    description: 'Persentase balita gizi kurang (wasting) yang memperoleh makanan tambahan pemulihan selama 90 hari.',
    direction: 'HIGHER_IS_BETTER',
    criticalThreshold: 70,
    interventionRecommendation: 'Monitoring kepatuhan konsumsi biskuit PMT dan demo masak pangan lokal bergizi di Posyandu.',
  },
  {
    id: 'IND-07',
    code: 'TB-TEMUKAN',
    name: 'Penemuan Kasus Tuberkulosis (Treatment Coverage)',
    category: 'PENYAKIT_MENULAR',
    ageGroup: 'PRODUKTIF',
    spmTarget: 90,
    unit: '%',
    description: 'Persentase estimasi kasus TBC yang berhasil ditemukan dan diobati sesuai standar DOTS.',
    direction: 'HIGHER_IS_BETTER',
    criticalThreshold: 65,
    interventionRecommendation: 'Tingkatkan investigasi kontak serumah kasus TB indeks dan percepat rujukan Tes Cepat Molekuler (TCM).',
  },
  {
    id: 'IND-08',
    code: 'TB-TERDUGA',
    name: 'Pelayanan Kesehatan Terduga TBC Sesuai Standar',
    category: 'PENYAKIT_MENULAR',
    ageGroup: 'SEMUA_UMUR',
    spmTarget: 100,
    unit: '%',
    description: 'Cakupan orang dengan gejala terduga TBC yang dilakukan pemeriksaan mikroskopis atau TCM.',
    direction: 'HIGHER_IS_BETTER',
    criticalThreshold: 75,
    interventionRecommendation: 'Skrining aktif batuk di ruang tunggu poli rawat jalan Puskesmas dan jejaring klinik swasta.',
  },
  {
    id: 'IND-09',
    code: 'SKRIN-HT',
    name: 'Pelayanan Kesehatan Penderita Hipertensi Sesuai Standar',
    category: 'PTM_JIWA',
    ageGroup: 'PRODUKTIF',
    spmTarget: 100,
    unit: '%',
    description: 'Persentase penderita hipertensi usia ≥15 tahun yang mendapatkan pengobatan dan pemantauan tensi rutin.',
    direction: 'HIGHER_IS_BETTER',
    criticalThreshold: 60,
    interventionRecommendation: 'Aktifkan Posbindu PTM perkantoran dan program Prolanis (Program Pengelolaan Penyakit Kronis).',
  },
  {
    id: 'IND-10',
    code: 'SKRIN-DM',
    name: 'Pelayanan Kesehatan Penderita Diabetes Melitus (DM)',
    category: 'PTM_JIWA',
    ageGroup: 'PRODUKTIF',
    spmTarget: 100,
    unit: '%',
    description: 'Persentase penderita diabetes melitus yang mendapat pelayanan kesehatan glukosa darah berkala.',
    direction: 'HIGHER_IS_BETTER',
    criticalThreshold: 65,
    interventionRecommendation: 'Pastikan ketersediaan strip gula darah di puskesmas pembantu dan edukasi pola diet seimbang.',
  },
  {
    id: 'IND-11',
    code: 'ODGJ-BERAT',
    name: 'Pelayanan Kesehatan Orang Gangguan Jiwa (ODGJ) Berat',
    category: 'PTM_JIWA',
    ageGroup: 'PRODUKTIF',
    spmTarget: 100,
    unit: '%',
    description: 'Cakupan penderita ODGJ berat (psikotik akut / skizofrenia) yang mendapatkan pengobatan teratur dan bebas pasung.',
    direction: 'HIGHER_IS_BETTER',
    criticalThreshold: 70,
    interventionRecommendation: 'Koordinasi lintas sektor (Dinsos, Satpol PP, Babinsa) untuk bebas pasung dan home visit obat teratur.',
  },
  {
    id: 'IND-12',
    code: 'STBM-SBS',
    name: 'Desa/Kelurahan Stop Buang Air Besar Sembarangan (SBS)',
    category: 'KESLING',
    ageGroup: 'SEMUA_UMUR',
    spmTarget: 85,
    unit: '%',
    description: 'Persentase desa/kelurahan yang telah terverifikasi SBS (Open Defecation Free / ODF).',
    direction: 'HIGHER_IS_BETTER',
    criticalThreshold: 55,
    interventionRecommendation: 'Pemicuan sanitasi masyarakat dan kolaborasi dana desa untuk subsidi pembangunan jamban sehat.',
  },
];

export const INITIAL_PUSKESMAS: Puskesmas[] = [
  {
    id: 'PKM-01',
    code: 'P320101',
    name: 'Puskesmas Melati',
    status: true,
    district: 'Kecamatan Melati',
    headDoctor: 'dr. Maya Indriani, Sp.KKLP',
    address: 'Jl. Merdeka No. 45, Sentra Melati',
    totalPopulation: 45200,
    contact: '(021) 876-1234',
  },
  {
    id: 'PKM-02',
    code: 'P320102',
    name: 'Puskesmas Mawar',
    status: true,
    district: 'Kecamatan Mawar',
    headDoctor: 'dr. Ahmad Zulkarnain',
    address: 'Jl. Ahmad Yani No. 12, Mawar Jaya',
    totalPopulation: 52400,
    contact: '(021) 876-5678',
  },
  {
    id: 'PKM-03',
    code: 'P320103',
    name: 'Puskesmas Dahlia Sehat',
    status: true,
    district: 'Kecamatan Dahlia',
    headDoctor: 'dr. Ni Luh Putu Ayu',
    address: 'Jl. Pahlawan Kesehatan No. 8',
    totalPopulation: 38900,
    contact: '(021) 876-9012',
  },
  {
    id: 'PKM-04',
    code: 'P320104',
    name: 'Puskesmas Harapan Baru',
    status: true,
    district: 'Kecamatan Harapan Baru',
    headDoctor: 'dr. Bambang Prasetyo',
    address: 'Jl. Raya Sudirman Km 4',
    totalPopulation: 61200,
    contact: '(021) 876-3456',
  },
  {
    id: 'PKM-05',
    code: 'P320105',
    name: 'Puskesmas Sentosa',
    status: true,
    district: 'Kecamatan Sentosa',
    headDoctor: 'dr. Ratna Dewi, M.Kes',
    address: 'Jl. Kenanga Timur No. 19',
    totalPopulation: 41800,
    contact: '(021) 876-7890',
  },
  {
    id: 'PKM-06',
    code: 'P320106',
    name: 'Puskesmas Kencana Medika',
    status: true,
    district: 'Kecamatan Kencana',
    headDoctor: 'dr. Hendro Siswanto',
    address: 'Jl. Diponegoro No. 88',
    totalPopulation: 48600,
    contact: '(021) 876-2345',
  },
  {
    id: 'PKM-07',
    code: 'P320107',
    name: 'Puskesmas Bunga Bangsa',
    status: true,
    district: 'Kecamatan Bunga Bangsa',
    headDoctor: 'dr. Cut Meutia Zahra',
    address: 'Jl. Gajah Mada No. 102',
    totalPopulation: 35100,
    contact: '(021) 876-6789',
  },
  {
    id: 'PKM-08',
    code: 'P320108',
    name: 'Puskesmas Cendrawasih',
    status: true,
    district: 'Kecamatan Cendrawasih',
    headDoctor: 'dr. Andreas Wibowo',
    address: 'Jl. Lingkar Luar No. 27',
    totalPopulation: 57800,
    contact: '(021) 876-0123',
  },
];

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'USR-01',
    name: 'Siti Rahmawati, S.K.M',
    email: 'admin@dinkes.go.id',
    role: 'ADMIN',
    title: 'Administrator SIM-Kesehatan',
    password: 'admin123',
    avatarUrl: '/src/assets/images/avatar_health_officer_1791275750708.jpg',
  },
  {
    id: 'USR-02',
    name: 'Budi Hartono, S.Kom',
    email: 'manager@dinkes.go.id',
    role: 'DATA_MANAGER',
    title: 'Pengelola Data & Statistik Dinkes',
    password: 'manager123',
    avatarUrl: '/src/assets/images/avatar_health_officer_1791275750708.jpg',
  },
  {
    id: 'USR-03',
    name: 'dr. Maya Indriani, Sp.KKLP',
    email: 'puskesmas@melati.go.id',
    role: 'PUSKESMAS',
    title: 'Kepala Puskesmas Melati',
    password: 'puskesmas123',
    puskesmasId: 'PKM-01',
    puskesmasName: 'Puskesmas Melati',
  },
  {
    id: 'USR-04',
    name: 'Ir. Hendra Gunawan',
    email: 'viewer@publik.go.id',
    role: 'VIEWER',
    title: 'Pengamat / Akses Hanya-Baca (Viewer)',
    password: 'viewer123',
  },
  {
    id: 'USR-05',
    name: 'Dr. Farhan Santoso, M.Kes',
    email: 'farhan.santoso@dinkes.go.id',
    role: 'DINKES',
    title: 'Kepala Dinas Kesehatan Kabupaten/Kota',
    password: 'dinkes123',
    avatarUrl: '/src/assets/images/avatar_health_officer_1791275750708.jpg',
  },
];

// Helper to generate seed health data records across 2024, 2025, and early 2026
export const generateSeedDataRecords = (): IndicatorDataRecord[] => {
  const records: IndicatorDataRecord[] = [];
  let recordCounter = 1;

  // Base multiplier per Puskesmas to make performance varied and realistic
  const puskesmasProfiles: Record<string, { factor: number; stuntingBase: number }> = {
    'PKM-01': { factor: 0.94, stuntingBase: 9.8 },  // High performer
    'PKM-02': { factor: 0.88, stuntingBase: 12.4 }, // Good
    'PKM-03': { factor: 0.72, stuntingBase: 17.2 }, // Critical in Stunting & IDL
    'PKM-04': { factor: 0.91, stuntingBase: 11.0 }, // Good
    'PKM-05': { factor: 0.82, stuntingBase: 14.5 }, // Warning border
    'PKM-06': { factor: 0.86, stuntingBase: 13.1 }, // Moderate
    'PKM-07': { factor: 0.69, stuntingBase: 19.5 }, // Urgent attention needed
    'PKM-08': { factor: 0.89, stuntingBase: 12.0 }, // Good
  };

  // Base denominator scales for indicators
  const indicatorDenominators: Record<string, number> = {
    'IND-01': 380, // Bumil
    'IND-02': 365, // Bulin
    'IND-03': 350, // Neonatus
    'IND-04': 420, // Balita sasaran imunisasi
    'IND-05': 1850, // Total balita diukur
    'IND-06': 120, // Balita gizi kurang
    'IND-07': 140, // Target penemuan kasus TB
    'IND-08': 310, // Terduga TB diskrining
    'IND-09': 1450, // Sasaran hipertensi
    'IND-10': 780, // Sasaran DM
    'IND-11': 65,  // Sasaran ODGJ
    'IND-12': 10,  // Jumlah desa/kelurahan
  };

  // Years to generate: 2024 (full 12m), 2025 (full 12m), 2026 (Jan - Mar)
  const periods = [
    ...Array.from({ length: 12 }, (_, i) => ({ year: 2024, month: i + 1 })),
    ...Array.from({ length: 12 }, (_, i) => ({ year: 2025, month: i + 1 })),
    ...Array.from({ length: 4 }, (_, i) => ({ year: 2026, month: i + 1 })),
  ];

  INITIAL_PUSKESMAS.forEach((pkm) => {
    const profile = puskesmasProfiles[pkm.id] || { factor: 0.85, stuntingBase: 13.0 };

    INITIAL_INDICATORS.forEach((ind) => {
      const denomBase = indicatorDenominators[ind.id] || 200;

      periods.forEach((period) => {
        // Month progression factor (gradual improvement over time)
        const timeProgress = (period.year - 2024) * 0.04 + (period.month / 12) * 0.03;
        
        // Seasonal variation pseudo-random
        const seedSeed = (period.year * 17 + period.month * 31 + ind.code.length * 13 + pkm.name.length * 7) % 100;
        const variation = (seedSeed - 50) / 450; // -0.11 to +0.11

        let achievementRate: number;
        let numerator: number;
        let denominator = Math.round(denomBase * (0.9 + (seedSeed % 20) / 100));

        if (ind.id === 'IND-05') {
          // Stunting: lower is better. Baseline stunting percentage decreases slightly over years
          const rate = profile.stuntingBase - timeProgress * 2.5 + variation * 4;
          achievementRate = Math.max(5.5, Math.min(26.0, Number(rate.toFixed(1))));
          numerator = Math.round((achievementRate / 100) * denominator);
        } else if (ind.id === 'IND-12') {
          // Desa SBS
          denominator = 10;
          const passedCount = Math.round(10 * Math.min(1, Math.max(0.4, (profile.factor * 0.9) + timeProgress + variation)));
          numerator = passedCount;
          achievementRate = Math.round((numerator / denominator) * 100);
        } else {
          // Other SPM indicators (higher is better, target 90-100%)
          let targetPct = ind.spmTarget;
          let calculatedRate = (ind.spmTarget * profile.factor) + (timeProgress * 10) + (variation * 18);
          calculatedRate = Math.max(48, Math.min(100, calculatedRate));
          achievementRate = Number(calculatedRate.toFixed(1));
          numerator = Math.round((achievementRate / 100) * denominator);
        }

        records.push({
          id: `REC-${String(recordCounter++).padStart(6, '0')}`,
          puskesmasId: pkm.id,
          puskesmasName: pkm.name,
          indicatorId: ind.id,
          indicatorCode: ind.code,
          indicatorName: ind.name,
          category: ind.category,
          ageGroup: ind.ageGroup,
          year: period.year,
          month: period.month,
          targetValue: ind.spmTarget,
          numerator,
          denominator,
          achievementRate,
          notes: achievementRate < ind.criticalThreshold ? 'Memerlukan koordinasi lintas program & sweeping' : undefined,
          updatedAt: '2026-04-10T08:30:00Z',
          updatedBy: 'Siti Rahmawati (Dinkes)',
        });
      });
    });
  });

  return records;
};

export const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const MONTH_NAMES_SHORT_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
];
