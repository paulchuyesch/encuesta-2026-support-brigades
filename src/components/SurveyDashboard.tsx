'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import {
  buildAnonymizedMap,
  computeDashboardMetrics,
  exportResponsesToCsv,
  filterResponses,
} from '@/lib/survey-analytics';
import type { DashboardFilters, SurveyDataset } from '@/lib/types';
import { ChartsSection } from './ChartsSection';
import { DashboardHeader } from './DashboardHeader';
import { FileUploadModal } from './FileUploadModal';
import { FilterBar } from './FilterBar';
import { KpiGrid } from './KpiGrid';
import { PriorityAttentionSection } from './PriorityAttentionSection';
import { ResponsesExplorer } from './ResponsesExplorer';

interface SurveyDashboardProps {
  initialDataset: SurveyDataset;
}

const INITIAL_FILTERS: DashboardFilters = {
  excludeInternal: false,
  monthKey: 'all',
  segment: 'all',
  selectedScore: null,
  improvementTheme: 'all',
  strengthTheme: 'all',
  searchQuery: '',
};

export function SurveyDashboard({ initialDataset }: SurveyDashboardProps) {
  const [dataset, setDataset] = useState<SurveyDataset>(initialDataset);
  const [isCustomDataset, setIsCustomDataset] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>(INITIAL_FILTERS);
  const [presentationMode, setPresentationMode] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const internalCount = useMemo(
    () => dataset.responses.filter((r) => r.isInternal).length,
    [dataset.responses],
  );

  const baseResponses = useMemo(
    () =>
      filters.excludeInternal
        ? dataset.responses.filter((r) => !r.isInternal)
        : dataset.responses,
    [dataset.responses, filters.excludeInternal],
  );

  const allMonths = useMemo(
    () => computeDashboardMetrics(baseResponses).monthlyTrend,
    [baseResponses],
  );

  const filteredResponses = useMemo(
    () => filterResponses(dataset.responses, filters),
    [dataset.responses, filters],
  );

  const metrics = useMemo(
    () => computeDashboardMetrics(filteredResponses),
    [filteredResponses],
  );

  const anonMap = useMemo(
    () => buildAnonymizedMap(dataset.responses),
    [dataset.responses],
  );

  const multiCompanySummary = useMemo(() => {
    const groups = new Map<string, number>();
    for (const r of filteredResponses) {
      if (!r.multiCompanyGroup) continue;
      groups.set(r.multiCompanyGroup, (groups.get(r.multiCompanyGroup) ?? 0) + 1);
    }
    if (groups.size === 0) return null;
    const totalRows = [...groups.values()].reduce((acc, n) => acc + n, 0);
    return { groupCount: groups.size, totalRows };
  }, [filteredResponses]);

  const dateRangeLabel = useMemo(() => {
    if (allMonths.length === 0) return '';
    if (allMonths.length === 1) return allMonths[0].monthLabel;
    return `${allMonths[0].monthLabel} – ${allMonths[allMonths.length - 1].monthLabel}`;
  }, [allMonths]);

  function updateFilters(patch: Partial<DashboardFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  function clearFilters() {
    setFilters((prev) => ({
      ...INITIAL_FILTERS,
      excludeInternal: prev.excludeInternal,
    }));
  }

  function handleExportCsv() {
    const csvContent = exportResponsesToCsv(
      filteredResponses,
      presentationMode,
      anonMap,
    );
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = presentationMode
      ? 'encuesta-support-brigades-anonimizada.csv'
      : 'encuesta-support-brigades-filtrada.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F7FB]">
      <DashboardHeader
        sourceName={dataset.sourceName}
        isCustomDataset={isCustomDataset}
        totalCount={filteredResponses.length}
        dateRangeLabel={dateRangeLabel}
        presentationMode={presentationMode}
        onTogglePresentationMode={() => setPresentationMode((prev) => !prev)}
        onOpenUploadModal={() => setIsUploadOpen(true)}
        onResetBaseline={() => {
          setDataset(initialDataset);
          setIsCustomDataset(false);
          setFilters(INITIAL_FILTERS);
        }}
        onExportCsv={handleExportCsv}
        onPrint={() => window.print()}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <FilterBar
          filters={filters}
          months={allMonths}
          internalCount={internalCount}
          multiCompanySummary={multiCompanySummary}
          presentationMode={presentationMode}
          onUpdateFilters={updateFilters}
          onClearFilters={clearFilters}
        />

        <KpiGrid metrics={metrics} />

        <ChartsSection
          metrics={metrics}
          filters={filters}
          onSelectScore={(score) => updateFilters({ selectedScore: score })}
          onSelectMonth={(monthKey) => updateFilters({ monthKey })}
          onSelectImprovementTheme={(improvementTheme) =>
            updateFilters({ improvementTheme })
          }
          onSelectStrengthTheme={(strengthTheme) => updateFilters({ strengthTheme })}
        />

        <PriorityAttentionSection
          responses={filteredResponses}
          presentationMode={presentationMode}
          anonMap={anonMap}
        />

        <ResponsesExplorer
          responses={filteredResponses}
          presentationMode={presentationMode}
          anonMap={anonMap}
        />
      </main>

      <footer className="mt-10 bg-[#0056B4] text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 py-6 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="p-1">
              <Image
                src="/logos/logo-white.png"
                alt="Support Brigades — Versión blanca oficial"
                width={150}
                height={50}
                className="h-9 w-auto object-contain select-none"
              />
            </div>
            <div className="text-xs leading-relaxed text-blue-100">
              <p className="font-bold text-white">
                Análisis de Satisfacción de Servicios SST &amp; Salud Ocupacional
              </p>
              <p>Identidad aplicada conforme al manual SB-GCO-MC-MA-001.</p>
            </div>
          </div>

          <p className="text-xs font-medium text-blue-100">
            Procesamiento local en navegador · Listo para actualización con CSV / Excel
          </p>
        </div>
      </footer>

      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onDatasetLoaded={(newDataset) => {
          setDataset(newDataset);
          setIsCustomDataset(true);
          setFilters(INITIAL_FILTERS);
        }}
      />
    </div>
  );
}
