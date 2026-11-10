'use client';

import { Activity, Award, Clock, MessageSquareText } from 'lucide-react';
import { getNpsTier, SEGMENT_CONFIG } from '@/lib/ui-helpers';
import type { DashboardMetrics } from '@/lib/types';

interface KpiGridProps {
  metrics: DashboardMetrics;
}

export function KpiGrid({ metrics }: KpiGridProps) {
  const npsTier = getNpsTier(metrics.nps);
  const formattedNps = metrics.nps > 0 ? `+${metrics.nps.toFixed(1)}` : metrics.nps.toFixed(1);

  return (
    <section aria-label="Indicadores clave de satisfacción" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* KPI 1: NPS Score */}
      <article className="print-break-avoid flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Net Promoter Score
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${npsTier.className}`}>
              {npsTier.label}
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-[#0A2540] tabular-nums">
              {metrics.total > 0 ? formattedNps : '—'}
            </span>
            <span className="text-xs font-semibold text-slate-500">pts (-100 a +100)</span>
          </div>
        </div>

        <div className="mt-4">
          <div
            className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
            role="img"
            aria-label={`Distribución NPS: ${metrics.promoterPct}% promotores, ${metrics.passivePct}% pasivos, ${metrics.detractorPct}% detractores`}
          >
            <div
              style={{
                width: `${metrics.promoterPct}%`,
                backgroundColor: SEGMENT_CONFIG.promoter.color,
              }}
              title={`Promotores: ${metrics.promoterPct}%`}
            />
            <div
              style={{
                width: `${metrics.passivePct}%`,
                backgroundColor: SEGMENT_CONFIG.passive.color,
              }}
              title={`Pasivos: ${metrics.passivePct}%`}
            />
            <div
              style={{
                width: `${metrics.detractorPct}%`,
                backgroundColor: SEGMENT_CONFIG.detractor.color,
              }}
              title={`Detractores: ${metrics.detractorPct}%`}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] font-semibold tabular-nums">
            <span className="text-emerald-700">
              {metrics.promoters} Prom. ({metrics.promoterPct}%)
            </span>
            <span className="text-sky-700">
              {metrics.passives} Pas. ({metrics.passivePct}%)
            </span>
            <span className="text-amber-800">
              {metrics.detractors} Det. ({metrics.detractorPct}%)
            </span>
          </div>
        </div>
      </article>

      {/* KPI 2: Average & Median Score */}
      <article className="print-break-avoid flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Calificación Promedio
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EBF4FF] text-[#0056B4]">
              <Award className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-4xl font-extrabold tracking-tight text-[#0A2540] tabular-nums">
              {metrics.total > 0 ? metrics.averageScore.toFixed(2) : '—'}
            </span>
            <span className="text-sm font-bold text-slate-400">/ 10</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-medium text-slate-600 tabular-nums">
          <span>
            Mediana: <strong className="font-bold text-slate-900">{metrics.medianScore}</strong>
          </span>
          <span>
            Notas 9–10:{' '}
            <strong className="font-bold text-emerald-700">{metrics.promoterPct}%</strong>
          </span>
        </div>
      </article>

      {/* KPI 3: Sample Reach & Duration */}
      <article className="print-break-avoid flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Alcance de Muestra
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EBF4FF] text-[#0056B4]">
              <Activity className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-[#0A2540] tabular-nums">
              {metrics.total}
            </span>
            <span className="text-xs font-semibold text-slate-600">
              respuestas · {metrics.uniqueCompanies} empresas
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-medium text-slate-600 tabular-nums">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-[#0056B4]" aria-hidden="true" />
            Tiempo mediano:{' '}
            <strong className="font-bold text-slate-900">
              {metrics.medianDurationMinutes !== null
                ? `${metrics.medianDurationMinutes} min`
                : 'N/D'}
            </strong>
          </span>
          <span>{metrics.monthlyTrend.length} meses</span>
        </div>
      </article>

      {/* KPI 4: Actionable Feedback Rate */}
      <article className="print-break-avoid flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Feedback Cualitativo
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EBF4FF] text-[#0056B4]">
              <MessageSquareText className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-[#0A2540] tabular-nums">
              {metrics.actionableImprovementCount}
            </span>
            <span className="text-xs font-semibold text-slate-600">
              oportunidades concretas ({metrics.actionableImprovementRate}%)
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-medium text-slate-600 tabular-nums">
          <span>
            Fortalezas descritas:{' '}
            <strong className="font-bold text-[#0056B4]">
              {metrics.meaningfulStrengthCount} ({metrics.meaningfulStrengthRate}%)
            </strong>
          </span>
        </div>
      </article>
    </section>
  );
}
