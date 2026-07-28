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
      <head>
        {/* ESTA ES LA LÍNEA MÁGICA QUE FUERZA LOS COLORES Y EL DISEÑO */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
