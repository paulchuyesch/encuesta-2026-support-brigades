'use client';

import Image from 'next/image';
import {
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Printer,
  RotateCcw,
} from 'lucide-react';

interface DashboardHeaderProps {
  sourceName: string;
  isCustomDataset: boolean;
  totalCount: number;
  dateRangeLabel: string;
  presentationMode: boolean;
  onTogglePresentationMode: () => void;
  onOpenUploadModal: () => void;
  onResetBaseline: () => void;
  onExportCsv: () => void;
  onPrint: () => void;
}

export function DashboardHeader({
  sourceName,
  isCustomDataset,
  totalCount,
  dateRangeLabel,
  presentationMode,
  onTogglePresentationMode,
  onOpenUploadModal,
  onResetBaseline,
  onExportCsv,
  onPrint,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex flex-wrap items-center gap-4">
          {/* Official logo with mandatory safety margin and unaltered proportions */}
          <div className="flex items-center px-2 py-1">
            <Image
              src="/logos/logo-color.png"
              alt="Support Brigades — Logotipo oficial"
              width={168}
              height={70}
              priority
              className="h-11 w-auto object-contain select-none sm:h-12"
            />
          </div>

          <div className="hidden h-9 w-px bg-slate-200 sm:block" aria-hidden="true" />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-[#0A2540] sm:text-lg">
                Satisfacción de Servicios
              </h1>
              <span className="inline-flex items-center rounded-full bg-[#EBF4FF] px-2.5 py-0.5 text-xs font-semibold text-[#0056B4] border border-[#BFD9FA]">
                {totalCount} respuestas
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs font-medium text-slate-600">
              {sourceName}
              {dateRangeLabel ? ` · ${dateRangeLabel}` : ''}
            </p>
          </div>
        </div>

        <div className="no-print flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenUploadModal}
            className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg bg-[#0056B4] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors duration-200 hover:bg-[#004494] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0056B4]"
          >
            <FileSpreadsheet className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Cargar CSV / Excel</span>
          </button>

          {isCustomDataset && (
            <button
              type="button"
              onClick={onResetBaseline}
              className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0056B4]"
              title="Volver a los datos precargados del CSV base"
            >
              <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Restaurar base</span>
            </button>
          )}

          <button
            type="button"
            onClick={onTogglePresentationMode}
            aria-pressed={presentationMode}
            className={`inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0056B4] ${
              presentationMode
                ? 'border-[#0056B4] bg-[#EBF4FF] text-[#003B7E]'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title="Oculta nombres de clientes y empresas para proyectar en reuniones"
          >
            {presentationMode ? (
              <EyeOff className="h-4 w-4 shrink-0 text-[#0056B4]" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4 shrink-0 text-slate-600" aria-hidden="true" />
            )}
            <span>{presentationMode ? 'Modo Presentación: ON' : 'Modo Presentación'}</span>
          </button>

          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0056B4]"
            title="Descargar vista actual filtrada en CSV"
          >
            <Download className="h-4 w-4 shrink-0 text-slate-600" aria-hidden="true" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          <button
            type="button"
            onClick={onPrint}
            className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0056B4]"
            title="Imprimir o guardar reporte ejecutivo como PDF"
          >
            <Printer className="h-4 w-4 shrink-0 text-slate-600" aria-hidden="true" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
}
