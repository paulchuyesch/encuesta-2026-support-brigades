import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Encuesta de Satisfacción 2026 | Support Brigades',
  description:
    'Dashboard ejecutivo de análisis NPS, temáticas clave de SST y Salud Ocupacional, y seguimiento de clientes para Support Brigades.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={montserrat.variable}>
      <body className="min-h-screen bg-[#F4F7FB] text-slate-900">{children}</body>
    </html>
  );
}
