import { NextRequest } from "next/server";
import { successResponse, withErrorHandler } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limiter";
import { requireMentorAuth } from "@/server/auth";
import { studentService } from "@/services/student.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(async () => {
    const user = await requireMentorAuth();
    const { id } = await params;
    enforceRateLimit(`students-update-status:${user.id}`);

    const body = await request.json();
    const { active } = body as { active: boolean };

    if (typeof active !== "boolean") {
      throw new Error("active boolean property is required");
    }

    const updatedStudent = await studentService.updateStudentStatus(id, active);
    return successResponse(
      updatedStudent,
      `Student status updated to ${active ? "active" : "inactive"}`
    );
  });
}
