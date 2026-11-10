import baselineMatrix from '@/data/baseline-matrix.json';
import { parseMatrixToDataset } from './survey-parser';
import type { SurveyDataset } from './types';

export function getBaselineDataset(): SurveyDataset {
  return parseMatrixToDataset(
    baselineMatrix as string[][],
    'Encuesta de Satisfacción de Servicios 2026 (Base)',
  );
}
