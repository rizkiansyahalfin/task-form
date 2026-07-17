"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark") ? "dark" : "light";
    }
    return "light";
  });

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9 rounded-full hover:bg-accent hover:text-accent-foreground"
      title={theme === "light" ? "Aktifkan Mode Gelap" : "Aktifkan Mode Terang"}
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
      ) : (
        <Sun className="h-4 w-4 text-amber-400" />
      )}
    </Button>
  );
}
