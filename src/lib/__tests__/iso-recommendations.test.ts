import { describe, expect, it } from 'vitest';
import { getBaselineDataset } from '@/lib/baseline';
import { buildIso9001MetaPrompt } from '@/lib/iso-metaprompt';
import {
  buildEditableRecommendationsDraft,
  generateIsoRecommendations,
} from '@/lib/iso-recommendations';
import {
  buildAnonymizedMap,
  computeDashboardMetrics,
  filterResponses,
} from '@/lib/survey-analytics';
import type { DashboardFilters } from '@/lib/types';

const BASE_FILTERS: DashboardFilters = {
  excludeInternal: true,
  monthKey: 'all',
  segment: 'all',
  selectedScore: null,
  improvementTheme: 'all',
  strengthTheme: 'all',
  searchQuery: '',
};

describe('ISO 9001:2015 recommendations and specialist meta-prompt', () => {
  it('generates prioritized ISO 9001:2015 recommendations grounded in real metrics', () => {
    const dataset = getBaselineDataset();
    const external = filterResponses(dataset.responses, BASE_FILTERS);
    const metrics = computeDashboardMetrics(external);
    const anonMap = buildAnonymizedMap(dataset.responses);

    const recs = generateIsoRecommendations(external, metrics, false, anonMap);

    expect(recs.length).toBeGreaterThanOrEqual(5);
    expect(recs[0].priority).toBe('critica');
    expect(recs[0].isoClause).toContain('10.2');
    expect(recs[0].evidence).toContain('AFP Habitat');
    expect(recs[0].evidence).toContain('Assist Card');

    const clausesJoined = recs.map((r) => r.isoClause).join(' ');
    expect(clausesJoined).toContain('7.5');
    expect(clausesJoined).toContain('7.2');
    expect(clausesJoined).toContain('10.3');

    const draft = buildEditableRecommendationsDraft(recs, metrics);
    expect(draft).toContain('NPS: +47.4');
    expect(draft).toContain('ISO 9001:2015');
  });

  it('adapts recommendations dynamically when filtering to October 2026 only', () => {
    const dataset = getBaselineDataset();
    const october = filterResponses(dataset.responses, {
      ...BASE_FILTERS,
      monthKey: '2026-10',
    });
    const metrics = computeDashboardMetrics(october);
    const anonMap = buildAnonymizedMap(dataset.responses);

    const recs = generateIsoRecommendations(october, metrics, false, anonMap);

    expect(recs.some((r) => r.priority === 'critica')).toBe(false);
    expect(recs.some((r) => r.relatedThemeId === 'capacitaciones')).toBe(true);
  });

  it('respects presentationMode anonymization in both recommendations and meta-prompt', () => {
    const dataset = getBaselineDataset();
    const external = filterResponses(dataset.responses, BASE_FILTERS);
    const metrics = computeDashboardMetrics(external);
    const anonMap = buildAnonymizedMap(dataset.responses);

    const recs = generateIsoRecommendations(external, metrics, true, anonMap);
    const prompt = buildIso9001MetaPrompt({
      sourceName: dataset.sourceName,
      responses: external,
      metrics,
      recommendations: recs,
      presentationMode: true,
      anonMap,
      focus: 'revision_direccion',
      customContext: 'Comité mensual de calidad noviembre.',
    });

    expect(recs[0].evidence).not.toContain('AFP Habitat');
    expect(recs[0].evidence).toContain('Empresa Cliente #');

    expect(prompt).not.toContain('AFP Habitat');
    expect(prompt).not.toContain('Assist Card');
    expect(prompt).toContain('9.3.2');
    expect(prompt).toContain('Comité mensual de calidad noviembre.');
    expect(prompt).toContain('Net Promoter Score (NPS): **+47.4**');
  });

  it('builds distinct deliverables for all three MetaPromptFocus modes', () => {
    const dataset = getBaselineDataset();
    const metrics = computeDashboardMetrics(dataset.responses);
    const anonMap = buildAnonymizedMap(dataset.responses);
    const recs = generateIsoRecommendations(dataset.responses, metrics, false, anonMap);

    const sacPrompt = buildIso9001MetaPrompt({
      sourceName: dataset.sourceName,
      responses: dataset.responses,
      metrics,
      recommendations: recs,
      presentationMode: false,
      anonMap,
      focus: 'acciones_correctivas',
    });

    expect(sacPrompt).toContain('Matriz SAC');
    expect(sacPrompt).toContain('10.2.1');
    expect(sacPrompt).toContain('5 Porqués');
  });
});
