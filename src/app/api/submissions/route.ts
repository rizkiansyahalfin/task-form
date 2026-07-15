import { NextRequest } from "next/server";

import { calculatePaginationMeta, successResponse, withErrorHandler } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limiter";
import { paginationSchema } from "@/schemas";
import { requireMentorAuth } from "@/server/auth";
import { submissionService } from "@/services/submission.service";

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireMentorAuth();
    enforceRateLimit(`submissions-list:${user.id}`);

    const searchParams = request.nextUrl.searchParams;
    const params = paginationSchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      sortBy: searchParams.get("sortBy"),
      sortOrder: searchParams.get("sortOrder"),
      search: searchParams.get("search"),
      status: searchParams.get("status"),
      formId: searchParams.get("formId"),
    });

    const { items, total } = await submissionService.listSubmissions(user.id, params);
    return successResponse(
      items,
      "Submissions retrieved",
      calculatePaginationMeta(params.page, params.limit, total),
    );
  });
}
