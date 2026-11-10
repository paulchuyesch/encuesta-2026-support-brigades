'use client';

import { useSyncExternalStore } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, ThumbsUp, TrendingUp, Wrench } from 'lucide-react';
import { SEGMENT_CONFIG } from '@/lib/ui-helpers';
import type {
  DashboardFilters,
  DashboardMetrics,
  ImprovementThemeId,
  StrengthThemeId,
} from '@/lib/types';

interface ChartsSectionProps {
  metrics: DashboardMetrics;
  filters: DashboardFilters;
  onSelectScore: (score: number | null) => void;
  onSelectMonth: (monthKey: string) => void;
  onSelectImprovementTheme: (theme: 'all' | ImprovementThemeId) => void;
  onSelectStrengthTheme: (theme: 'all' | StrengthThemeId) => void;
}

const emptySubscribe = () => () => {};

function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function ChartsSection({
  metrics,
  filters,
  onSelectScore,
  onSelectMonth,
  onSelectImprovementTheme,
  onSelectStrengthTheme,
}: ChartsSectionProps) {
  const isClient = useIsClient();

  const maxImprovementCount = Math.max(
    1,
    ...metrics.improvementThemeStats.map((t) => t.count),
  );
  const maxStrengthCount = Math.max(
    1,
    ...metrics.strengthThemeStats.map((t) => t.count),
  );

  return (
    <section aria-label="Análisis gráfico y temático" className="space-y-6">
      {/* Row 1: Score distribution (7 cols) + Monthly trend (5 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <article className="print-break-avoid rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-7">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#0056B4]" aria-hidden="true" />
                <h2 className="text-sm font-bold text-[#0A2540]">
                  Distribución de Calificaciones (0–10)
                </h2>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Haz clic en una barra para filtrar por esa calificación exacta.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold">
              <span className="inline-flex items-center gap-1.5 text-amber-800">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#D97706]" />
                0–6 Detractor
              </span>
              <span className="inline-flex items-center gap-1.5 text-sky-800">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#0284C7]" />
                7–8 Pasivo
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-800">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#059669]" />
                9–10 Promotor
              </span>
            </div>
          </div>

          <div className="mt-4 h-64 w-full">
            {isClient ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics.scoreDistribution}
                  margin={{ top: 12, right: 8, left: -20, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="score"
                    tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }}
                    axisLine={{ stroke: '#CBD5E1' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: '#F1F5F9' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0].payload as {
                        score: number;
                        count: number;
                        segment: 'promoter' | 'passive' | 'detractor';
                      };
                      const seg = SEGMENT_CONFIG[item.segment];
                      return (
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
                          <p className="font-bold text-[#0A2540]">
                            Nota {item.score}/10 · {seg.label}
                          </p>
                          <p className="mt-0.5 font-semibold text-slate-700 tabular-nums">
                            {item.count} {item.count === 1 ? 'respuesta' : 'respuestas'}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[6, 6, 0, 0]}
                    className="cursor-pointer"
                    onClick={(_barData, index) => {
                      const entry = metrics.scoreDistribution[index];
                      if (!entry) return;
                      onSelectScore(
                        filters.selectedScore === entry.score ? null : entry.score,
                      );
                    }}
                  >
                    {metrics.scoreDistribution.map((entry) => {
                      const isSelected = filters.selectedScore === entry.score;
                      const dimmed =
                        filters.selectedScore !== null && filters.selectedScore !== entry.score;
                      return (
                        <Cell
                          key={`score-${entry.score}`}
                          fill={SEGMENT_CONFIG[entry.segment].color}
                          fillOpacity={dimmed ? 0.3 : 1}
                          stroke={isSelected ? '#0A2540' : 'none'}
                          strokeWidth={isSelected ? 2 : 0}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full animate-pulse rounded-xl bg-slate-100" />
            )}
          </div>
        </article>

        <article className="print-break-avoid rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#0056B4]" aria-hidden="true" />
                <h2 className="text-sm font-bold text-[#0A2540]">
                  Evolución Mensual (NPS y Volumen)
                </h2>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Comparativo por mes de cierre de encuesta.
              </p>
            </div>
          </div>

          <div className="mt-4 h-44 w-full">
            {isClient ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={metrics.monthlyTrend}
                  margin={{ top: 10, right: 8, left: -16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: '#CBD5E1' }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="nps"
                    domain={[-20, 100]}
                    tick={{ fill: '#0056B4', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="vol"
                    orientation="right"
                    allowDecimals={false}
                    hide
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const m = payload[0].payload as DashboardMetrics['monthlyTrend'][number];
                      return (
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-md tabular-nums">
                          <p className="font-bold text-[#0A2540]">{m.monthLabel}</p>
                          <p className="mt-0.5 font-semibold text-[#0056B4]">
                            NPS: {m.nps > 0 ? `+${m.nps}` : m.nps}
                          </p>
                          <p className="text-slate-700">Promedio: {m.averageScore} / 10</p>
                          <p className="text-slate-600">Respuestas: {m.count}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    yAxisId="vol"
                    dataKey="count"
                    barSize={28}
                    fill="#D6E7FF"
                    radius={[6, 6, 0, 0]}
                    className="cursor-pointer"
                    onClick={(_barData, index) => {
                      const entry = metrics.monthlyTrend[index];
                      if (!entry) return;
                      onSelectMonth(
                        filters.monthKey === entry.monthKey ? 'all' : entry.monthKey,
                      );
                    }}
                  />
                  <Line
                    yAxisId="nps"
                    type="monotone"
                    dataKey="nps"
                    stroke="#0056B4"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#0056B4', stroke: '#FFFFFF', strokeWidth: 2 }}
                    activeDot={{ r: 7 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full animate-pulse rounded-xl bg-slate-100" />
            )}
          </div>

          <div className="mt-3 overflow-x-auto border-t border-slate-100 pt-2">
            <table className="w-full text-left text-xs tabular-nums">
              <thead>
                <tr className="text-slate-500">
                  <th className="py-1 font-semibold">Mes</th>
                  <th className="py-1 text-right font-semibold">Resp.</th>
                  <th className="py-1 text-right font-semibold">Prom.</th>
                  <th className="py-1 text-right font-semibold">NPS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.monthlyTrend.map((m) => (
                  <tr
                    key={m.monthKey}
                    onClick={() =>
                      onSelectMonth(filters.monthKey === m.monthKey ? 'all' : m.monthKey)
                    }
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                  >
                    <td className="py-1.5 font-semibold text-slate-800">{m.monthLabel}</td>
                    <td className="py-1.5 text-right text-slate-600">{m.count}</td>
                    <td className="py-1.5 text-right text-slate-700">{m.averageScore.toFixed(2)}</td>
                    <td className="py-1.5 text-right font-bold text-[#0056B4]">
                      {m.nps > 0 ? `+${m.nps.toFixed(1)}` : m.nps.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>

      {/* Row 2: Improvement Themes (6 cols) + Strength Themes (6 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <article className="print-break-avoid rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-6">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-amber-700" aria-hidden="true" />
                <h2 className="text-sm font-bold text-[#0A2540]">
                  Principales Brechas y Oportunidades de Mejora
                </h2>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Categorización automática de comentarios accionables (clic para filtrar).
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {metrics.improvementThemeStats.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-600">
                No hay comentarios de mejora accionables en el filtro seleccionado.
              </p>
            ) : (
              metrics.improvementThemeStats.map((theme) => {
                const active = filters.improvementTheme === theme.id;
                const widthPct = Math.round((theme.count / maxImprovementCount) * 100);
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() =>
                      onSelectImprovementTheme(active ? 'all' : theme.id)
                    }
                    className={`w-full cursor-pointer rounded-xl border p-3 text-left transition-colors ${
                      active
                        ? 'border-amber-400 bg-amber-50/70'
                        : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">{theme.label}</span>
                      <span className="shrink-0 text-xs font-bold text-amber-800 tabular-nums">
                        {theme.count} menc. · prom. {theme.avgScore.toFixed(1)}
                      </span>
                    </div>

                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#D97706] transition-all duration-300"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>

                    <p className="mt-1.5 text-[11px] text-slate-600">{theme.description}</p>
                  </button>
                );
              })
            )}
          </div>
        </article>

        <article className="print-break-avoid rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-6">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-[#0056B4]" aria-hidden="true" />
                <h2 className="text-sm font-bold text-[#0A2540]">
                  Fortalezas Más Valoradas por los Clientes
                </h2>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                ¿Qué hace bien Support Brigades según sus cuentas? (clic para filtrar).
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {metrics.strengthThemeStats.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-600">
                No hay menciones de fortalezas en el filtro seleccionado.
              </p>
            ) : (
              metrics.strengthThemeStats.map((theme) => {
                const active = filters.strengthTheme === theme.id;
                const widthPct = Math.round((theme.count / maxStrengthCount) * 100);
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onSelectStrengthTheme(active ? 'all' : theme.id)}
                    className={`w-full cursor-pointer rounded-xl border p-3 text-left transition-colors ${
                      active
                        ? 'border-[#0056B4] bg-[#EBF4FF]'
                        : 'border-slate-200 bg-white hover:border-[#0056B4]/50 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">{theme.label}</span>
                      <span className="shrink-0 text-xs font-bold text-[#0056B4] tabular-nums">
                        {theme.count} menc. · {theme.pct}%
                      </span>
                    </div>

                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#0056B4] transition-all duration-300"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>

                    <p className="mt-1.5 text-[11px] text-slate-600">{theme.description}</p>
                  </button>
                );
              })
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
