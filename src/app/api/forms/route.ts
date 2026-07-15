import { NextRequest } from "next/server";

import { calculatePaginationMeta, successResponse, withErrorHandler } from "@/lib/api-response";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limiter";
import { paginationSchema } from "@/schemas";
import { requireMentorAuth } from "@/server/auth";
import { formService } from "@/services/form.service";

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireMentorAuth();
    enforceRateLimit(`forms-list:${user.id}`);

    const searchParams = request.nextUrl.searchParams;
    const params = paginationSchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      sortBy: searchParams.get("sortBy"),
      sortOrder: searchParams.get("sortOrder"),
      search: searchParams.get("search"),
    });

    const { items, total } = await formService.listForms(user.id, params);
    return successResponse(items, "Forms retrieved", calculatePaginationMeta(params.page, params.limit, total));
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireMentorAuth();
    enforceRateLimit(`forms-create:${getClientIp(request)}`);

    const body = await request.json();
    const { createFormSchema } = await import("@/schemas");
    const data = createFormSchema.parse(body);

    const form = await formService.createForm(user.id, data);
    return successResponse(form, "Form created", undefined, 201);
  });
}
