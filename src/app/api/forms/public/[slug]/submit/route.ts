import { NextRequest } from "next/server";

import { successResponse, withErrorHandler } from "@/lib/api-response";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limiter";
import { submitFormSchema } from "@/schemas";
import { submissionService } from "@/services/submission.service";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(async () => {
    const { slug } = await params;
    const ip = getClientIp(request);
    enforceRateLimit(`submit:${ip}:${slug}`);

    const body = await request.json();
    const data = submitFormSchema.parse(body);

    const { getSession } = await import("@/server/auth");
    const session = await getSession();
    if (session?.user?.email) {
      data.email = session.user.email.trim().toLowerCase();
    } else if (data.email) {
      data.email = data.email.trim().toLowerCase();
    }

    const submission = await submissionService.submitForm(slug, data, {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return successResponse(submission, "Submission received", undefined, 201);
  });
}
