'use client';

import { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileSpreadsheet, UploadCloud, X } from 'lucide-react';
import { parseSurveyFile } from '@/lib/survey-parser';
import type { SurveyDataset } from '@/lib/types';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetLoaded: (dataset: SurveyDataset) => void;
}

export function FileUploadModal({
  isOpen,
  onClose,
  onDatasetLoaded,
}: FileUploadModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSelectedFile(file: File | undefined) {
    if (!file) return;
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const dataset = await parseSurveyFile(file);
      if (dataset.responses.length === 0) {
        throw new Error('No se encontraron respuestas válidas en el archivo.');
      }
      onDatasetLoaded(dataset);
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'No se pudo procesar el archivo seleccionado.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EBF4FF] text-[#0056B4]">
              <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="upload-modal-title" className="text-base font-bold text-[#0A2540]">
                Actualizar Encuesta desde Archivo
              </h2>
              <p className="text-xs font-medium text-slate-600">
                Procesamiento 100% local en tu navegador (no se sube a servidores)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-[#0056B4]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            void handleSelectedFile(e.dataTransfer.files?.[0]);
          }}
          className={`mt-5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-9 text-center transition-colors ${
            isDragging
              ? 'border-[#0056B4] bg-[#EBF4FF]'
              : 'border-slate-300 bg-slate-50/70 hover:border-[#0056B4]/60'
          }`}
        >
          <UploadCloud className="h-10 w-10 text-[#0056B4]" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-slate-800">
            Arrastra aquí tu archivo exportado de Microsoft Forms
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Compatible con <span className="font-semibold">.xlsx</span> (SharePoint/Excel) y{' '}
            <span className="font-semibold">.csv</span> (UTF-8 o ANSI de Excel)
          </p>

          <input
            ref={inputRef}
            id="survey-file-input"
            type="file"
            accept=".csv,.xlsx"
            className="sr-only"
            onChange={(e) => {
              void handleSelectedFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />

          <button
            type="button"
            disabled={isLoading}
            onClick={() => inputRef.current?.click()}
            className="mt-4 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg bg-[#0056B4] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#004494] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0056B4]"
          >
            {isLoading ? 'Analizando respuestas...' : 'Seleccionar archivo .CSV o .XLSX'}
          </button>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs font-medium text-amber-950"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="mt-4 rounded-xl bg-slate-50 p-3.5 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <span>Columnas detectadas automáticamente</span>
          </div>
          <p className="mt-1 leading-relaxed">
            Id, Hora de inicio/finalización, Nombres y Apellidos, Empresa, Cargo, puntaje NPS (0–10),
            cambios solicitados y fortalezas destacadas.
          </p>
        </div>
      </div>
    </div>
  );
}
