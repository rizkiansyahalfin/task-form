import { NextRequest } from "next/server";

import { successResponse, withErrorHandler } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limiter";
import { uploadRequestSchema } from "@/schemas";
import { storage } from "@/lib/storage";
import { requireAuth } from "@/server/auth";

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    enforceRateLimit(`upload:${user.id}`);

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
