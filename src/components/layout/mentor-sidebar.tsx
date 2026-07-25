"use client";

import Link from "next/link";
import { FileText, LayoutDashboard, LogOut, Settings, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const navItems = [
  { href: "/dashboard", label: "Dasbor", icon: LayoutDashboard },
  { href: "/forms", label: "Formulir", icon: FileText },
  { href: "/students", label: "Data Santri", icon: Users },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

export function MentorSidebar() {
  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          TaskForm
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4" aria-label="Main navigation">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <item.icon className="h-4 w-4" aria-hidden="true" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t p-4 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          className="flex-1 justify-start gap-3 text-destructive hover:bg-destructive/10"
          onClick={() => signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/login"; } } })}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Keluar
        </Button>
        <ThemeToggle />
      </div>
    </aside>
  );
}
