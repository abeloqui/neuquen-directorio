import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";

export const revalidate = 60;

const steps = [
  {
    icon: "📝",
    title: "1. Reportá",
    text: "Marcá el lugar en el mapa, contá qué pasa y, si podés, sumá una foto. No hace falta registrarte.",
  },
  {
    icon: "🔎",
    title: "2. Revisamos",
    text: "Todo reporte queda como “Pendiente”. Una persona administradora lo revisa antes de que sea público.",
  },
  {
    icon: "🗺️",
    title: "3. Se publica",
    text: "Los reportes aprobados aparecen en el mapa y alimentan el ranking transparente de barrios.",
  },
  {
    icon: "✅",
    title: "4. Seguimiento",
    text: "Cada reporte pasa por estados (aprobado, en proceso, resuelto) para que todos vean si se soluciona.",
  },
];

export default async function HomePage() {
  const supabase = createPublicClient();
  const [all, resolved] = await Promise.all([
    supabase.from("public_reports").select("id", { count: "exact", head: true }),
    supabase
      .from("public_reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "resolved"),
  ]);

  const total = all.count ?? 0;
  const solved = resolved.count ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
          Tu barrio, <span className="text-brand-600">a la vista</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600 dark:text-gray-400 sm:text-lg">
          Plataforma ciudadana para reportar problemas de infraestructura e
          inseguridad en Neuquén Capital. Cualquier vecino puede reportar; cada
          reporte se revisa antes de publicarse.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/reportar" className="btn btn-primary w-full sm:w-auto">
            📍 Hacer un reporte
          </Link>
          <Link href="/mapa" className="btn btn-secondary w-full sm:w-auto">
            🗺️ Ver el mapa
          </Link>
        </div>
      </section>

      <section className="mt-10 grid grid-cols-2 gap-3 sm:mx-auto sm:max-w-md">
        <div className="card text-center">
          <p className="text-3xl font-bold text-brand-600">{total}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">reportes publicados</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">{solved}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">resueltos</p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-center text-2xl font-bold">¿Cómo funciona?</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.title} className="card">
              <div className="text-3xl">{s.icon}</div>
              <h3 className="mt-2 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        <div className="card">
          <h3 className="font-semibold">🔧 Infraestructura</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Baches, luminarias apagadas, basurales, pérdidas de agua, semáforos
            y espacios públicos deteriorados.
          </p>
        </div>
        <div className="card">
          <h3 className="font-semibold">🚨 Seguridad</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Robos, vandalismo, zonas peligrosas y conducción riesgosa. Para
            emergencias llamá al 911.
          </p>
        </div>
      </section>

      <section className="card mt-12 text-center">
        <h2 className="text-xl font-bold">Ranking transparente de barrios</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600 dark:text-gray-400">
          El puntaje de cada barrio se calcula con una fórmula pública basada
          solo en reportes aprobados.
        </p>
        <Link href="/ranking" className="btn btn-secondary mt-4">
          🏆 Ver ranking
        </Link>
      </section>

      <p className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
        Este sitio es una iniciativa ciudadana y no es un canal oficial del
        municipio. Los datos de contacto que dejes en un reporte solo los ve el
        administrador.
      </p>
    </div>
  );
}
