import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

const links = [
  { href: "/mapa", label: "Mapa" },
  { href: "/reportar", label: "Reportar" },
  { href: "/ranking", label: "Ranking" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-[1200] h-14 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-2 px-3">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="text-xl">📍</span>
          <span className="text-sm sm:text-base">
            Neuquén <span className="text-brand-600">Mejora</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {l.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
