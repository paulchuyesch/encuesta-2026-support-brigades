import Papa from 'papaparse';
import { readSheet } from 'read-excel-file/universal';
import { getNpsSegment } from './survey-analytics';
import {
  classifyImprovementThemes,
  classifyStrengthThemes,
  isActionableImprovement,
  isMeaningfulComment,
  normalizeText,
} from './survey-themes';
import type { SurveyDataset, SurveyResponse } from './types';

const MONTHS_ES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

interface ColumnMapping {
  id: number;
  startedAt: number;
  completedAt: number;
  respondentName: number;
  fallbackName: number;
  company: number;
  role: number;
  score: number;
  improvementComment: number;
  strengthComment: number;
}

/**
 * Decodes raw file bytes as UTF-8 first, falling back to Windows-1252
 * when Spanish Excel exports use legacy single-byte encoding.
 */
export function decodeCsvBytes(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder('windows-1252').decode(buffer);
  }
}

export type RawCell = string | number | boolean | Date | null | undefined;

function cellToString(value: RawCell): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) {
    const m = value.getMonth() + 1;
    const d = value.getDate();
    const y = value.getFullYear();
    const hh = String(value.getHours()).padStart(2, '0');
    const mm = String(value.getMinutes()).padStart(2, '0');
    return `${m}/${d}/${y} ${hh}:${mm}`;
  }
  return String(value).replace(/\u00a0/g, ' ').trim();
}

function resolveColumns(headers: string[]): ColumnMapping {
  const normHeaders = headers.map((h) => normalizeText(h));

  const findIndex = (predicate: (h: string) => boolean): number =>
    normHeaders.findIndex(predicate);

  return {
    id: findIndex((h) => h === 'id'),
    startedAt: findIndex((h) => h.includes('hora de inicio') || h.includes('start')),
    completedAt: findIndex(
      (h) => h.includes('hora de finalizacion') || h.includes('completion') || h === 'fecha',
    ),
    respondentName: findIndex(
      (h) => h.includes('nombres y apellidos') || h.includes('nombre completo'),
    ),
    fallbackName: findIndex((h) => h === 'nombre' || h === 'name'),
    company: findIndex(
      (h) => h.includes('empresa') || h.includes('organizacion') || h.includes('cliente'),
    ),
    role: findIndex((h) => h.includes('cargo') || h.includes('puesto')),
    score: findIndex(
      (h) =>
        h.includes('probable') ||
        h.includes('recomiende') ||
        h.includes('nps') ||
        h.includes('calificacion'),
    ),
    improvementComment: findIndex(
      (h) => h.includes('cambios') || h.includes('mejorar') || h.includes('calificacion aun mas alta'),
    ),
    strengthComment: findIndex(
      (h) => h.includes('hace bien') || h.includes('fortaleza') || h.includes('positivo'),
    ),
  };
}

/** Detects whether slash-separated dates in the sheet follow M/D/Y or D/M/Y. */
function detectDateOrder(rawDates: string[]): 'MDY' | 'DMY' {
  for (const raw of rawDates) {
    const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (!match) continue;
    const first = Number(match[1]);
    const second = Number(match[2]);
    if (first > 12) return 'DMY';
    if (second > 12) return 'MDY';
  }
  return 'MDY';
}

function parseSurveyDate(
  rawValue: RawCell,
  order: 'MDY' | 'DMY',
): Date | null {
  if (rawValue instanceof Date && !Number.isNaN(rawValue.getTime())) {
    return rawValue;
  }

  const raw = cellToString(rawValue);
  if (!raw) return null;

  const slashMatch = raw.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (slashMatch) {
    const a = Number(slashMatch[1]);
    const b = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);
    const hour = Number(slashMatch[4] ?? 0);
    const minute = Number(slashMatch[5] ?? 0);
    const second = Number(slashMatch[6] ?? 0);
    const month = (order === 'MDY' ? a : b) - 1;
    const day = order === 'MDY' ? b : a;
    const date = new Date(year, month, day, hour, minute, second);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const isoDate = new Date(raw);
  return Number.isNaN(isoDate.getTime()) ? null : isoDate;
}

function formatMonth(date: Date | null): { monthKey: string; monthLabel: string } {
  if (!date) return { monthKey: 'sin-fecha', monthLabel: 'Sin fecha' };
  const year = date.getFullYear();
  const monthIdx = date.getMonth();
  const monthKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
  const monthLabel = `${MONTHS_ES[monthIdx]} ${year}`;
  return { monthKey, monthLabel };
}

function parseScore(rawValue: RawCell): number | null {
  if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
    const rounded = Math.round(rawValue);
    return rounded >= 0 && rounded <= 10 ? rounded : null;
  }
  const str = cellToString(rawValue);
  if (!str) return null;
  const num = Number(str.replace(',', '.'));
  if (!Number.isFinite(num)) return null;
  const rounded = Math.round(num);
  return rounded >= 0 && rounded <= 10 ? rounded : null;
}

function getPersonGroupKey(name: string): string {
  const norm = normalizeText(name);
  if (!norm || norm.startsWith('participante #')) return '';
  const tokens = norm.split(' ').filter(Boolean);
  return tokens.length >= 2 ? `${tokens[0]} ${tokens[1]}` : norm;
}

/** Converts a 2D spreadsheet/CSV row matrix into an enriched SurveyDataset. */
export function parseMatrixToDataset(
  matrix: RawCell[][],
  sourceName: string,
): SurveyDataset {
  const nonEmptyRows = matrix.filter((row) =>
    row.some((cell) => cellToString(cell) !== ''),
  );
  if (nonEmptyRows.length < 2) {
    throw new Error('El archivo no contiene suficientes filas de datos.');
  }

  const headers = nonEmptyRows[0].map((cell) => cellToString(cell));
  const cols = resolveColumns(headers);

  if (cols.score === -1) {
    throw new Error(
      'No se encontró la columna de puntuación NPS (0–10) en el archivo.',
    );
  }

  const dataRows = nonEmptyRows.slice(1);
  const dateStrings = dataRows.map((row) =>
    cols.completedAt >= 0 ? cellToString(row[cols.completedAt]) : '',
  );
  const dateOrder = detectDateOrder(dateStrings);

  const warnings: string[] = [];
  const parsed: SurveyResponse[] = [];

  dataRows.forEach((row, idx) => {
    const score = parseScore(row[cols.score]);
    if (score === null) {
      warnings.push(`Fila ${idx + 2} omitida: puntaje inválido.`);
      return;
    }

    const rawId = cols.id >= 0 ? Number(cellToString(row[cols.id])) : idx + 1;
    const id = Number.isFinite(rawId) && rawId > 0 ? rawId : idx + 1;

    const startedRaw = cols.startedAt >= 0 ? row[cols.startedAt] : '';
    const completedRaw = cols.completedAt >= 0 ? row[cols.completedAt] : '';
    const startDate = parseSurveyDate(startedRaw, dateOrder);
    const endDate = parseSurveyDate(completedRaw, dateOrder);

    const durationMinutes =
      startDate && endDate
        ? Math.round(((endDate.getTime() - startDate.getTime()) / 60000) * 10) / 10
        : null;

    const primaryName =
      cols.respondentName >= 0 ? cellToString(row[cols.respondentName]) : '';
    const secondaryName =
      cols.fallbackName >= 0 ? cellToString(row[cols.fallbackName]) : '';
    const respondentName = primaryName || secondaryName || `Participante #${id}`;

    const company =
      cols.company >= 0 ? cellToString(row[cols.company]) || 'Sin empresa' : 'Sin empresa';
    const role = cols.role >= 0 ? cellToString(row[cols.role]) || 'Sin cargo' : 'Sin cargo';

    const improvementComment =
      cols.improvementComment >= 0 ? cellToString(row[cols.improvementComment]) : '';
    const strengthComment =
      cols.strengthComment >= 0 ? cellToString(row[cols.strengthComment]) : '';

    const { monthKey, monthLabel } = formatMonth(endDate ?? startDate);
    const isInternal = normalizeText(company).includes('support brigades');

    parsed.push({
      id,
      startedAt: cellToString(startedRaw),
      completedAt: cellToString(completedRaw),
      completedTimestamp: (endDate ?? startDate)?.getTime() ?? id,
      monthKey,
      monthLabel,
      durationMinutes: durationMinutes !== null && durationMinutes >= 0 ? durationMinutes : null,
      respondentName,
      company,
      role,
      score,
      segment: getNpsSegment(score),
      improvementComment,
      strengthComment,
      hasMeaningfulImprovement: isActionableImprovement(improvementComment),
      hasMeaningfulStrength: isMeaningfulComment(strengthComment),
      improvementThemes: classifyImprovementThemes(improvementComment),
      strengthThemes: classifyStrengthThemes(strengthComment),
      isInternal,
      multiCompanyGroup: null,
    });
  });

  // Detect single respondents submitting for multiple companies
  const respondentCompanies = new Map<string, Set<string>>();
  for (const r of parsed) {
    const personKey = getPersonGroupKey(r.respondentName);
    const companyKey = normalizeText(r.company);
    if (!personKey) continue;
    const set = respondentCompanies.get(personKey) ?? new Set<string>();
    set.add(companyKey);
    respondentCompanies.set(personKey, set);
  }

  for (const r of parsed) {
    const personKey = getPersonGroupKey(r.respondentName);
    const companies = respondentCompanies.get(personKey);
    if (companies && companies.size > 1) {
      r.multiCompanyGroup = personKey;
    }
  }

  return {
    sourceName,
    loadedAt: new Date().toISOString(),
    responses: parsed,
    warnings,
  };
}

/** Parses an uploaded CSV file buffer (auto-detecting UTF-8 vs Windows-1252). */
export function parseCsvBuffer(buffer: ArrayBuffer, sourceName: string): SurveyDataset {
  const text = decodeCsvBytes(buffer);
  const result = Papa.parse<string[]>(text, {
    skipEmptyLines: 'greedy',
  });

  if (result.errors.length > 0 && result.data.length < 2) {
    throw new Error(`Error al leer CSV: ${result.errors[0].message}`);
  }

  return parseMatrixToDataset(result.data, sourceName);
}

/** Parses an uploaded Excel (.xlsx) file buffer via read-excel-file. */
export async function parseXlsxBuffer(
  buffer: ArrayBuffer,
  sourceName: string,
): Promise<SurveyDataset> {
  const sheetData = await readSheet(buffer);
  return parseMatrixToDataset(sheetData as unknown as RawCell[][], sourceName);
}

/** Parses either a .csv or .xlsx File/ArrayBuffer by file extension. */
export async function parseSurveyFile(file: File): Promise<SurveyDataset> {
  const buffer = await file.arrayBuffer();
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.xlsx')) {
    return parseXlsxBuffer(buffer, file.name);
  }
  if (lower.endsWith('.csv')) {
    return parseCsvBuffer(buffer, file.name);
  }
  throw new Error('Formato no compatible. Sube un archivo .csv o .xlsx exportado de Forms.');
}
