import { Suspense } from "react";
import { RegisterForm } from "@/features/auth/components/register-form";

export default function RegisterPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
      <Suspense fallback={<div className="text-sm text-muted-foreground animate-pulse">Memuat...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
