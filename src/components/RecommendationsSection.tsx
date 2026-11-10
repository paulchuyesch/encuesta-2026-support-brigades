'use client';

import { useMemo } from 'react';
import { ClipboardCheck, ShieldCheck } from 'lucide-react';
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
  { label: string; badgeClass: string; borderClass: string }
> = {
  critica: {
    label: 'Prioridad Crítica',
    badgeClass: 'bg-amber-100 text-amber-950 border border-amber-300',
    borderClass: 'border-l-amber-600',
  },
  alta: {
    label: 'Prioridad Alta',
    badgeClass: 'bg-[#EBF4FF] text-[#003B7E] border border-[#BFD9FA]',
    borderClass: 'border-l-[#0056B4]',
  },
  media: {
    label: 'Prioridad Media',
    badgeClass: 'bg-sky-50 text-sky-900 border border-sky-200',
    borderClass: 'border-l-sky-600',
  },
  mantener: {
    label: 'Capitalizar (10.3)',
    badgeClass: 'bg-emerald-50 text-emerald-900 border border-emerald-200',
    borderClass: 'border-l-emerald-600',
  },
};

export function RecommendationsSection({
  responses,
  metrics,
  presentationMode,
  anonMap,
}: RecommendationsSectionProps) {
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

  return (
    <section
      aria-label="Recomendaciones basadas en ISO 9001:2015"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#0056B4]" aria-hidden="true" />
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

        <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-[#0056B4] sm:self-center">
          <ClipboardCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{recommendations.length} recomendaciones</span>
        </div>
      </div>

      <div className="mt-5">
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
