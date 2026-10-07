import React from 'react';
import { Filter, Search, RotateCcw, Calendar, Building, Layers, Users, Activity } from 'lucide-react';
import { useHealthData } from '../../context/HealthDataContext';
import { HEALTH_CATEGORIES, MONTH_NAMES_ID, AGE_GROUPS } from '../../data/mockData';
import { HealthCategory, AgeGroup } from '../../types/health';

export const GlobalFilterBar: React.FC = () => {
  const {
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
    selectedIndicatorId,
    setSelectedIndicatorId,
    indicators,
    searchQuery,
    setSearchQuery,
    puskesmasList,
    currentUser,
    filteredRecords,
  } = useHealthData();

  const isPuskesmasRole = currentUser.role === 'PUSKESMAS';

  const handleResetFilters = () => {
    setSelectedYear(2025);
    setSelectedMonth('ALL');
    setSelectedKecamatan('ALL');
    if (!isPuskesmasRole) {
      setSelectedPuskesmasId('ALL');
    }
    setSelectedCategory('ALL');
    setSelectedAgeGroup('ALL');
    setSelectedIndicatorId('ALL');
    setSearchQuery('');
  };

  const isFiltered = 
    selectedYear !== 2025 || 
    selectedMonth !== 'ALL' || 
    selectedKecamatan !== 'ALL' ||
    (!isPuskesmasRole && selectedPuskesmasId !== 'ALL') || 
    selectedCategory !== 'ALL' || 
    selectedAgeGroup !== 'ALL' ||
    selectedIndicatorId !== 'ALL' ||
    searchQuery.trim() !== '';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Filter controls row */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Label icon */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 pr-2 border-r border-slate-200">
            <Filter className="w-3.5 h-3.5 text-teal-600" />
            <span>Filter Data</span>
          </div>

          {/* Tahun Picker */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              aria-label="Pilih Tahun Laporan"
              className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">Semua Tahun</option>
              <option value="2026">Tahun 2026</option>
              <option value="2025">Tahun 2025</option>
              <option value="2024">Tahun 2024</option>
            </select>
          </div>

          {/* Bulan Picker */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              aria-label="Pilih Bulan Pelaporan"
              className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">Semua Bulan (Tahunan)</option>
              {MONTH_NAMES_ID.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  Bulan {name}
                </option>
              ))}
            </select>
          </div>

          {/* Kecamatan Filter (Business Rule 4 & Dashboard Spec 3) */}
          <div className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedKecamatan}
              onChange={(e) => setSelectedKecamatan(e.target.value)}
              aria-label="Pilih Kecamatan"
              className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">Semua Kecamatan ({kecamatanList.length})</option>
              {kecamatanList.map((kec) => (
                <option key={kec} value={kec}>
                  {kec}
                </option>
              ))}
            </select>
          </div>

          {/* Puskesmas Selector */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedPuskesmasId}
              disabled={isPuskesmasRole}
              onChange={(e) => setSelectedPuskesmasId(e.target.value)}
              aria-label="Pilih Puskesmas"
              className={`text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                isPuskesmasRole ? 'opacity-70 cursor-not-allowed bg-slate-100' : ''
              }`}
            >
              <option value="ALL">Semua Puskesmas ({puskesmasList.length} Faskes)</option>
              {puskesmasList
                .filter(pkm => selectedKecamatan === 'ALL' || pkm.district === selectedKecamatan)
                .map((pkm) => (
                  <option key={pkm.id} value={pkm.id}>
                    {pkm.name} ({pkm.district})
                  </option>
                ))}
            </select>
          </div>

          {/* Kategori Program */}
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as HealthCategory | 'ALL')}
              aria-label="Pilih Kategori Program"
              className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">Semua Program Kesehatan</option>
              {HEALTH_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.shortName}
                </option>
              ))}
            </select>
          </div>

          {/* Kelompok Umur (F05) */}
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedAgeGroup}
              onChange={(e) => setSelectedAgeGroup(e.target.value as AgeGroup | 'ALL')}
              aria-label="Pilih Kelompok Umur"
              className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">Semua Kelompok Umur</option>
              {AGE_GROUPS.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.label} ({ag.rangeDescription})
                </option>
              ))}
            </select>
          </div>

          {/* Indikator Spesifik (User Flow 2: Pilih Tahun -> Pilih Puskesmas -> Pilih Indikator) */}
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedIndicatorId}
              onChange={(e) => setSelectedIndicatorId(e.target.value)}
              aria-label="Pilih Indikator Spesifik"
              className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 max-w-48 truncate"
            >
              <option value="ALL">Semua Indikator SPM ({indicators.length})</option>
              {indicators.map((ind) => (
                <option key={ind.id} value={ind.id}>
                  [{ind.code}] {ind.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset button if active */}
          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 px-2 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors font-medium"
              title="Reset semua filter"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Search input & Record Counter */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari indikator / puskesmas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800 placeholder-slate-400"
            />
          </div>

          <div className="text-xs text-slate-500 whitespace-nowrap hidden sm:block">
            <span className="font-semibold text-slate-800 font-mono">{filteredRecords.length}</span> baris data
          </div>
        </div>
      </div>
    </div>
  );
};
