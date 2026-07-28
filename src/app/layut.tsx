import './globals.css';

export const metadata = {
  title: 'Control de Nóminas - Natalia',
  description: 'Calculadora y control diario de nóminas profesional',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
