import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 p-4 dark:bg-zinc-950">
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
