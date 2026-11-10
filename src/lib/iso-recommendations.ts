import type {
  DashboardMetrics,
  ImprovementThemeId,
  IsoRecommendation,
  SurveyResponse,
} from './types';

interface ThemeIsoBlueprint {
  isoClause: string;
  isoPrinciple: string;
  title: string;
  actionTemplate: string;
  verificationKpi: string;
}

const IMPROVEMENT_ISO_BLUEPRINTS: Record<ImprovementThemeId, ThemeIsoBlueprint> = {
  seguimiento_orden: {
    isoClause: 'ISO 9001:2015 · 7.5 y 8.5.1',
    isoPrinciple: 'Información documentada y control de la provisión del servicio',
    title: 'Estandarizar control documental, actas y seguimiento de compromisos',
    actionTemplate:
      'Habilitar un repositorio digital único por cliente (enlace compartido) con matriz de entregables, archivo ordenado de documentos SGSST y envío sistemático de minutas e informes mensuales dentro de las 48 h posteriores a cada reunión.',
    verificationKpi:
      '100% de clientes con enlace documental activo y envío oportuno de actas/informes mensuales.',
  },
  salud_ocupacional_emos: {
    isoClause: 'ISO 9001:2015 · 8.5.1 y 8.5.2',
    isoPrinciple: 'Control operacional y trazabilidad en Salud Ocupacional',
    title: 'Establecer SLA de lectura de EMOs y entrega trazable de cargos',
    actionTemplate:
      'Definir acuerdos de nivel de servicio (SLA) para lectura médica de EMOs, emitir cargos firmados con trazabilidad de entrega al cliente y balancear la carga operativa de médicos ocupacionales y psicología.',
    verificationKpi:
      'Tiempo promedio de lectura de EMOs <= 72 h hábiles y 0 cargos pendientes de envío.',
  },
  rotacion_personal: {
    isoClause: 'ISO 9001:2015 · 7.1.2, 7.2 y 7.3',
    isoPrinciple: 'Recursos humanos, competencia, inducción y estabilidad del servicio',
    title: 'Reforzar filtro técnico, inducción y protocolo de relevo de especialistas',
    actionTemplate:
      'Aplicar evaluación técnica previa al ingreso (con énfasis en médicos ocupacionales y consultores SST), programa obligatorio de inducción en cultura de servicio y protocolo de empalme documentado de 7 días ante cualquier rotación.',
    verificationKpi:
      'Tasa de rotación de personal asignado a cuenta < 10% semestral y 100% de relevos con acta de transferencia.',
  },
  capacitaciones: {
    isoClause: 'ISO 9001:2015 · 7.2 y 8.5.1',
    isoPrinciple: 'Competencia de expositores y adecuación del servicio al cliente',
    title: 'Renovar capacitaciones con enfoque por rubro y evaluación didáctica',
    actionTemplate:
      'Segmentar el catálogo de capacitaciones por sector económico del cliente (ej. oficinas, restaurantes, logística/transporte), renovar casos prácticos para evitar repeticiones y evaluar el dinamismo de los ponentes en cada sesión.',
    verificationKpi:
      'Calificación de dinamismo y aplicabilidad >= 4.5/5 en encuestas de salida de capacitaciones.',
  },
  comunicacion_proactividad: {
    isoClause: 'ISO 9001:2015 · 8.2.1 y 6.1',
    isoPrinciple: 'Comunicación con el cliente y enfoque preventivo basado en riesgos',
    title: 'Instaurar comunicación proactiva, interdisciplinaria y preventiva',
    actionTemplate:
      'Comunicar proactivamente cambios de personal médico/SST o actualizaciones legales antes de que impacten al cliente, integrar a SST, Salud Ocupacional y Psicología en reuniones mensuales y reforzar estándares de trato amable.',
    verificationKpi:
      '100% de cambios en equipo o normativa notificados por escrito con >= 5 días de anticipación.',
  },
  tiempos_entrega: {
    isoClause: 'ISO 9001:2015 · 8.5.1 y 9.1.3',
    isoPrinciple: 'Cumplimiento de plazos y seguimiento del desempeño operacional',
    title: 'Monitorear tiempos de respuesta y cumplimiento de entregas programadas',
    actionTemplate:
      'Implementar alertas tempranas para solicitudes abiertas, definir tiempos máximos de respuesta por prioridad y revisar semanalmente el cumplimiento de cronogramas comprometidos.',
    verificationKpi:
      'Cumplimiento >= 95% de entregas e informes dentro del plazo acordado con cada cuenta.',
  },
  presencia_supervision: {
    isoClause: 'ISO 9001:2015 · 8.5.1 y 9.1.1',
    isoPrinciple: 'Supervisión en campo y verificación del cumplimiento',
    title: 'Asegurar presencia física planificada y supervisión técnica del staff',
    actionTemplate:
      'Acordar cronograma de visitas presenciales según nivel de riesgo de cada sede y ejecutar auditorías internas trimestrales de desempeño a los profesionales destacados en campo.',
    verificationKpi:
      '>= 90% de adherencia al plan de visitas presenciales y supervisiones técnicas.',
  },
};

function formatAffectedNames(
  items: SurveyResponse[],
  presentationMode: boolean,
  anonMap: Map<number, { displayCompany: string; displayRespondent: string }>,
): string {
  const labels = items.slice(0, 4).map((r) => {
    const name = presentationMode
      ? (anonMap.get(r.id)?.displayCompany ?? `Empresa #${r.id}`)
      : r.company;
    return `${name} (${r.score}/10)`;
  });
  const suffix = items.length > 4 ? ` y ${items.length - 4} más` : '';
  return `${labels.join(', ')}${suffix}`;
}

/**
 * Generates prioritized, evidence-backed recommendations aligned with ISO 9001:2015
 * from the active filtered survey responses and computed metrics.
 */
export function generateIsoRecommendations(
  responses: SurveyResponse[],
  metrics: DashboardMetrics,
  presentationMode: boolean,
  anonMap: Map<number, { displayCompany: string; displayRespondent: string }>,
): IsoRecommendation[] {
  if (responses.length === 0) return [];

  const recommendations: IsoRecommendation[] = [];

  // 1. Clause 10.2: Nonconformity & Corrective Action for Detractors
  const detractors = responses
    .filter((r) => r.segment === 'detractor')
    .sort((a, b) => a.score - b.score);

  if (detractors.length > 0) {
    recommendations.push({
      id: 'iso-10-2-detractores',
      priority: 'critica',
      isoClause: 'ISO 9001:2015 · 10.2 y 9.1.2',
      isoPrinciple: 'No conformidad, acción correctiva y recuperación de cliente',
      title: 'Activar protocolo de acción correctiva inmediata para cuentas detractoras',
      evidence: `${detractors.length} cuenta(s) en zona detractora (${metrics.detractorPct}% de la muestra): ${formatAffectedNames(detractors, presentationMode, anonMap)}.`,
      recommendedAction:
        'Abrir Solicitud de Acción Correctiva (SAC) por cada cuenta detractora: ejecutar contención con la gerencia del cliente en <= 48 h, análisis de causa raíz (5 Porqués) sobre rotación, orden y tiempos, y seguimiento quincenal de cierre.',
      verificationKpi:
        '100% de detractores contactados en <= 48 h y cierre verificado de acciones correctivas en <= 30 días.',
      affectedCount: detractors.length,
    });
  }

  // 2. Thematic gaps ordered by priority (frequency + low avg score)
  for (const stat of metrics.improvementThemeStats) {
    const blueprint = IMPROVEMENT_ISO_BLUEPRINTS[stat.id];
    const matching = responses.filter((r) => r.improvementThemes.includes(stat.id));
    const priority =
      stat.avgScore < 7.5 || stat.count >= 6
        ? 'alta'
        : 'media';

    recommendations.push({
      id: `iso-theme-${stat.id}`,
      priority,
      isoClause: blueprint.isoClause,
      isoPrinciple: blueprint.isoPrinciple,
      title: blueprint.title,
      evidence: `${stat.count} mención(es) (${stat.pct}% de comentarios accionables), promedio de ${stat.avgScore.toFixed(1)}/10 en: ${formatAffectedNames(matching, presentationMode, anonMap)}.`,
      recommendedAction: blueprint.actionTemplate,
      verificationKpi: blueprint.verificationKpi,
      affectedCount: stat.count,
      relatedThemeId: stat.id,
    });
  }

  // 3. Clause 9.1.2 / 9.3: Passive conversion opportunity
  const actionablePassives = responses.filter(
    (r) => r.segment === 'passive' && r.hasMeaningfulImprovement,
  );
  if (actionablePassives.length > 0) {
    recommendations.push({
      id: 'iso-9-3-conversion-pasivos',
      priority: 'media',
      isoClause: 'ISO 9001:2015 · 9.1.3 y 9.3',
      isoPrinciple: 'Análisis de datos y Revisión por la Dirección para elevar NPS',
      title: 'Plan de conversión de clientes pasivos (7–8) a promotores (9–10)',
      evidence: `${metrics.passives} respuesta(s) pasivas (${metrics.passivePct}%), de las cuales ${actionablePassives.length} detallaron mejoras concretas. Convertir la mitad elevaría el NPS proyectado significativamente.`,
      recommendedAction:
        'Priorizar reuniones trimestrales de valor con cuentas calificadas con 7 u 8 cerrando sus observaciones específicas (informes mensuales, acceso documental y capacitaciones dinámicas) antes de la siguiente medición.',
      verificationKpi:
        'Conversión >= 50% de cuentas pasivas a notas 9–10 en el siguiente ciclo de encuesta.',
      affectedCount: actionablePassives.length,
    });
  }

  // 4. Clause 10.3: Capitalize top strengths as internal standard
  const topStrength = metrics.strengthThemeStats[0];
  if (topStrength) {
    recommendations.push({
      id: 'iso-10-3-mejora-continua',
      priority: 'mantener',
      isoClause: 'ISO 9001:2015 · 10.3 y 7.1.6',
      isoPrinciple: 'Mejora continua y gestión del conocimiento organizacional',
      title: `Estandarizar fortaleza principal: ${topStrength.shortLabel}`,
      evidence: `${metrics.promoters} promotores (${metrics.promoterPct}%) y ${topStrength.count} menciones positivas destacan "${topStrength.label}" (NPS actual ${metrics.nps > 0 ? `+${metrics.nps}` : metrics.nps}).`,
      recommendedAction:
        'Documentar las prácticas de los gestores e ingenieras mejor valorados por los clientes (respuesta rápida, acompañamiento cercano y rigor normativo) como guía operativa estándar en el SIG para replicarlas de manera uniforme en todas las cuentas.',
      verificationKpi:
        'Mantener NPS >= +50 (Zona de Excelencia) y >= 90% de consistencia entre sedes y consultores.',
      affectedCount: topStrength.count,
      relatedThemeId: topStrength.id,
    });
  }

  return recommendations;
}

/** Formats generated ISO 9001:2015 recommendations into an editable executive draft. */
export function buildEditableRecommendationsDraft(
  recommendations: IsoRecommendation[],
  metrics: DashboardMetrics,
): string {
  if (recommendations.length === 0) return '';

  const npsText = metrics.nps > 0 ? `+${metrics.nps.toFixed(1)}` : metrics.nps.toFixed(1);
  const lines: string[] = [
    `DIAGNÓSTICO DE SATISFACCIÓN (ISO 9001:2015 · Cláusula 9.1.2)`,
    `Muestra analizada: ${metrics.total} respuestas (${metrics.uniqueCompanies} empresas) | NPS: ${npsText} | Promedio: ${metrics.averageScore.toFixed(2)}/10`,
    '',
    'RECOMENDACIONES PRIORITARIAS:',
  ];

  recommendations.forEach((rec, index) => {
    lines.push(
      `${index + 1}. [${rec.priority.toUpperCase()} · ${rec.isoClause}] ${rec.title}`,
      `   - Evidencia: ${rec.evidence}`,
      `   - Acción SIG: ${rec.recommendedAction}`,
      `   - Indicador de verificación: ${rec.verificationKpi}`,
      '',
    );
  });

  return lines.join('\n').trim();
}
