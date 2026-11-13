import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import Header from "@/components/Header";
import ThemeProvider from "@/components/ThemeProvider";
import { siteUrl } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Neuquén Mejora | Reportes ciudadanos de Neuquén Capital",
    template: "%s | Neuquén Mejora",
  },
  description:
    "Mapa colaborativo para reportar problemas de infraestructura e inseguridad en Neuquén Capital. Cada reporte se revisa antes de publicarse.",
  keywords: [
    "Neuquén",
    "reportes ciudadanos",
    "baches",
    "luminarias",
    "seguridad",
    "barrios de Neuquén",
  ],
  openGraph: {
    title: "Neuquén Mejora",
    description:
      "Reportá problemas de tu barrio en el mapa. Revisados antes de publicarse.",
    type: "website",
    locale: "es_AR",
    siteName: "Neuquén Mejora",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-AR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <Header />
          <main>{children}</main>
          <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
            <p>Neuquén Mejora · Proyecto ciudadano independiente · Datos de mapa © OpenStreetMap</p>
            <p className="mt-1">
              <Link href="/admin" className="hover:underline">
                Acceso administrador
              </Link>
            </p>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
