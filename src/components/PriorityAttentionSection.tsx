'use client';

import { AlertTriangle, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { IMPROVEMENT_THEME_MAP, SEGMENT_CONFIG } from '@/lib/ui-helpers';
import type { SurveyResponse } from '@/lib/types';

interface PriorityAttentionSectionProps {
  responses: SurveyResponse[];
  presentationMode: boolean;
  anonMap: Map<number, { displayCompany: string; displayRespondent: string }>;
}

export function PriorityAttentionSection({
  responses,
  presentationMode,
  anonMap,
}: PriorityAttentionSectionProps) {
  const detractors = responses
    .filter((r) => r.segment === 'detractor')
    .sort((a, b) => a.score - b.score);

  const actionablePassives = responses
    .filter((r) => r.segment === 'passive' && r.hasMeaningfulImprovement)
    .sort((a, b) => a.score - b.score || b.improvementComment.length - a.improvementComment.length);

  if (detractors.length === 0 && actionablePassives.length === 0) {
    return null;
  }

  function renderCard(item: SurveyResponse, isDetractor: boolean) {
    const anon = anonMap.get(item.id);
    const company = presentationMode ? (anon?.displayCompany ?? 'Empresa') : item.company;
    const respondent = presentationMode
      ? (anon?.displayRespondent ?? `Encuestado #${item.id}`)
      : item.respondentName;
    const seg = SEGMENT_CONFIG[item.segment];

    return (
      <article
        key={item.id}
        className={`print-break-avoid flex flex-col justify-between rounded-xl border border-slate-200 border-l-4 bg-white p-4 shadow-2xs ${seg.borderAccentClass}`}
      >
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-bold text-[#0A2540]">{company}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${seg.badgeClass}`}>
                  {seg.label}
                </span>
              </div>
              <p className="mt-0.5 text-xs font-medium text-slate-600">
                {respondent} · {item.role}
              </p>
            </div>

            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-extrabold tabular-nums ${
                isDetractor
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-sky-100 text-sky-900'
              }`}
            >
              {item.score}
            </div>
          </div>

          {item.improvementComment && (
            <div className="mt-3 rounded-lg bg-slate-50 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Oportunidad señalada
              </p>
              <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-800">
                {item.improvementComment}
              </p>
            </div>
          )}

          {item.hasMeaningfulStrength && (
            <p className="mt-2.5 text-xs text-slate-600">
              <strong className="font-semibold text-slate-800">Lo que valora: </strong>
              {item.strengthComment}
            </p>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
          <div className="flex flex-wrap gap-1.5">
            {item.improvementThemes.map((t) => (
              <span
                key={t}
                className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900 border border-amber-200"
              >
                {IMPROVEMENT_THEME_MAP[t]?.shortLabel}
              </span>
            ))}
          </div>
          <span className="text-[11px] font-medium text-slate-500 tabular-nums">
            ID #{item.id} · {item.monthLabel}
          </span>
        </div>
      </article>
    );
  }

  return (
    <section aria-label="Foco prioritario y cuentas a convertir" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-700" aria-hidden="true" />
          <h2 className="text-base font-extrabold text-[#0A2540]">
            Foco Prioritario: Retención y Conversión a Promotores
          </h2>
        </div>
        <span className="text-xs font-medium text-slate-600">
          {detractors.length} detractores (0–6) · {actionablePassives.length} pasivos (7–8) con
          observaciones accionables
        </span>
      </div>

      {detractors.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800">
            <span>Atención Inmediata · Detractores ({detractors.length})</span>
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {detractors.map((d) => renderCard(d, true))}
          </div>
        </div>
      )}

      {actionablePassives.length > 0 && (
        <div className="space-y-2.5 pt-1">
          <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0056B4]">
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Pasivos clave con ruta clara hacia 9–10 ({actionablePassives.length})</span>
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {actionablePassives.slice(0, 6).map((p) => renderCard(p, false))}
          </div>
          {actionablePassives.length > 6 && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#0056B4]" aria-hidden="true" />
              <span>
                Mostrando las 6 respuestas pasivas más detalladas arriba. Consulta las{' '}
                {actionablePassives.length} en el explorador completo inferior.
              </span>
            </p>
          )}
        </div>
      )}
    </section>
  );
}
