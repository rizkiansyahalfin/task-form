import { NextRequest } from "next/server";

import prisma from "@/lib/prisma";
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

    // Fetch submissions for this student and these forms
    const formIds = items.map((f) => f.id);
    const normalizedUserEmail = user.email.trim().toLowerCase();
    const submissions = formIds.length > 0 ? await prisma.submission.findMany({
      where: {
        formId: { in: formIds },
        email: { equals: normalizedUserEmail, mode: "insensitive" },
        deletedAt: null,
      },
      select: {
        id: true,
        formId: true,
        status: true,
        submittedAt: true,
      },
      orderBy: {
        submittedAt: "desc",
      },
    }) : [];

    // Map formId to latest submission
    const submissionMap = new Map<string, typeof submissions[0]>();
    for (const sub of submissions) {
      if (!submissionMap.has(sub.formId)) {
        submissionMap.set(sub.formId, sub);
      }
    }

    // Enrich forms
    const enrichedItems = items.map((form) => {
      const sub = submissionMap.get(form.id);
      return {
        ...form,
        hasSubmitted: !!sub,
        submissionStatus: sub?.status ?? null,
        submittedAt: sub?.submittedAt ?? null,
        submissionId: sub?.id ?? null,
      };
    });

    return successResponse(
      enrichedItems,
      "Published forms retrieved",
      calculatePaginationMeta(params.page, params.limit, total)
    );
  });
}
