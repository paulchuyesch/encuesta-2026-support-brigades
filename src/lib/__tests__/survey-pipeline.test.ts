import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getBaselineDataset } from '@/lib/baseline';
import {
  buildAnonymizedMap,
  computeDashboardMetrics,
  exportResponsesToCsv,
  filterResponses,
} from '../survey-analytics';
import { parseCsvBuffer, parseMatrixToDataset } from '../survey-parser';
import type { DashboardFilters } from '../types';

const CSV_PATH = path.resolve(
  __dirname,
  '../../../Encuesta de Satisfacción de Servicios - Support Brigades(Sheet1).csv',
);

const DEFAULT_FILTERS: DashboardFilters = {
  excludeInternal: false,
  monthKey: 'all',
  segment: 'all',
  selectedScore: null,
  improvementTheme: 'all',
  strengthTheme: 'all',
  searchQuery: '',
};

function loadRealCsvBuffer(): ArrayBuffer {
  const buf = fs.readFileSync(CSV_PATH);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

describe('Survey CSV parsing & Support Brigades analytics pipeline', () => {
  it('decodes Windows-1252 CSV bytes cleanly and preserves accents and multiline quotes', () => {
    const dataset = parseCsvBuffer(loadRealCsvBuffer(), 'encuesta.csv');
    expect(dataset.responses).toHaveLength(39);

    const row3 = dataset.responses.find((r) => r.id === 3);
    expect(row3?.respondentName).toBe('Mónica Garay Solano');
    expect(row3?.company).toBe('Provincia agustina Nuestra Señora de Gracia del Perú');

    const row22 = dataset.responses.find((r) => r.id === 22);
    expect(row22?.improvementComment).toContain('1. Mejorar el tiempo');
    expect(row22?.improvementComment).toContain('7. Enviar por correo');
  });

  it('computes exact NPS, average, segments, and monthly breakdown', () => {
    const dataset = parseCsvBuffer(loadRealCsvBuffer(), 'encuesta.csv');
    const metrics = computeDashboardMetrics(dataset.responses);

    expect(metrics.total).toBe(39);
    expect(metrics.promoters).toBe(22);
    expect(metrics.passives).toBe(14);
    expect(metrics.detractors).toBe(3);
    expect(metrics.nps).toBe(48.7);
    expect(metrics.averageScore).toBe(8.59);
    expect(metrics.medianScore).toBe(9);

    expect(metrics.monthlyTrend.map((m) => m.monthKey)).toEqual([
      '2026-08',
      '2026-09',
      '2026-10',
    ]);
    expect(metrics.monthlyTrend.reduce((acc, m) => acc + m.count, 0)).toBe(39);
  });

  it('flags internal Support Brigades entry and multi-company respondent group', () => {
    const dataset = parseCsvBuffer(loadRealCsvBuffer(), 'encuesta.csv');

    const internalRows = dataset.responses.filter((r) => r.isInternal);
    expect(internalRows.map((r) => r.id)).toEqual([27]);

    const jessicaRows = dataset.responses.filter(
      (r) => r.multiCompanyGroup === 'jessica huambo',
    );
    expect(jessicaRows.map((r) => r.id)).toEqual([39, 40, 41, 42]);

    const externalOnly = filterResponses(dataset.responses, {
      ...DEFAULT_FILTERS,
      excludeInternal: true,
    });
    const externalMetrics = computeDashboardMetrics(externalOnly);
    expect(externalMetrics.total).toBe(38);
    expect(externalMetrics.nps).toBe(47.4);
  });

  it('classifies actionable improvements vs non-actionable praise and extracts SST themes', () => {
    const dataset = parseCsvBuffer(loadRealCsvBuffer(), 'encuesta.csv');

    const row3 = dataset.responses.find((r) => r.id === 3);
    expect(row3?.hasMeaningfulImprovement).toBe(false);

    const row6 = dataset.responses.find((r) => r.id === 6);
    expect(row6?.hasMeaningfulImprovement).toBe(false);

    const row22 = dataset.responses.find((r) => r.id === 22);
    expect(row22?.hasMeaningfulImprovement).toBe(true);
    expect(row22?.improvementThemes).toContain('salud_ocupacional_emos');
    expect(row22?.improvementThemes).toContain('rotacion_personal');
    expect(row22?.improvementThemes).toContain('comunicacion_proactividad');

    const row42 = dataset.responses.find((r) => r.id === 42);
    expect(row42?.improvementThemes).toContain('capacitaciones');
    expect(row42?.strengthThemes).toContain('inspecciones_capacitaciones');

    const unclassifiedImprovements = dataset.responses
      .filter((r) => r.hasMeaningfulImprovement && r.improvementThemes.length === 0)
      .map((r) => [r.id, r.improvementComment]);
    const unclassifiedStrengths = dataset.responses
      .filter((r) => r.hasMeaningfulStrength && r.strengthThemes.length === 0)
      .map((r) => [r.id, r.strengthComment]);

    expect(unclassifiedImprovements).toEqual([]);
    expect(unclassifiedStrengths).toEqual([]);
  });

  it('anonymizes companies and respondents consistently in presentation mode and exports CSV', () => {
    const dataset = parseCsvBuffer(loadRealCsvBuffer(), 'encuesta.csv');
    const anonMap = buildAnonymizedMap(dataset.responses);

    expect(anonMap.get(27)?.displayCompany).toBe('Registro Interno');
    expect(anonMap.get(13)?.displayCompany).toMatch(/^Empresa Cliente #\d{2}$/);
    expect(anonMap.get(13)?.displayRespondent).toBe('Encuestado #13');

    const csv = exportResponsesToCsv(dataset.responses, true, anonMap);
    expect(csv).not.toContain('AFP Habitat');
    expect(csv).not.toContain('Janett Flores');
    expect(csv).toContain('Encuestado #13');
  });

  it('parses generic Excel-style matrices with Date objects cleanly', () => {
    const dataset = parseMatrixToDataset(
      [
        [
          'Id',
          'Hora de inicio',
          'Hora de finalización',
          'Nombres y Apellidos',
          'Empresa',
          'Cargo',
          '¿Qué tan probable es que recomiende los servicios?',
          '¿Qué cambios tendría que hacer?',
          '¿Qué hace bien?',
        ],
        [
          1,
          new Date(2026, 9, 20, 9, 0),
          new Date(2026, 9, 20, 9, 4),
          'Ana Pérez',
          'Minera Norte S.A.',
          'Jefe SST',
          10,
          'Ninguna',
          'Excelente seguimiento y respuesta rápida',
        ],
      ],
      'test.xlsx',
    );

    expect(dataset.responses).toHaveLength(1);
    expect(dataset.responses[0].monthKey).toBe('2026-10');
    expect(dataset.responses[0].durationMinutes).toBe(4);
    expect(dataset.responses[0].segment).toBe('promoter');
  });

  it('matches bundled baseline-matrix.json identically with the raw CSV file', () => {
    const csvDataset = parseCsvBuffer(loadRealCsvBuffer(), 'base');
    const baselineDataset = getBaselineDataset();
    expect(baselineDataset.responses).toEqual(csvDataset.responses);
  });
});
