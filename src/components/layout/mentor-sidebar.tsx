"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOut, useSession } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { href: "/dashboard", label: "Dasbor", icon: LayoutDashboard },
  { href: "/forms", label: "Formulir", icon: FileText },
  { href: "/submissions", label: "Jawaban Masuk", icon: Inbox },
  { href: "/students", label: "Data Santri", icon: Users },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

interface MentorSidebarProps {
  onNavClick?: () => void;
}

export function MentorSidebar({ onNavClick }: MentorSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const user = session?.user;
  const userName = user?.name || "Mentor";
  const userEmail = user?.email || "";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-full w-full flex-col bg-card">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 font-bold tracking-tight text-foreground transition-opacity hover:opacity-90"
          onClick={onNavClick}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-sm shadow-xs">
            TF
          </div>
          <div className="flex flex-col">
            <span className="text-base leading-none font-bold">TaskForm</span>
            <span className="text-[10px] leading-tight font-medium text-muted-foreground mt-0.5">
              Portal Mentor
            </span>
          </div>
        </Link>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          v1.0
        </Badge>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto" aria-label="Navigasi Utama">
        <div className="px-3 pb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Menu utama
        </div>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              aria-current={isActive ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <item.icon
                className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground"
                }`}
                aria-hidden="true"
              />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <span className="ml-auto flex h-1.5 w-1.5 rounded-full bg-primary-foreground" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Footer Section */}
      <div className="border-t p-4 space-y-3 bg-muted/20">
        {/* Mentor Info Box */}
        <div className="flex items-center gap-3 rounded-lg border bg-card p-2.5 shadow-2xs">
          <Avatar size="sm">
            <AvatarImage src={user?.image || undefined} alt={userName} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col truncate min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold truncate text-foreground leading-none">
                {userName}
              </span>
              <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
            </div>
            {userEmail ? (
              <span className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                {userEmail}
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-primary/80 uppercase tracking-wide mt-0.5">
                Mentor
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start gap-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive h-9"
            onClick={() =>
              signOut({
                fetchOptions: {
                  onSuccess: () => {
                    window.location.href = "/login";
                  },
                },
              })
            }
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Keluar
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

