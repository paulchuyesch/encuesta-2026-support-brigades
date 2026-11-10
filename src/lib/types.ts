export type NpsSegment = 'promoter' | 'passive' | 'detractor';

export type ImprovementThemeId =
  | 'seguimiento_orden'
  | 'salud_ocupacional_emos'
  | 'rotacion_personal'
  | 'capacitaciones'
  | 'comunicacion_proactividad'
  | 'tiempos_entrega'
  | 'presencia_supervision';

export type StrengthThemeId =
  | 'acompanamiento_seguimiento'
  | 'tiempo_respuesta'
  | 'expertise_normativo'
  | 'trato_disposicion'
  | 'inspecciones_capacitaciones';

export interface RawSurveyRow {
  id?: string | number;
  startedAt?: string;
  completedAt?: string;
  respondentName?: string;
  company?: string;
  role?: string;
  score?: string | number;
  improvementComment?: string;
  strengthComment?: string;
}

export interface SurveyResponse {
  id: number;
  startedAt: string;
  completedAt: string;
  completedTimestamp: number;
  monthKey: string;
  monthLabel: string;
  durationMinutes: number | null;
  respondentName: string;
  company: string;
  role: string;
  score: number;
  segment: NpsSegment;
  improvementComment: string;
  strengthComment: string;
  hasMeaningfulImprovement: boolean;
  hasMeaningfulStrength: boolean;
  improvementThemes: ImprovementThemeId[];
  strengthThemes: StrengthThemeId[];
  isInternal: boolean;
  multiCompanyGroup: string | null;
}

export interface ThemeRule<T extends string> {
  id: T;
  label: string;
  shortLabel: string;
  description: string;
  patterns: RegExp[];
}

export interface ScoreDistributionItem {
  score: number;
  count: number;
  segment: NpsSegment;
}

export interface MonthlyTrendItem {
  monthKey: string;
  monthLabel: string;
  count: number;
  nps: number;
  averageScore: number;
  promoters: number;
  passives: number;
  detractors: number;
}

export interface ThemeStat<T extends string> {
  id: T;
  label: string;
  shortLabel: string;
  description: string;
  count: number;
  pct: number;
  avgScore: number;
}

export interface DashboardMetrics {
  total: number;
  uniqueCompanies: number;
  promoters: number;
  passives: number;
  detractors: number;
  promoterPct: number;
  passivePct: number;
  detractorPct: number;
  nps: number;
  averageScore: number;
  medianScore: number;
  medianDurationMinutes: number | null;
  actionableImprovementCount: number;
  actionableImprovementRate: number;
  meaningfulStrengthCount: number;
  meaningfulStrengthRate: number;
  scoreDistribution: ScoreDistributionItem[];
  monthlyTrend: MonthlyTrendItem[];
  improvementThemeStats: ThemeStat<ImprovementThemeId>[];
  strengthThemeStats: ThemeStat<StrengthThemeId>[];
}

export interface DashboardFilters {
  excludeInternal: boolean;
  monthKey: string; // 'all' | '2026-08' ...
  segment: 'all' | NpsSegment;
  selectedScore: number | null;
  improvementTheme: 'all' | ImprovementThemeId;
  strengthTheme: 'all' | StrengthThemeId;
  searchQuery: string;
}

export interface SurveyDataset {
  sourceName: string;
  loadedAt: string;
  responses: SurveyResponse[];
  warnings: string[];
}
