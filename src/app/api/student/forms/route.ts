import { NextRequest } from "next/server";

import { calculatePaginationMeta, successResponse, withErrorHandler } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limiter";
import { paginationSchema } from "@/schemas";
import { requireAuth } from "@/server/auth";
import { formService } from "@/services/form.service";

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    enforceRateLimit(`student-forms-list:${user.id}`);

    const searchParams = request.nextUrl.searchParams;
    const params = paginationSchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      sortBy: searchParams.get("sortBy"),
      sortOrder: searchParams.get("sortOrder"),
      search: searchParams.get("search"),
    });

    const { items, total } = await formService.listPublishedForms(params);
    return successResponse(
      items,
      "Published forms retrieved",
      calculatePaginationMeta(params.page, params.limit, total)
    );
  });
}
