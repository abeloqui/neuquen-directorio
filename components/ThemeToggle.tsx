"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Cambiar modo oscuro"
      title="Cambiar modo oscuro"
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-base hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
    >
      {mounted ? (isDark ? "☀️" : "🌙") : "🌓"}
    </button>
  );
}
