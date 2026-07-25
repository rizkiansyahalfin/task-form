import { NextRequest } from "next/server";
import { calculatePaginationMeta, successResponse, withErrorHandler } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limiter";
import { paginationSchema } from "@/schemas";
import { requireMentorAuth } from "@/server/auth";
import { studentService } from "@/services/student.service";

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireMentorAuth();
    enforceRateLimit(`students-list:${user.id}`);

    const searchParams = request.nextUrl.searchParams;
    const params = paginationSchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      sortBy: searchParams.get("sortBy"),
      sortOrder: searchParams.get("sortOrder"),
      search: searchParams.get("search"),
    });

    const statusParam = searchParams.get("status") as "active" | "inactive" | "all" | null;
    const status = ["active", "inactive", "all"].includes(statusParam || "")
      ? statusParam!
      : "all";

    const { items, total, stats } = await studentService.listStudents({
      ...params,
      status,
    });

    return successResponse(
      { students: items, stats },
      "Students retrieved successfully",
      calculatePaginationMeta(params.page, params.limit, total)
    );
  });
}
