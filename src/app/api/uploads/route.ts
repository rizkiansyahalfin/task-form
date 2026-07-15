import { NextRequest } from "next/server";

import { successResponse, withErrorHandler } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limiter";
import { uploadRequestSchema } from "@/schemas";
import { storage } from "@/lib/storage";

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    enforceRateLimit(`upload:${request.headers.get("x-forwarded-for") ?? "local"}`);

    const body = await request.json();
    const data = uploadRequestSchema.parse(body);

    const signedUrl = await storage.getSignedUploadUrl(
      data.fileName,
      data.mimeType,
      data.fileSize,
      data.folder,
    );

    return successResponse(signedUrl, "Upload URL generated");
  });
}
