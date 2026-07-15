import { NextRequest } from "next/server";

import { successResponse, withErrorHandler } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limiter";
import { updateFormSchema } from "@/schemas";
import { requireMentorAuth } from "@/server/auth";
import { formService } from "@/services/form.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(async () => {
    const user = await requireMentorAuth();
    const { id } = await params;
    enforceRateLimit(`forms-get:${user.id}`);

    const form = await formService.getForm(id, user.id);
    return successResponse(form, "Form retrieved");
  });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(async () => {
    const user = await requireMentorAuth();
    const { id } = await params;
    enforceRateLimit(`forms-update:${user.id}`);

    const body = await request.json();
    const data = updateFormSchema.parse(body);

    const form = await formService.updateForm(id, user.id, data);
    return successResponse(form, "Form updated");
  });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(async () => {
    const user = await requireMentorAuth();
    const { id } = await params;
    enforceRateLimit(`forms-delete:${user.id}`);

    await formService.deleteForm(id, user.id);
    return successResponse(null, "Form deleted");
  });
}
