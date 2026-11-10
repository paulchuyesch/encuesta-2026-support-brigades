'use client';

import { useMemo, useState } from 'react';
import {
  Check,
  ClipboardCheck,
  Copy,
  Download,
  FileText,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { buildIso9001MetaPrompt } from '@/lib/iso-metaprompt';
import {
  buildEditableRecommendationsDraft,
  generateIsoRecommendations,
} from '@/lib/iso-recommendations';
import type {
  DashboardMetrics,
  IsoPriority,
  MetaPromptFocus,
  SurveyResponse,
} from '@/lib/types';

interface RecommendationsSectionProps {
  sourceName: string;
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

const FOCUS_OPTIONS: Array<{ value: MetaPromptFocus; label: string; subtitle: string }> = [
  {
    value: 'ejecutivo',
    label: 'Informe Ejecutivo + Plan 10.2',
    subtitle: 'Para Gerencia y Jefatura Comercial',
  },
  {
    value: 'revision_direccion',
    label: 'Revisión por la Dirección (9.3)',
    subtitle: 'Entrada formal del Comité SIG',
  },
  {
    value: 'acciones_correctivas',
    label: 'Matriz SAC / Causa Raíz (10.2)',
    subtitle: '5 Porqués y contención de cuentas',
  },
];

export function RecommendationsSection({
  sourceName,
  responses,
  metrics,
  presentationMode,
  anonMap,
}: RecommendationsSectionProps) {
  const [activeTab, setActiveTab] = useState<'recommendations' | 'metaprompt'>(
    'recommendations',
  );
  const [customDraft, setCustomDraft] = useState<string | null>(null);
  const [focus, setFocus] = useState<MetaPromptFocus>('ejecutivo');
  const [customContext, setCustomContext] = useState('');
  const [copiedTarget, setCopiedTarget] = useState<'draft' | 'prompt' | null>(null);

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

  const autoDraft = useMemo(
    () => buildEditableRecommendationsDraft(recommendations, metrics),
    [recommendations, metrics],
  );

  const effectiveDraft = customDraft ?? autoDraft;

  const metaPrompt = useMemo(
    () =>
      buildIso9001MetaPrompt({
        sourceName,
        responses,
        metrics,
        recommendations,
        presentationMode,
        anonMap,
        focus,
        customContext,
      }),
    [
      sourceName,
      responses,
      metrics,
      recommendations,
      presentationMode,
      anonMap,
      focus,
      customContext,
    ],
  );

  async function copyToClipboard(text: string, target: 'draft' | 'prompt') {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTarget(target);
      setTimeout(() => {
        setCopiedTarget((prev) => (prev === target ? null : prev));
      }, 2200);
    } catch {
      // Clipboard API unavailable in restricted contexts
    }
  }

  function downloadMarkdown(filename: string, content: string) {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <section
      aria-label="Recomendaciones basadas en ISO 9001:2015 y Meta-Prompt especialista"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
    >
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
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
            Plan accionable derivado automáticamente de los resultados filtrados y meta-prompt de
            especialista SIG listo para informes de dirección.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Vistas de recomendaciones ISO 9001"
          className="no-print inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'recommendations'}
            onClick={() => setActiveTab('recommendations')}
            className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
              activeTab === 'recommendations'
                ? 'bg-white text-[#0056B4] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Recomendaciones ({recommendations.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'metaprompt'}
            onClick={() => setActiveTab('metaprompt')}
            className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
              activeTab === 'metaprompt'
                ? 'bg-white text-[#0056B4] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Meta-Prompt ISO 9001</span>
          </button>
        </div>
      </div>

      {activeTab === 'recommendations' ? (
        <div className="mt-5 space-y-6">
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

          {/* Editable Field for Final Management Recommendations & Agreements */}
          <div className="print-break-avoid rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#0056B4]" aria-hidden="true" />
                <label
                  htmlFor="recommendations-notes"
                  className="text-xs font-extrabold uppercase tracking-wider text-[#0A2540]"
                >
                  Campo de Recomendaciones y Acuerdos de Dirección
                </label>
              </div>

              <div className="no-print flex flex-wrap items-center gap-2">
                {customDraft !== null && (
                  <button
                    type="button"
                    onClick={() => setCustomDraft(null)}
                    className="inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Regenerar desde datos</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => void copyToClipboard(effectiveDraft, 'draft')}
                  className="inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {copiedTarget === 'draft' ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
                  )}
                  <span>{copiedTarget === 'draft' ? 'Copiado' : 'Copiar texto'}</span>
                </button>
              </div>
            </div>

            <p className="mt-1 text-[11px] text-slate-600">
              Edita o personaliza responsables, fechas límite y acuerdos antes de imprimir el PDF o
              copiar el informe para gerencia.
            </p>

            <textarea
              id="recommendations-notes"
              rows={9}
              value={effectiveDraft}
              onChange={(e) => setCustomDraft(e.target.value)}
              className="mt-3 w-full rounded-xl border border-slate-300 bg-white p-3.5 font-sans text-xs leading-relaxed text-slate-800 focus:border-[#0056B4] focus:outline-none focus:ring-2 focus:ring-[#0056B4]/20"
            />
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {FOCUS_OPTIONS.map((opt) => {
              const selected = focus === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFocus(opt.value)}
                  className={`cursor-pointer rounded-xl border p-3 text-left transition-colors ${
                    selected
                      ? 'border-[#0056B4] bg-[#EBF4FF]'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <p
                    className={`text-xs font-bold ${
                      selected ? 'text-[#003B7E]' : 'text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-600">{opt.subtitle}</p>
                </button>
              );
            })}
          </div>

          <div>
            <label
              htmlFor="metaprompt-context"
              className="block text-xs font-bold text-slate-700"
            >
              Contexto operativo opcional (objetivos del trimestre, capacidad de equipo o restricciones)
            </label>
            <input
              id="metaprompt-context"
              type="text"
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
              placeholder="Ej. Priorizar retención de cuentas corporativas y reducir rotación médica antes de Q1 2027..."
              className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#0056B4] focus:outline-none focus:ring-2 focus:ring-[#0056B4]/20"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-[#0A2540] text-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/80 px-4 py-2.5">
              <span className="text-xs font-bold text-blue-200">
                Meta-Prompt Especialista ISO 9001:2015 · Inyectado con datos en tiempo real
                {presentationMode ? ' (Modo Anonimizado)' : ''}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void copyToClipboard(metaPrompt, 'prompt')}
                  className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-[#0056B4] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#0066D6]"
                >
                  {copiedTarget === 'prompt' ? (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>{copiedTarget === 'prompt' ? 'Meta-Prompt copiado' : 'Copiar Meta-Prompt'}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    downloadMarkdown(`meta-prompt-iso9001-${focus}.md`, metaPrompt)
                  }
                  className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/70 px-3 py-1 text-xs font-semibold text-slate-100 transition-colors hover:bg-slate-700"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>.MD</span>
                </button>
              </div>
            </div>

            <pre className="max-h-96 overflow-auto p-4 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-slate-100">
              {metaPrompt}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}
