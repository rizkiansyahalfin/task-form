import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/features/auth/components/login-form";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function LoginPage() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 p-4 dark:bg-zinc-950">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Suspense fallback={<div className="text-sm text-muted-foreground animate-pulse">Memuat...</div>}>
        <LoginForm />
      </Suspense>
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
      >
        ← Kembali ke Beranda
      </Link>
    </div>
  );
}
