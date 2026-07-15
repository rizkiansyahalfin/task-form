export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "TaskForm";
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "http://localhost:3000");

export const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB ?? 10);
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ALLOWED_FILE_TYPES = (
  process.env.ALLOWED_FILE_TYPES ??
  "application/zip,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/jpg"
)
  .split(",")
  .map((t) => t.trim());

export const ALLOWED_FILE_EXTENSIONS = [".zip", ".pdf", ".docx", ".png", ".jpg", ".jpeg"];

export const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000);
export const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 100);

export const FIELD_TYPES = [
  "SHORT_TEXT",
  "PARAGRAPH",
  "NUMBER",
  "EMAIL",
  "PHONE",
  "URL",
  "DATE",
  "DROPDOWN",
  "RADIO",
  "CHECKBOX",
  "HEADING",
  "DIVIDER",
  "FILE_UPLOAD",
  "IMAGE_UPLOAD",
  "GITHUB_URL",
  "DEPLOY_URL",
  "TEXTAREA",
] as const;

export const FORM_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export const SUBMISSION_STATUSES = [
  "SUBMITTED",
  "REVIEWED",
  "REVISION",
  "COMPLETED",
  "LATE",
] as const;

export const MENTOR_ROUTES = [
  "/dashboard",
  "/forms",
  "/submissions",
  "/settings",
] as const;

export const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password", "/reset-password"] as const;

export const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"] as const;

export const API_ROUTES = {
  auth: "/api/auth",
  forms: "/api/forms",
  submissions: "/api/submissions",
  uploads: "/api/uploads",
  dashboard: "/api/dashboard",
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;
