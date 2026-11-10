import { IMPROVEMENT_THEME_RULES, STRENGTH_THEME_RULES } from './survey-themes';
import type { ImprovementThemeId, NpsSegment, StrengthThemeId } from './types';

export interface SegmentVisualConfig {
  label: string;
  shortLabel: string;
  rangeLabel: string;
  color: string;
  softBg: string;
  badgeClass: string;
  borderAccentClass: string;
}

export const SEGMENT_CONFIG: Record<NpsSegment, SegmentVisualConfig> = {
  promoter: {
    label: 'Promotor',
    shortLabel: 'Promotores',
    rangeLabel: '9–10',
    color: '#059669',
    softBg: '#ECFDF5',
    badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    borderAccentClass: 'border-l-emerald-600',
  },
  passive: {
    label: 'Pasivo',
    shortLabel: 'Pasivos',
    rangeLabel: '7–8',
    color: '#0284C7',
    softBg: '#F0F9FF',
    badgeClass: 'bg-sky-50 text-sky-800 border border-sky-200',
    borderAccentClass: 'border-l-sky-600',
  },
  detractor: {
    label: 'Detractor',
    shortLabel: 'Detractores',
    rangeLabel: '0–6',
    color: '#D97706',
    softBg: '#FFFBEB',
    badgeClass: 'bg-amber-50 text-amber-900 border border-amber-300',
    borderAccentClass: 'border-l-amber-600',
  },
};

export const IMPROVEMENT_THEME_MAP: Record<ImprovementThemeId, { label: string; shortLabel: string }> =
  Object.fromEntries(
    IMPROVEMENT_THEME_RULES.map((r) => [r.id, { label: r.label, shortLabel: r.shortLabel }]),
  ) as Record<ImprovementThemeId, { label: string; shortLabel: string }>;

export const STRENGTH_THEME_MAP: Record<StrengthThemeId, { label: string; shortLabel: string }> =
  Object.fromEntries(
    STRENGTH_THEME_RULES.map((r) => [r.id, { label: r.label, shortLabel: r.shortLabel }]),
  ) as Record<StrengthThemeId, { label: string; shortLabel: string }>;

export function getNpsTier(nps: number): { label: string; className: string } {
  if (nps >= 70) {
    return {
      label: 'Clase Mundial',
      className: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    };
  }
  if (nps >= 50) {
    return {
      label: 'Excelente',
      className: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    };
  }
  if (nps >= 30) {
    return {
      label: 'Muy Bueno',
      className: 'bg-[#EBF4FF] text-[#0056B4] border border-[#BFD9FA]',
    };
  }
  if (nps >= 0) {
    return {
      label: 'En Desarrollo',
      className: 'bg-sky-50 text-sky-800 border border-sky-200',
    };
  }
  return {
    label: 'Atención Prioritaria',
    className: 'bg-amber-50 text-amber-900 border border-amber-300',
  };
}
