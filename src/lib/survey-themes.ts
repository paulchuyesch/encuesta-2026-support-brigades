import type { ImprovementThemeId, StrengthThemeId, ThemeRule } from './types';

/** Normalizes Spanish text for accent-insensitive, case-insensitive matching. */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const NO_IMPROVEMENT_PHRASES = new Set([
  '',
  '-',
  '.',
  '..',
  '...',
  'na',
  'n/a',
  'ninguna',
  'ninguno',
  'ninguno por el momento',
  'por el momento ninguna',
  'de momento nada',
  'de momento nads',
  'nada',
  'todo ok',
  'todo bien',
  'sin comentarios',
  'sin observaciones',
]);

const NON_ACTIONABLE_PRAISE_ONLY = [
  /por el momento no tengo alguna sugerencia/,
  /no veo algun cambio/,
  /hacen un buen trabajo/,
  /han logrado responder prontamente/,
  /supera mis expectativas/,
];

const EMPTY_COMMENT_TOKENS = new Set(['', '-', '.', '..', '...', 'na', 'n/a', 'ninguna', 'ninguno']);

/**
 * Determines whether an improvement response contains an actionable suggestion
 * rather than a blank marker or "everything is fine" statement.
 */
export function isActionableImprovement(comment: string): boolean {
  const norm = normalizeText(comment).replace(/[¡!¿?,;]+/g, '').trim();
  if (!norm || NO_IMPROVEMENT_PHRASES.has(norm)) return false;
  if (norm.length <= 3) return false;
  return !NON_ACTIONABLE_PRAISE_ONLY.some((pattern) => pattern.test(norm));
}

/** Determines whether a strength response contains meaningful descriptive text. */
export function isMeaningfulComment(comment: string): boolean {
  const norm = normalizeText(comment).replace(/[¡!¿?,;]+/g, '').trim();
  if (!norm || EMPTY_COMMENT_TOKENS.has(norm)) return false;
  return norm.length > 2;
}

export const IMPROVEMENT_THEME_RULES: ThemeRule<ImprovementThemeId>[] = [
  {
    id: 'seguimiento_orden',
    label: 'Seguimiento, orden y control documental',
    shortLabel: 'Seguimiento y Docs',
    description: 'Programación de tareas, documentación al día, cargos firmados, enlaces de acceso y archivo.',
    patterns: [
      /seguimiento/,
      /document/,
      /archiv/,
      /orden/,
      /programad/,
      /mapead/,
      /cargos/,
      /\blink\b/,
      /acceso/,
      /informes mensuales/,
      /cumplir con lo acordado/,
      /al dia/,
      /flexibilidad en la informacion/,
    ],
  },
  {
    id: 'salud_ocupacional_emos',
    label: 'Salud Ocupacional, EMOs y médicos',
    shortLabel: 'Salud Ocup. / EMOs',
    description: 'Lectura oportuna de EMOs, disponibilidad de médicos ocupacionales, enfermería y carga en psicología.',
    patterns: [
      /\bemos?\b/,
      /salud ocupacional/,
      /seguridad ocupacional/,
      /medic[oa]s?/,
      /psicologia/,
      /enfermer/,
      /lectura/,
    ],
  },
  {
    id: 'rotacion_personal',
    label: 'Rotación, estabilidad y selección de staff',
    shortLabel: 'Rotación y Staff',
    description: 'Permanencia de consultores y médicos, filtros de selección, inducción y ampliación de equipo.',
    patterns: [
      /rotacion/,
      /permanente/,
      /cambios en salud ocupacional/,
      /personal calificado/,
      /seleccion/,
      /induccion/,
      /desarrollo de sus profesionales/,
      /filtro/,
      /ampliar el equipo/,
      /experiencias anteriores/,
      /no contaban con el dominio/,
    ],
  },
  {
    id: 'capacitaciones',
    label: 'Capacitaciones más dinámicas y por rubro',
    shortLabel: 'Capacitaciones',
    description: 'Ponentes más dinámicos, presentaciones de impacto, contenido interactivo y adaptado al rubro.',
    patterns: [
      /capacitacion/,
      /capacitador/,
      /charlas/,
      /dinamic[oa]s?/,
      /interactivo/,
      /entretenido/,
      /duerman/,
      /fastidiosas/,
      /variadas/,
      /\brubro\b/,
      /exposicion/,
      /presentaciones de impacto/,
    ],
  },
  {
    id: 'comunicacion_proactividad',
    label: 'Comunicación, proactividad y trato',
    shortLabel: 'Comunicación',
    description: 'Avisos oportunos ante cambios, coordinación interdisciplinaria, proactividad normativa y amabilidad.',
    patterns: [
      /comunicac/,
      /comunicar/,
      /amabilidad/,
      /proactiv/,
      /antes de estar en la situacion/,
      /analisis de tendencias/,
      /realidad del negocio/,
      /consultor en temas/,
      /integracion entre/,
      /interdisciplinaria/,
      /cambios.*servicios/,
      /informando/,
    ],
  },
  {
    id: 'tiempos_entrega',
    label: 'Tiempos de respuesta y entrega',
    shortLabel: 'Tiempos',
    description: 'Velocidad de atención a consultas, rapidez en reportes y cumplimiento oportuno.',
    patterns: [
      /tiempo de respuesta/,
      /tiempos de entrega/,
      /presentacion oportuna/,
      /\blentos?\b/,
      /rapidez/,
      /oportuna sobre el estado/,
    ],
  },
  {
    id: 'presencia_supervision',
    label: 'Presencia física y supervisión en campo',
    shortLabel: 'Presencia y Supervisión',
    description: 'Mayor acompañamiento presencial y supervisión operativa del personal asignado.',
    patterns: [
      /presencia fisica/,
      /supervision/,
      /involucrados al 100/,
    ],
  },
];

export const STRENGTH_THEME_RULES: ThemeRule<StrengthThemeId>[] = [
  {
    id: 'acompanamiento_seguimiento',
    label: 'Seguimiento y acompañamiento cercano',
    shortLabel: 'Seguimiento',
    description: 'Contacto continuo con el cliente, presencia constante y seguimiento al SGSST.',
    patterns: [
      /seguimiento/,
      /seguimento/,
      /acompanamiento/,
      /contacto con sus clientes/,
      /pendiente/,
      /presentes/,
      /orientacion/,
      /guia/,
    ],
  },
  {
    id: 'tiempo_respuesta',
    label: 'Rapidez de respuesta y cumplimiento',
    shortLabel: 'Rapidez / SLA',
    description: 'Atención inmediata, cumplimiento de fechas establecidas, puntualidad y eficiencia.',
    patterns: [
      /inmediata/,
      /rapid[oa]/,
      /pront[oa]/,
      /celere/,
      /oportun[oa]/,
      /puntual/,
      /eficiencia/,
      /expeditivos/,
      /fechas establecidas/,
      /prestos/,
    ],
  },
  {
    id: 'expertise_normativo',
    label: 'Expertise técnico SST y cumplimiento legal',
    shortLabel: 'Expertise SST/Legal',
    description: 'Dominio técnico, cumplimiento normativo, soluciones prácticas, auditorías y homologación.',
    patterns: [
      /\bley\b/,
      /normativa/,
      /\bsst\b/,
      /\bsgsst\b/,
      /\bso\b/,
      /salud ocupacional/,
      /salud mental/,
      /domina/,
      /expertis/,
      /calificados/,
      /soluciones/,
      /meticulosos/,
      /auditoria/,
      /homologacion/,
      /gestion integral/,
      /calidad de servicio/,
    ],
  },
  {
    id: 'trato_disposicion',
    label: 'Trato cordial, soporte y disposición',
    shortLabel: 'Trato y Soporte',
    description: 'Amabilidad, respeto, vocación de servicio, claridad al explicar y apoyo constante.',
    patterns: [
      /cordial/,
      /respetuoso/,
      /amable/,
      /disposicion/,
      /predispuestos/,
      /servicial/,
      /soporte/,
      /apoyo/,
      /compromiso/,
      /claro en sus explicaciones/,
      /resolver y ayudar/,
      /buen trabajo/,
    ],
  },
  {
    id: 'inspecciones_capacitaciones',
    label: 'Inspecciones, informes y capacitaciones',
    shortLabel: 'Inspecciones / Cap.',
    description: 'Inspecciones periódicas por sede, informes técnicos y ejecución de capacitaciones.',
    patterns: [
      /inspeccion/,
      /capacitacion/,
      /informes/,
    ],
  },
];

function matchThemes<T extends string>(text: string, rules: ThemeRule<T>[]): T[] {
  const norm = normalizeText(text);
  if (!norm) return [];
  return rules
    .filter((rule) => rule.patterns.some((pattern) => pattern.test(norm)))
    .map((rule) => rule.id);
}

/** Extracts improvement categories from an improvement comment if actionable. */
export function classifyImprovementThemes(comment: string): ImprovementThemeId[] {
  if (!isActionableImprovement(comment)) return [];
  return matchThemes(comment, IMPROVEMENT_THEME_RULES);
}

/** Extracts strength categories from a positive feedback comment. */
export function classifyStrengthThemes(comment: string): StrengthThemeId[] {
  if (!isMeaningfulComment(comment)) return [];
  return matchThemes(comment, STRENGTH_THEME_RULES);
}
