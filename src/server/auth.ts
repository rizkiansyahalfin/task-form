import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";
import type { AuthUser } from "@/types";

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function requireAuth(): Promise<AuthUser> {
  const session = await getSession();
  if (!session?.user) {
    throw new UnauthorizedError("Authentication required");
  }
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image ?? null,
    role: (session.user as { role?: string }).role ?? "mentor",
  };
}

export async function requireMentorAuth(): Promise<AuthUser> {
  const user = await requireAuth();
  const { ForbiddenError } = await import("@/lib/errors");
  if (user.role !== "mentor") {
    throw new ForbiddenError("Access denied: Mentors only");
  }
  return user;
}
