'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ClipboardCheck, ShieldCheck } from 'lucide-react';
import { generateIsoRecommendations } from '@/lib/iso-recommendations';
import type { DashboardMetrics, IsoPriority, SurveyResponse } from '@/lib/types';

interface RecommendationsSectionProps {
  responses: SurveyResponse[];
  metrics: DashboardMetrics;
  presentationMode: boolean;
  anonMap: Map<number, { displayCompany: string; displayRespondent: string }>;
}

const PRIORITY_STYLES: Record<
  IsoPriority,
  { label: string; shortPlural: string; badgeClass: string; borderClass: string }
> = {
  critica: {
    label: 'Prioridad Crítica',
    shortPlural: 'Crítica',
    badgeClass: 'bg-amber-100 text-amber-950 border border-amber-300',
    borderClass: 'border-l-amber-600',
  },
  alta: {
    label: 'Prioridad Alta',
    shortPlural: 'Alta',
    badgeClass: 'bg-[#EBF4FF] text-[#003B7E] border border-[#BFD9FA]',
    borderClass: 'border-l-[#0056B4]',
  },
  media: {
    label: 'Prioridad Media',
    shortPlural: 'Media',
    badgeClass: 'bg-sky-50 text-sky-900 border border-sky-200',
    borderClass: 'border-l-sky-600',
  },
  mantener: {
    label: 'Capitalizar (10.3)',
    shortPlural: 'Capitalizar',
    badgeClass: 'bg-emerald-50 text-emerald-900 border border-emerald-200',
    borderClass: 'border-l-emerald-600',
  },
};

const PRIORITY_ORDER: IsoPriority[] = ['critica', 'alta', 'media', 'mantener'];

export function RecommendationsSection({
  responses,
  metrics,
  presentationMode,
  anonMap,
}: RecommendationsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const recommendations = useMemo(
    () =>
      generateIsoRecommendations(
        responses,
        metrics,
        presentationMode,
        anonMap,
      ),
    [responses, metrics, presentationMode, anonMap],
  );

  const priorityCounts = useMemo(() => {
    const counts: Record<IsoPriority, number> = {
      critica: 0,
      alta: 0,
      media: 0,
      mantener: 0,
    };
    for (const rec of recommendations) {
      counts[rec.priority] += 1;
    }
    return counts;
  }, [recommendations]);

  return (
    <section
      aria-label="Recomendaciones basadas en ISO 9001:2015"
      className="rounded-2xl border border-slate-200 bg-white shadow-xs"
    >
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        aria-controls="iso-recommendations-panel"
        className="flex w-full cursor-pointer flex-col gap-3 rounded-2xl p-5 text-left transition-colors hover:bg-slate-50/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0056B4] lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <ShieldCheck className="h-5 w-5 shrink-0 text-[#0056B4]" aria-hidden="true" />
            <h2 className="text-base font-extrabold text-[#0A2540]">
              Recomendaciones y Mejora Continua (ISO 9001:2015)
            </h2>
            <span className="rounded-full border border-[#BFD9FA] bg-[#EBF4FF] px-2.5 py-0.5 text-[11px] font-bold text-[#003B7E]">
              Cláusulas 9.1.2 · 10.2 · 10.3
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Plan accionable derivado automáticamente de los resultados filtrados conforme a buenas
            prácticas del Sistema de Gestión de la Calidad.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {PRIORITY_ORDER.map((priority) => {
              const count = priorityCounts[priority];
              if (count === 0) return null;
              const style = PRIORITY_STYLES[priority];
              return (
                <span
                  key={priority}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold tabular-nums ${style.badgeClass}`}
                >
                  {count} {style.shortPlural}
                </span>
              );
            })}
          </div>

          <span className="no-print inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-[#0056B4] tabular-nums">
            <ClipboardCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {isExpanded ? 'Ocultar' : `Desplegar (${recommendations.length})`}
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </span>
        </div>
      </button>

      <div
        id="iso-recommendations-panel"
        className={`${isExpanded ? 'block' : 'hidden print:block'} border-t border-slate-100 p-5`}
      >
        {recommendations.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-4 text-xs font-medium text-slate-600">
            No hay respuestas en el filtro actual para generar recomendaciones ISO 9001:2015.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {recommendations.map((rec) => {
              const style = PRIORITY_STYLES[rec.priority];
              return (
                <article
                  key={rec.id}
                  className={`print-break-avoid flex flex-col justify-between rounded-xl border border-slate-200 border-l-4 bg-white p-4 ${style.borderClass}`}
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${style.badgeClass}`}
                      >
                        {style.label}
                      </span>
                      <span className="text-[11px] font-bold text-[#0056B4]">
                        {rec.isoClause}
                      </span>
                    </div>

                    <h3 className="mt-2.5 text-sm font-bold text-[#0A2540]">{rec.title}</h3>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                      {rec.isoPrinciple}
                    </p>

                    <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
                      <p>
                        <strong className="font-bold text-slate-900">Evidencia: </strong>
                        {rec.evidence}
                      </p>
                      <p>
                        <strong className="font-bold text-[#003B7E]">Acción SIG: </strong>
                        {rec.recommendedAction}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 border-t border-slate-100 pt-2.5 text-[11px] text-slate-600">
                    <strong className="font-bold text-slate-800">KPI de verificación: </strong>
                    {rec.verificationKpi}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
