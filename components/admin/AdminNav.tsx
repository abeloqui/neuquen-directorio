"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/admin", label: "Estadísticas" },
  { href: "/admin/reportes", label: "Reportes" },
  { href: "/admin/reportes/nuevo", label: "+ Nuevo" },
  { href: "/admin/ranking", label: "Ranking" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await createClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-3 py-2">
        {links.map((l) => {
          const active =
            l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href) && !(l.href === "/admin/reportes" && pathname === "/admin/reportes/nuevo");
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
                active
                  ? "bg-brand-600 text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={logout}
          className="ml-auto whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          Salir
        </button>
      </div>
    </div>
  );
}
