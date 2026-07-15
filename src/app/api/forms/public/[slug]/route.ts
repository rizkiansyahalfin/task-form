import { NextRequest } from "next/server";

import { successResponse, withErrorHandler } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limiter";
import { requireAuth } from "@/server/auth";
import { formService } from "@/services/form.service";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(async () => {
    const { slug } = await params;
    enforceRateLimit(`forms-public:${slug}`);

    const form = await formService.getPublicForm(slug);
    return successResponse(form, "Form retrieved");
  });
}
