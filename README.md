# Dashboard de Satisfacción de Servicios · Support Brigades

Dashboard ejecutivo en **Next.js (App Router)**, **TypeScript**, **Tailwind CSS** y **Recharts** para analizar la encuesta de satisfacción (NPS) de **Support Brigades**, aplicando los lineamientos oficiales del manual de identidad `SB-GCO-MC-MA-001`.

## Funcionalidades principales

- **Carga precargada + actualización instantánea en navegador**: Inicia con los 39 registros de la encuesta base y permite arrastrar nuevos archivos `.xlsx` (Microsoft Forms / SharePoint) o `.csv` (UTF-8 o Windows-1252) sin requerir base de datos.
- **Métricas NPS y análisis temporal**: Cálculo automático de Net Promoter Score, promedio, mediana, tasa de feedback accionable y evolución mensual.
- **Taxonomía temática SST & Salud Ocupacional**: Clasificación automática de brechas de mejora (*Seguimiento y Docs*, *Salud Ocup. / EMOs*, *Rotación y Staff*, *Capacitaciones*, *Comunicación*, *Tiempos*, *Presencia y Supervisión*) y fortalezas con filtrado cruzado al hacer clic.
- **Control de calidad muestral**: Detección e interruptor para excluir registros internos (*Support Brigades*) y aviso de contactos que responden por múltiples razones sociales.
- **Modo Presentación**: Oculta nombres de clientes y empresas con un clic para proyectar en comités o gerencia.
- **Exportación**: Descarga de la vista filtrada en CSV y estilos limpios para impresión/PDF.

## Desarrollo local

```bash
npm install
npm run dev
```

Pruebas y compilación de producción:

```bash
npm test
npm run build
```

## Despliegue rápido en Vercel

1. Sube este repositorio a GitHub (`origin`: `https://github.com/paulchuyesch/encuesta-2026-support-brigades.git`).
2. Entra a [vercel.com/new](https://vercel.com/new), importa el repositorio `encuesta-2026-support-brigades` y haz clic en **Deploy** (Next.js se configura automáticamente sin variables de entorno ni base de datos).
3. También puedes desplegar desde la terminal con `npx vercel --prod`.
