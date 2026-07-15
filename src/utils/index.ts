import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);

export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  return `${base}-${nanoid()}`;
}

export function isDeadlinePassed(deadline: Date | null): boolean {
  if (!deadline) return false;
  return new Date() > deadline;
}

export function determineSubmissionStatus(
  deadline: Date | null,
  allowLate: boolean,
): "SUBMITTED" | "LATE" {
  if (deadline && new Date() > deadline) {
    return allowLate ? "LATE" : "LATE";
  }
  return "SUBMITTED";
}

export function parsePaginationParams(searchParams: URLSearchParams) {
  return {
    page: Number(searchParams.get("page") ?? 1),
    limit: Math.min(Number(searchParams.get("limit") ?? 10), 100),
    sortBy: searchParams.get("sortBy") ?? "createdAt",
    sortOrder: (searchParams.get("sortOrder") ?? "desc") as "asc" | "desc",
    search: searchParams.get("search") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    formId: searchParams.get("formId") ?? undefined,
  };
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
