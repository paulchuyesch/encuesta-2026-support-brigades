'use client';

import {
  Building2,
  EyeOff,
  Filter,
  Info,
  ShieldAlert,
  X,
} from 'lucide-react';
import {
  IMPROVEMENT_THEME_MAP,
  SEGMENT_CONFIG,
  STRENGTH_THEME_MAP,
} from '@/lib/ui-helpers';
import type { DashboardFilters, MonthlyTrendItem, NpsSegment } from '@/lib/types';

interface FilterBarProps {
  filters: DashboardFilters;
  months: MonthlyTrendItem[];
  internalCount: number;
  multiCompanySummary: { groupCount: number; totalRows: number } | null;
  presentationMode: boolean;
  onUpdateFilters: (patch: Partial<DashboardFilters>) => void;
  onClearFilters: () => void;
}

const SEGMENT_OPTIONS: Array<{ value: 'all' | NpsSegment; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'promoter', label: 'Promotores (9–10)' },
  { value: 'passive', label: 'Pasivos (7–8)' },
  { value: 'detractor', label: 'Detractores (0–6)' },
];

export function FilterBar({
  filters,
  months,
  internalCount,
  multiCompanySummary,
  presentationMode,
  onUpdateFilters,
  onClearFilters,
}: FilterBarProps) {
  const hasActiveCrossFilters =
    filters.monthKey !== 'all' ||
    filters.segment !== 'all' ||
    filters.selectedScore !== null ||
    filters.improvementTheme !== 'all' ||
    filters.strengthTheme !== 'all';

  return (
    <section aria-label="Filtros y contexto de datos" className="space-y-3">
      {presentationMode && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#BFD9FA] bg-[#EBF4FF] px-4 py-2.5 text-xs font-semibold text-[#003B7E]">
          <div className="flex items-center gap-2">
            <EyeOff className="h-4 w-4 shrink-0 text-[#0056B4]" aria-hidden="true" />
            <span>
              Modo Presentación activo: los nombres de empresas y encuestados se muestran anonimizados.
            </span>
          </div>
        </div>
      )}

      <div className="no-print rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Filter className="h-3.5 w-3.5 text-[#0056B4]" aria-hidden="true" />
              Periodo:
            </span>

            <button
              type="button"
              onClick={() => onUpdateFilters({ monthKey: 'all' })}
              className={`min-h-9 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filters.monthKey === 'all'
                  ? 'bg-[#0056B4] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Todos
            </button>

            {months.map((m) => (
              <button
                key={m.monthKey}
                type="button"
                onClick={() => onUpdateFilters({ monthKey: m.monthKey })}
                className={`min-h-9 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors tabular-nums ${
                  filters.monthKey === m.monthKey
                    ? 'bg-[#0056B4] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {m.monthLabel} ({m.count})
              </button>
            ))}
          </div>

          {internalCount > 0 && (
            <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 self-start rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 select-none hover:bg-slate-100 lg:self-center">
              <input
                type="checkbox"
                checked={filters.excludeInternal}
                onChange={(e) => onUpdateFilters({ excludeInternal: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 accent-[#0056B4]"
              />
              <span>Excluir registro interno ({internalCount})</span>
            </label>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {SEGMENT_OPTIONS.map((opt) => {
              const active = filters.segment === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdateFilters({ segment: opt.value })}
                  className={`min-h-8 cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-[#0A2540] text-white'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}

            {filters.selectedScore !== null && (
              <button
                type="button"
                onClick={() => onUpdateFilters({ selectedScore: null })}
                className="inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-full border border-[#BFD9FA] bg-[#EBF4FF] px-3 py-1 text-xs font-semibold text-[#003B7E]"
              >
                <span>Nota: {filters.selectedScore}/10</span>
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}

            {filters.improvementTheme !== 'all' && (
              <button
                type="button"
                onClick={() => onUpdateFilters({ improvementTheme: 'all' })}
                className="inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900"
              >
                <span>
                  Brecha: {IMPROVEMENT_THEME_MAP[filters.improvementTheme]?.shortLabel}
                </span>
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}

            {filters.strengthTheme !== 'all' && (
              <button
                type="button"
                onClick={() => onUpdateFilters({ strengthTheme: 'all' })}
                className="inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
              >
                <span>
                  Fortaleza: {STRENGTH_THEME_MAP[filters.strengthTheme]?.shortLabel}
                </span>
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {hasActiveCrossFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="inline-flex min-h-8 cursor-pointer items-center gap-1 text-xs font-semibold text-[#0056B4] hover:underline"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Limpiar filtros</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Data quality indicators for executive context */}
      {(internalCount > 0 || multiCompanySummary) && (
        <div className="flex flex-wrap gap-2 text-xs">
          {internalCount > 0 && !filters.excludeInternal && (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700">
              <ShieldAlert className="h-3.5 w-3.5 text-[#0056B4]" aria-hidden="true" />
              <span>
                Incluye {internalCount} respuesta interna (Support Brigades). Puedes excluirla con el
                filtro superior.
              </span>
            </div>
          )}

          {multiCompanySummary && (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700">
              <Building2 className="h-3.5 w-3.5 text-[#0056B4]" aria-hidden="true" />
              <span>
                Nota muestral: {multiCompanySummary.groupCount} contacto(s) representan{' '}
                {multiCompanySummary.totalRows} razones sociales distintas en el periodo.
              </span>
            </div>
          )}

          <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600">
            <Info className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            <span>
              Haz clic en cualquier barra de puntaje o tema para filtrar las respuestas.
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
