'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown, ClipboardCheck } from 'lucide-react';

interface CollapsibleSectionProps {
  id: string;
  ariaLabel: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
  itemCount: number;
  defaultExpanded?: boolean;
  children: ReactNode;
}

export function CollapsibleSection({
  id,
  ariaLabel,
  icon,
  title,
  subtitle,
  badge,
  itemCount,
  defaultExpanded = false,
  children,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <section
      aria-label={ariaLabel}
      className="rounded-2xl border border-slate-200 bg-white shadow-xs"
    >
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        aria-controls={id}
        className="flex w-full cursor-pointer flex-col gap-3 rounded-2xl p-5 text-left transition-colors hover:bg-slate-50/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0056B4] sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {icon}
            <h2 className="text-base font-extrabold text-[#0A2540]">{title}</h2>
            {badge && (
              <span className="rounded-full border border-[#BFD9FA] bg-[#EBF4FF] px-2.5 py-0.5 text-[11px] font-bold text-[#003B7E]">
                {badge}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-600">{subtitle}</p>
        </div>

        <span className="no-print inline-flex min-h-9 shrink-0 items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-[#0056B4] tabular-nums sm:self-center">
          <ClipboardCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{isExpanded ? 'Ocultar' : `Desplegar (${itemCount})`}</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </span>
      </button>

      <div
        id={id}
        className={`${isExpanded ? 'block' : 'hidden print:block'} border-t border-slate-100 p-5`}
      >
        {children}
      </div>
    </section>
  );
}
