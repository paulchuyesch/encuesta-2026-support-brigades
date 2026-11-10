import type {
  DashboardFilters,
  DashboardMetrics,
  ImprovementThemeId,
  MonthlyTrendItem,
  NpsSegment,
  ScoreDistributionItem,
  StrengthThemeId,
  SurveyResponse,
  ThemeRule,
  ThemeStat,
} from './types';
import {
  IMPROVEMENT_THEME_RULES,
  normalizeText,
  STRENGTH_THEME_RULES,
} from './survey-themes';

/** Classifies a 0–10 NPS rating into promoter, passive, or detractor. */
export function getNpsSegment(score: number): NpsSegment {
  if (score >= 9) return 'promoter';
  if (score >= 7) return 'passive';
  return 'detractor';
}

/** Rounds a number to a fixed number of decimals safely. */
function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Computes the median of a numeric array, or 0 if empty. */
function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return roundTo((sorted[mid - 1] + sorted[mid]) / 2, 2);
  }
  return roundTo(sorted[mid], 2);
}

/** Computes aggregate theme frequencies and average scores across responses. */
function buildThemeStats<T extends string>(
  responses: SurveyResponse[],
  rules: ThemeRule<T>[],
  getThemes: (r: SurveyResponse) => T[],
  denominator: number,
): ThemeStat<T>[] {
  return rules
    .map((rule) => {
      const matching = responses.filter((r) => getThemes(r).includes(rule.id));
      const count = matching.length;
      const avgScore =
        count > 0
          ? roundTo(matching.reduce((acc, r) => acc + r.score, 0) / count, 2)
          : 0;
      const pct = denominator > 0 ? roundTo((count / denominator) * 100, 1) : 0;
      return {
        id: rule.id,
        label: rule.label,
        shortLabel: rule.shortLabel,
        description: rule.description,
        count,
        pct,
        avgScore,
      };
    })
    .filter((stat) => stat.count > 0)
    .sort((a, b) => b.count - a.count || a.avgScore - b.avgScore);
}

/** Filters survey responses according to active dashboard controls. */
export function filterResponses(
  responses: SurveyResponse[],
  filters: DashboardFilters,
): SurveyResponse[] {
  const query = normalizeText(filters.searchQuery);

  return responses.filter((r) => {
    if (filters.excludeInternal && r.isInternal) return false;
    if (filters.monthKey !== 'all' && r.monthKey !== filters.monthKey) return false;
    if (filters.segment !== 'all' && r.segment !== filters.segment) return false;
    if (filters.selectedScore !== null && r.score !== filters.selectedScore) return false;
    if (
      filters.improvementTheme !== 'all' &&
      !r.improvementThemes.includes(filters.improvementTheme)
    ) {
      return false;
    }
    if (
      filters.strengthTheme !== 'all' &&
      !r.strengthThemes.includes(filters.strengthTheme)
    ) {
      return false;
    }

    if (query) {
      const haystack = normalizeText(
        `${r.id} ${r.company} ${r.respondentName} ${r.role} ${r.improvementComment} ${r.strengthComment}`,
      );
      if (!haystack.includes(query)) return false;
    }

    return true;
  });
}

/** Computes all KPI, distribution, temporal, and thematic metrics for a slice. */
export function computeDashboardMetrics(responses: SurveyResponse[]): DashboardMetrics {
  const total = responses.length;
  const uniqueCompanies = new Set(
    responses.map((r) => normalizeText(r.company)).filter(Boolean),
  ).size;

  const promoters = responses.filter((r) => r.segment === 'promoter').length;
  const passives = responses.filter((r) => r.segment === 'passive').length;
  const detractors = responses.filter((r) => r.segment === 'detractor').length;

  const promoterPct = total > 0 ? roundTo((promoters / total) * 100, 1) : 0;
  const passivePct = total > 0 ? roundTo((passives / total) * 100, 1) : 0;
  const detractorPct = total > 0 ? roundTo((detractors / total) * 100, 1) : 0;
  const nps = total > 0 ? roundTo(((promoters - detractors) / total) * 100, 1) : 0;

  const scores = responses.map((r) => r.score);
  const averageScore =
    total > 0 ? roundTo(scores.reduce((sum, s) => sum + s, 0) / total, 2) : 0;
  const medianScore = computeMedian(scores);

  const durations = responses
    .map((r) => r.durationMinutes)
    .filter((d): d is number => d !== null && d >= 0 && d <= 240);
  const medianDurationMinutes = durations.length > 0 ? computeMedian(durations) : null;

  const actionableImprovementCount = responses.filter(
    (r) => r.hasMeaningfulImprovement,
  ).length;
  const meaningfulStrengthCount = responses.filter((r) => r.hasMeaningfulStrength).length;

  const actionableImprovementRate =
    total > 0 ? roundTo((actionableImprovementCount / total) * 100, 1) : 0;
  const meaningfulStrengthRate =
    total > 0 ? roundTo((meaningfulStrengthCount / total) * 100, 1) : 0;

  const scoreDistribution: ScoreDistributionItem[] = Array.from(
    { length: 11 },
    (_, score) => ({
      score,
      count: responses.filter((r) => r.score === score).length,
      segment: getNpsSegment(score),
    }),
  );

  const monthBuckets = new Map<string, { label: string; items: SurveyResponse[] }>();
  for (const r of responses) {
    if (!r.monthKey) continue;
    const bucket = monthBuckets.get(r.monthKey);
    if (bucket) {
      bucket.items.push(r);
    } else {
      monthBuckets.set(r.monthKey, { label: r.monthLabel, items: [r] });
    }
  }

  const monthlyTrend: MonthlyTrendItem[] = [...monthBuckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, { label, items }]) => {
      const count = items.length;
      const p = items.filter((i) => i.segment === 'promoter').length;
      const pas = items.filter((i) => i.segment === 'passive').length;
      const det = items.filter((i) => i.segment === 'detractor').length;
      const avg = roundTo(items.reduce((s, i) => s + i.score, 0) / count, 2);
      const monthNps = roundTo(((p - det) / count) * 100, 1);
      return {
        monthKey,
        monthLabel: label,
        count,
        nps: monthNps,
        averageScore: avg,
        promoters: p,
        passives: pas,
        detractors: det,
      };
    });

  const improvementThemeStats = buildThemeStats<ImprovementThemeId>(
    responses,
    IMPROVEMENT_THEME_RULES,
    (r) => r.improvementThemes,
    actionableImprovementCount || total,
  );

  const strengthThemeStats = buildThemeStats<StrengthThemeId>(
    responses,
    STRENGTH_THEME_RULES,
    (r) => r.strengthThemes,
    meaningfulStrengthCount || total,
  );

  return {
    total,
    uniqueCompanies,
    promoters,
    passives,
    detractors,
    promoterPct,
    passivePct,
    detractorPct,
    nps,
    averageScore,
    medianScore,
    medianDurationMinutes,
    actionableImprovementCount,
    actionableImprovementRate,
    meaningfulStrengthCount,
    meaningfulStrengthRate,
    scoreDistribution,
    monthlyTrend,
    improvementThemeStats,
    strengthThemeStats,
  };
}

/** Builds deterministic anonymous labels for Presentation Mode. */
export function buildAnonymizedMap(
  responses: SurveyResponse[],
): Map<number, { displayCompany: string; displayRespondent: string }> {
  const companyCodeMap = new Map<string, string>();
  let companyCounter = 1;

  const result = new Map<number, { displayCompany: string; displayRespondent: string }>();
  for (const r of responses) {
    const key = normalizeText(r.company) || `id-${r.id}`;
    let displayCompany = companyCodeMap.get(key);
    if (!displayCompany) {
      displayCompany = r.isInternal
        ? 'Registro Interno'
        : `Empresa Cliente #${String(companyCounter++).padStart(2, '0')}`;
      companyCodeMap.set(key, displayCompany);
    }

    result.set(r.id, {
      displayCompany,
      displayRespondent: `Encuestado #${r.id}`,
    });
  }
  return result;
}

/** Escapes a single CSV field following RFC-4180. */
function escapeCsvCell(value: string | number): string {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Serializes filtered survey responses to UTF-8 CSV with BOM for Excel. */
export function exportResponsesToCsv(
  responses: SurveyResponse[],
  presentationMode: boolean,
  anonMap: Map<number, { displayCompany: string; displayRespondent: string }>,
): string {
  const headers = [
    'Id',
    'Fecha',
    'Empresa',
    'Contacto',
    'Cargo',
    'Puntaje NPS',
    'Segmento',
    'Oportunidades de Mejora',
    'Fortalezas Destacadas',
  ];

  const segmentLabels: Record<NpsSegment, string> = {
    promoter: 'Promotor',
    passive: 'Pasivo',
    detractor: 'Detractor',
  };

  const rows = responses.map((r) => {
    const anon = anonMap.get(r.id);
    const company = presentationMode ? (anon?.displayCompany ?? 'Empresa') : r.company;
    const respondent = presentationMode
      ? (anon?.displayRespondent ?? `Encuestado #${r.id}`)
      : r.respondentName;

    return [
      r.id,
      r.completedAt,
      company,
      respondent,
      r.role,
      r.score,
      segmentLabels[r.segment],
      r.improvementComment,
      r.strengthComment,
    ]
      .map(escapeCsvCell)
      .join(',');
  });

  return `\uFEFF${headers.join(',')}\r\n${rows.join('\r\n')}`;
}
