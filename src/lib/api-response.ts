import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { logger } from "@/lib/logger";
import {
  AppError,
  getErrorCode,
  getErrorStatusCode,
  getSafeErrorMessage,
  isAppError,
} from "@/lib/errors";
import type { ApiResponse } from "@/types";

export function successResponse<T>(
  data: T,
  message = "Success",
  meta?: ApiResponse<T>["meta"],
  status = 200,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      meta,
    },
    { status },
  );
}

export function errorResponse(
  message: string,
  status = 500,
  code = "INTERNAL_ERROR",
  details?: Record<string, string[]>,
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      message,
      error: {
        code,
        details,
      },
    },
    { status },
  );
}

export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  if (error instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join(".");
      if (!details[path]) {
        details[path] = [];
      }
      details[path].push(issue.message);
    }
    return errorResponse("Validation failed", 400, "VALIDATION_ERROR", details);
  }

  if (isAppError(error)) {
    if (error.statusCode >= 500) {
      logger.error(error.message, { code: error.code, stack: error.stack });
    }
    return errorResponse(error.message, error.statusCode, error.code, error.details);
  }

  logger.error("Unhandled error", {
    message: error instanceof Error ? error.message : "Unknown error",
    stack: error instanceof Error ? error.stack : undefined,
  });

  return errorResponse(getSafeErrorMessage(error), getErrorStatusCode(error), getErrorCode(error));
}

export async function withErrorHandler<T>(
  handler: () => Promise<NextResponse<ApiResponse<T>>>,
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    return await handler();
  } catch (error) {
    return handleApiError(error) as NextResponse<ApiResponse<T>>;
  }
}

export function calculatePaginationMeta(
  page: number,
  limit: number,
  total: number,
): ApiResponse["meta"] {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}
