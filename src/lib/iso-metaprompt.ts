import type {
  DashboardMetrics,
  IsoRecommendation,
  MetaPromptFocus,
  SurveyResponse,
} from './types';

interface BuildMetaPromptOptions {
  sourceName: string;
  responses: SurveyResponse[];
  metrics: DashboardMetrics;
  recommendations: IsoRecommendation[];
  presentationMode: boolean;
  anonMap: Map<number, { displayCompany: string; displayRespondent: string }>;
  focus: MetaPromptFocus;
  customContext?: string;
}

const FOCUS_INSTRUCTIONS: Record<
  MetaPromptFocus,
  { title: string; deliverable: string; clauses: string }
> = {
  ejecutivo: {
    title: 'Informe Ejecutivo de Satisfacción del Cliente y Plan de Mejora ISO 9001:2015',
    deliverable:
      'Redacta un Informe Ejecutivo listo para Gerencia General y Jefatura Comercial/SIG con: (1) Resumen Ejecutivo y lectura del NPS, (2) Análisis de causas raíz por brecha temática, (3) Tabla de Plan de Acción con Cláusula ISO 9001:2015, responsable sugerido, plazo y KPI de eficacia, y (4) Estrategia para capitalizar fortalezas.',
    clauses:
      '9.1.2 (Satisfacción del cliente), 9.1.3 (Análisis y evaluación), 10.2 (No conformidad y acción correctiva), 7.2 (Competencia), 7.5 (Información documentada), 8.2.1 (Comunicación con el cliente), 8.5.1 (Control operacional) y 10.3 (Mejora continua).',
  },
  revision_direccion: {
    title: 'Insumo Formal para Revisión por la Dirección (Cláusula 9.3)',
    deliverable:
      'Estructura el documento como entrada formal de Revisión por la Dirección bajo ISO 9001:2015 (9.3.2 c: retroalimentación de clientes, desempeño de procesos y adecuación de recursos), incluyendo riesgos/oportunidades (6.1), necesidades de recursos/personal (7.1.2) y salidas con decisiones requeridas de la Alta Dirección (9.3.3).',
    clauses:
      '9.3.2 (Entradas de revisión por la dirección), 9.3.3 (Salidas), 6.1 (Riesgos y oportunidades), 7.1.2 (Personas), 9.1.2 (Satisfacción del cliente) y 10.3 (Mejora continua).',
  },
  acciones_correctivas: {
    title: 'Matriz de No Conformidades y Acciones Correctivas (Cláusula 10.2)',
    deliverable:
      'Genera una Matriz SAC (Solicitud de Acción Correctiva) enfocada en detractores (0–6) y pasivos críticos (7–8): para cada hallazgo define Descripción de la No Conformidad, Corrección inmediata (contención), Análisis de Causa Raíz (5 Porqués), Acción Correctiva sistémica, Responsable, Plazo y Método de Verificación de Eficacia.',
    clauses:
      '10.2.1 (Reacción, evaluación y causa raíz), 10.2.2 (Información documentada de no conformidades), 8.5.1 (Control del servicio), 7.2 (Competencia) y 8.2.1 (Comunicación con el cliente).',
  },
};

function sanitizeLabel(
  item: SurveyResponse,
  presentationMode: boolean,
  anonMap: Map<number, { displayCompany: string; displayRespondent: string }>,
): string {
  if (!presentationMode) {
    return `${item.company} (${item.role})`;
  }
  const anon = anonMap.get(item.id);
  return `${anon?.displayCompany ?? `Empresa #${item.id}`} (${item.role})`;
}

/**
 * Programmatically builds a specialist ISO 9001:2015 meta-prompt populated with
 * live quantitative metrics, thematic findings, and verified qualitative evidence.
 */
export function buildIso9001MetaPrompt({
  sourceName,
  responses,
  metrics,
  recommendations,
  presentationMode,
  anonMap,
  focus,
  customContext = '',
}: BuildMetaPromptOptions): string {
  const focusSpec = FOCUS_INSTRUCTIONS[focus];
  const npsFormatted = metrics.nps > 0 ? `+${metrics.nps.toFixed(1)}` : metrics.nps.toFixed(1);

  const internalCount = responses.filter((r) => r.isInternal).length;
  const multiCompanyIds = responses
    .filter((r) => r.multiCompanyGroup !== null)
    .map((r) => `#${r.id}`);

  const monthlyLines = metrics.monthlyTrend
    .map(
      (m) =>
        `  - ${m.monthLabel}: ${m.count} respuestas | Promedio ${m.averageScore.toFixed(2)}/10 | NPS ${m.nps > 0 ? `+${m.nps.toFixed(1)}` : m.nps.toFixed(1)} (${m.promoters} Prom, ${m.passives} Pas, ${m.detractors} Det)`,
    )
    .join('\n');

  const improvementLines =
    metrics.improvementThemeStats.length > 0
      ? metrics.improvementThemeStats
          .map(
            (t) =>
              `  - ${t.label}: ${t.count} menciones (${t.pct}% de comentarios accionables), nota promedio ${t.avgScore.toFixed(2)}/10`,
          )
          .join('\n')
      : '  - Sin brechas temáticas registradas en este filtro.';

  const strengthLines =
    metrics.strengthThemeStats.length > 0
      ? metrics.strengthThemeStats
          .map(
            (t) =>
              `  - ${t.label}: ${t.count} menciones (${t.pct}% de fortalezas descritas), nota promedio ${t.avgScore.toFixed(2)}/10`,
          )
          .join('\n')
      : '  - Sin menciones positivas registradas en este filtro.';

  const priorityCases = responses
    .filter((r) => r.segment === 'detractor' || (r.segment === 'passive' && r.hasMeaningfulImprovement))
    .sort((a, b) => a.score - b.score || a.id - b.id)
    .slice(0, 12)
    .map((r) => {
      const label = sanitizeLabel(r, presentationMode, anonMap);
      const cleanImprovement = r.improvementComment.replace(/\s+/g, ' ').trim();
      const cleanStrength = r.hasMeaningfulStrength
        ? r.strengthComment.replace(/\s+/g, ' ').trim()
        : 'Sin detalle';
      return `  - [ID #${r.id} | Nota ${r.score}/10 | ${r.segment.toUpperCase()}] ${label}\n    · Mejora solicitada: "${cleanImprovement}"\n    · Fortaleza percibida: "${cleanStrength}"`;
    })
    .join('\n');

  const baseSignals = recommendations
    .map((rec) => `  - [${rec.priority.toUpperCase()}] (${rec.isoClause}) ${rec.title}`)
    .join('\n');

  const contextNotes = [
    internalCount > 0
      ? `- Incluye ${internalCount} registro(s) interno(s) de la propia empresa.`
      : '- Muestra depurada (sin registros internos).',
    multiCompanyIds.length > 0
      ? `- Atención metodológica: los registros ${multiCompanyIds.join(', ')} provienen de un mismo contacto corporativo evaluando distintas razones sociales.`
      : null,
    customContext.trim() ? `- Contexto adicional del equipo: ${customContext.trim()}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return `# META-PROMPT ESPECIALISTA ISO 9001:2015 & SIG (SST / SALUD OCUPACIONAL)
# Entregable objetivo: ${focusSpec.title}

## 1. ROL Y COMPETENCIA
Actúa como Auditor Líder certificado en **ISO 9001:2015** y Especialista Senior en Sistemas Integrados de Gestión (SIG) para empresas consultoras B2B de **Seguridad y Salud en el Trabajo (SST)**, **Salud Ocupacional (EMOs, vigilancia médica, psicología ocupacional)**, inspecciones y capacitaciones normativas. Tu criterio combina rigor normativo ISO 9001:2015 con pragmatismo comercial y retención de cuentas B2B.

## 2. CONTEXTO DE LA ORGANIZACIÓN Y FUENTE
- Organización evaluada: **Support Brigades** (servicios B2B de SST y Salud Ocupacional).
- Conjunto de datos activo: \`${sourceName}\`${presentationMode ? ' (identidades anonimizadas en Modo Presentación)' : ''}.
- Notas de calidad muestral:
${contextNotes}

## 3. RESULTADOS CUANTITATIVOS OBSERVADOS
- Total respuestas: **${metrics.total}** (${metrics.uniqueCompanies} empresas únicas)
- Net Promoter Score (NPS): **${npsFormatted}**
  - Promotores (9–10): ${metrics.promoters} (${metrics.promoterPct}%)
  - Pasivos (7–8): ${metrics.passives} (${metrics.passivePct}%)
  - Detractores (0–6): ${metrics.detractors} (${metrics.detractorPct}%)
- Calificación promedio: **${metrics.averageScore.toFixed(2)} / 10** (Mediana: ${metrics.medianScore})
- Comentarios de mejora accionables: **${metrics.actionableImprovementCount}** (${metrics.actionableImprovementRate}%)
- Evolución mensual:
${monthlyLines || '  - Sin desglose mensual disponible.'}

## 4. ANÁLISIS TEMÁTICO DE VOZ DEL CLIENTE (VOC)
### Brechas de mejora detectadas:
${improvementLines}

### Fortalezas más valoradas:
${strengthLines}

### Evidencia textual de cuentas críticas (Detractores y Pasivos accionables):
${priorityCases || '  - No existen casos detractores ni pasivos con observaciones en el filtro actual.'}

### Señales normativas pre-identificadas por el dashboard:
${baseSignals || '  - Sin alertas adicionales.'}

## 5. MARCO NORMATIVO OBLIGATORIO (ISO 9001:2015)
Fundamenta TODAS tus recomendaciones en las cláusulas aplicables de **ISO 9001:2015**:
${focusSpec.clauses}

## 6. TAREA Y FORMATO DE SALIDA
${focusSpec.deliverable}

## 7. REGLAS DE RIGOR Y CALIDAD (ESTRICTAS)
1. **Cero alucinaciones**: cita únicamente cifras, frecuencias y hallazgos contenidos en la Sección 3 y 4. Si falta un dato (p. ej. presupuesto o SLA interno actual), decláralo como "Por definir con el responsable SIG".
2. **Trazabilidad causa-cláusula**: cada recomendación debe conectar **Evidencia real → Causa raíz probable → Cláusula ISO 9001:2015 → Acción concreta (qué, quién, cuándo) → Indicador de eficacia (KPI)**.
3. **Diferencia corrección vs acción correctiva** (Cláusula 10.2): indica qué se hace para contener de inmediato al cliente afectado y qué cambio de proceso evita que el problema se repita en otras cuentas.
4. **Enfoque en conversión de Pasivos**: incluye acciones rápidas ("quick wins" < 30 días) para mover las cuentas de puntaje 7–8 hacia 9–10 sin descuidar los casos críticos (0–6).
5. **Tono**: ejecutivo, claro, directo y accionable en español.`;
}
