"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";

import { MentorSidebar } from "@/components/layout/mentor-sidebar";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function MentorLayout({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!session) {
    // If not authenticated, redirect to login
    if (typeof window !== "undefined") {
      router.push("/login");
    }
    return null;
  }

  // If user role is not mentor, deny access and show Forbidden page
  if ((session.user as { role?: string }).role !== "mentor") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 text-center dark:bg-zinc-950">
        <div className="max-w-md space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-destructive/10 p-4 text-destructive">
              <ShieldAlert className="h-12 w-12" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Akses Ditolak</h1>
            <p className="text-muted-foreground">
              Anda tidak memiliki izin untuk mengakses dasbor mentor. Area ini khusus untuk mentor saja.
            </p>
          </div>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              Kembali
            </Button>
            <Button
              onClick={() => {
                // Sign out client-side
                import("@/lib/auth-client").then(({ signOut }) => {
                  signOut({
                    fetchOptions: {
                      onSuccess: () => {
                        window.location.href = "/login";
                      },
                    },
                  });
                });
              }}
            >
              Keluar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <MentorSidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto max-w-6xl p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
