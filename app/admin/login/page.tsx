import type { Metadata } from "next";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Acceso administrador",
  robots: { index: false, follow: false },
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-1 text-2xl font-bold">Acceso administrador</h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        Solo para la persona que administra Neuquén Mejora.
      </p>
      <LoginForm initialError={searchParams.error} />
    </div>
  );
}
