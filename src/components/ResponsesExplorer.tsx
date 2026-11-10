'use client';

import { useState } from 'react';
import { ArrowUpDown, Building2, ListFilter } from 'lucide-react';
import {
  IMPROVEMENT_THEME_MAP,
  SEGMENT_CONFIG,
  STRENGTH_THEME_MAP,
} from '@/lib/ui-helpers';
import type { NpsSegment, SurveyResponse } from '@/lib/types';
import { CollapsibleSection } from './CollapsibleSection';

interface ResponsesExplorerProps {
  responses: SurveyResponse[];
  presentationMode: boolean;
  anonMap: Map<number, { displayCompany: string; displayRespondent: string }>;
}

type SortKey = 'recent' | 'score_asc' | 'score_desc';

const SEGMENT_ORDER: NpsSegment[] = ['promoter', 'passive', 'detractor'];

export function ResponsesExplorer({
  responses,
  presentationMode,
  anonMap,
}: ResponsesExplorerProps) {
  const [sortKey, setSortKey] = useState<SortKey>('recent');

  const sortedResponses = [...responses].sort((a, b) => {
    if (sortKey === 'score_asc') return a.score - b.score || a.id - b.id;
    if (sortKey === 'score_desc') return b.score - a.score || a.id - b.id;
    return b.completedTimestamp - a.completedTimestamp || b.id - a.id;
  });

  const summaryPills = SEGMENT_ORDER.map((seg) => {
    const count = responses.filter((r) => r.segment === seg).length;
    if (count === 0) return null;
    const config = SEGMENT_CONFIG[seg];
    return (
      <span
        key={seg}
        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold tabular-nums ${config.badgeClass}`}
      >
        {count} {config.shortLabel}
      </span>
    );
  });

  return (
    <CollapsibleSection
      id="responses-explorer-panel"
      ariaLabel="Explorador completo de respuestas"
      icon={<ListFilter className="h-5 w-5 shrink-0 text-[#0056B4]" aria-hidden="true" />}
      title={`Explorador de Respuestas (${responses.length})`}
      subtitle="Detalle completo de puntaje, perfil de contacto y comentarios abiertos."
      summaryPills={summaryPills}
      itemCount={responses.length}
    >
      <div className="no-print mb-4 flex items-center justify-end gap-2 border-b border-slate-100 pb-3">
        <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
        <label htmlFor="sort-select" className="text-xs font-semibold text-slate-600">
          Ordenar:
        </label>
        <select
          id="sort-select"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="min-h-9 cursor-pointer rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 focus:border-[#0056B4] focus:outline-none focus:ring-2 focus:ring-[#0056B4]/20"
        >
          <option value="recent">Más recientes primero</option>
          <option value="score_asc">Menor puntaje primero</option>
          <option value="score_desc">Mayor puntaje primero</option>
        </select>
      </div>

      {sortedResponses.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm font-semibold text-slate-700">
            No hay respuestas que coincidan con los filtros actuales.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Prueba quitando algún filtro o limpiando la búsqueda.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {sortedResponses.map((item) => {
            const anon = anonMap.get(item.id);
            const company = presentationMode ? (anon?.displayCompany ?? 'Empresa') : item.company;
            const respondent = presentationMode
              ? (anon?.displayRespondent ?? `Encuestado #${item.id}`)
              : item.respondentName;
            const seg = SEGMENT_CONFIG[item.segment];

            return (
              <article
                key={item.id}
                className="print-break-avoid grid grid-cols-1 gap-4 py-4 first:pt-0 lg:grid-cols-12"
              >
                {/* Left Meta Column */}
                <div className="flex items-start gap-3 lg:col-span-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-extrabold tabular-nums ${seg.badgeClass}`}
                  >
                    {item.score}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="text-sm font-bold text-[#0A2540]">{company}</h3>
                      {item.isInternal && (
                        <span className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                          Interno
                        </span>
                      )}
                      {item.multiCompanyGroup && (
                        <span
                          title="Mismo contacto respondió por varias empresas"
                          className="inline-flex items-center gap-1 rounded-md bg-[#EBF4FF] px-1.5 py-0.5 text-[10px] font-semibold text-[#0056B4]"
                        >
                          <Building2 className="h-2.5 w-2.5" aria-hidden="true" />
                          Multi-empresa
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs font-semibold text-slate-700">{respondent}</p>
                    <p className="text-xs text-slate-500">{item.role}</p>
                    <p className="mt-1 text-[11px] font-medium text-slate-400 tabular-nums">
                      ID #{item.id} · {item.completedAt}
                      {item.durationMinutes !== null ? ` (${item.durationMinutes} min)` : ''}
                    </p>
                  </div>
                </div>

                {/* Middle Strength Column */}
                <div className="rounded-xl bg-slate-50/80 p-3 lg:col-span-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#0056B4]">
                    ¿Qué hace bien Support Brigades?
                  </p>
                  <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-800">
                    {item.hasMeaningfulStrength ? (
                      item.strengthComment
                    ) : (
                      <span className="italic text-slate-400">Sin detalle registrado</span>
                    )}
                  </p>
                  {item.strengthThemes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.strengthThemes.map((t) => (
                        <span
                          key={t}
                          className="rounded-md bg-[#EBF4FF] px-2 py-0.5 text-[10px] font-semibold text-[#003B7E]"
                        >
                          {STRENGTH_THEME_MAP[t]?.shortLabel}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Improvement Column */}
                <div
                  className={`rounded-xl p-3 lg:col-span-4 ${
                    item.hasMeaningfulImprovement ? 'bg-amber-50/60' : 'bg-slate-50/50'
                  }`}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                    ¿Qué cambios haría para mayor nota?
                  </p>
                  <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-800">
                    {item.improvementComment ? (
                      item.improvementComment
                    ) : (
                      <span className="italic text-slate-400">Sin comentario</span>
                    )}
                  </p>
                  {item.improvementThemes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.improvementThemes.map((t) => (
                        <span
                          key={t}
                          className="rounded-md border border-amber-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-900"
                        >
                          {IMPROVEMENT_THEME_MAP[t]?.shortLabel}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </CollapsibleSection>
  );
}
