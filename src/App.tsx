import React, { useState } from 'react';
import { HealthDataProvider, useHealthData } from './context/HealthDataContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { GlobalFilterBar } from './components/common/GlobalFilterBar';
import { DashboardOverview } from './components/views/DashboardOverview';
import { IndicatorAnalysisView } from './components/views/IndicatorAnalysisView';
import { PuskesmasComparisonView } from './components/views/PuskesmasComparisonView';
import { TrendAnalysisView } from './components/views/TrendAnalysisView';
import { DataManagementView } from './components/views/DataManagementView';
import { ExcelImportView } from './components/views/ExcelImportView';
import { ReportsExportView } from './components/views/ReportsExportView';
import { RoleManagementView } from './components/views/RoleManagementView';
import { AgeGroupAnalyticsView } from './components/views/AgeGroupAnalyticsView';
import { AuthModal } from './components/auth/AuthModal';
import { LoginPage } from './components/auth/LoginPage';

function MainAppContent() {
  const { isAuthenticated } = useHealthData();
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [comparisonTargetIndicatorId, setComparisonTargetIndicatorId] = useState<string | undefined>(undefined);

  const handleSelectIndicatorForComparison = (indicatorId: string) => {
    setComparisonTargetIndicatorId(indicatorId);
    setActiveView('comparison');
  };

  // User Flow 1 & 6: If not authenticated, show Login page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      {/* Top Navigation Bar - adheres to strict Top Bar Contract */}
      <div className="no-print">
        <Header activeView={activeView} setActiveView={setActiveView} />
      </div>

      {/* Main Application Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="no-print hidden md:block">
          <Sidebar activeView={activeView} setActiveView={setActiveView} />
        </div>

        {/* Main Content Scrollable Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* Global Context Filter Bar (Shown on data-driven views) */}
          {activeView !== 'import' && activeView !== 'roles' && (
            <div className="no-print">
              <GlobalFilterBar />
            </div>
          )}

          {/* View Switcher */}
          {activeView === 'dashboard' && (
            <DashboardOverview 
              setActiveView={setActiveView} 
            />
          )}

          {activeView === 'indicators' && (
            <IndicatorAnalysisView 
              setActiveView={setActiveView} 
              onSelectIndicatorForComparison={handleSelectIndicatorForComparison} 
            />
          )}

          {activeView === 'comparison' && (
            <PuskesmasComparisonView 
              initialIndicatorId={comparisonTargetIndicatorId} 
            />
          )}

          {activeView === 'trends' && (
            <TrendAnalysisView />
          )}

          {activeView === 'age-groups' && (
            <AgeGroupAnalyticsView setActiveView={setActiveView} />
          )}

          {activeView === 'data' && (
            <DataManagementView setActiveView={setActiveView} />
          )}

          {activeView === 'import' && (
            <ExcelImportView setActiveView={setActiveView} />
          )}

          {activeView === 'reports' && (
            <ReportsExportView />
          )}

          {activeView === 'roles' && (
            <RoleManagementView />
          )}
        </main>
      </div>

      {/* Global In-App Authentication Modal (e.g. Ubah Password) */}
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <HealthDataProvider>
      <MainAppContent />
    </HealthDataProvider>
  );
}
