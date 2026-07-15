import type { SubmissionStatus } from "@/generated/prisma/client";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { storage } from "@/lib/storage";
import { formRepository } from "@/repositories/form.repository";
import { submissionRepository } from "@/repositories/submission.repository";
import type { DashboardStats, PaginationParams, SubmitFormInput } from "@/types";
import { determineSubmissionStatus, isDeadlinePassed } from "@/utils";

export class SubmissionService {
  async getDashboardStats(mentorId: string): Promise<DashboardStats> {
    const [formCount, submissionCount, todaySubmissions, lateSubmissions, pendingReview] =
      await Promise.all([
        formRepository.countByMentor(mentorId),
        submissionRepository.countByMentor(mentorId),
        submissionRepository.countTodayByMentor(mentorId),
        submissionRepository.countLateByMentor(mentorId),
        submissionRepository.countPendingReviewByMentor(mentorId),
      ]);

    return {
      formCount,
      submissionCount,
      todaySubmissions,
      lateSubmissions,
      pendingReview,
    };
  }

  async listSubmissions(mentorId: string, params: PaginationParams & { formId?: string; status?: string }) {
    return submissionRepository.findMany(mentorId, params);
  }

  async getSubmission(id: string, mentorId: string) {
    const submission = await submissionRepository.findById(id, mentorId);
    if (!submission) {
      throw new NotFoundError("Submission not found");
    }

    const filesWithUrls = await Promise.all(
      submission.files.map(async (file) => ({
        ...file,
        url: await storage.getSignedDownloadUrl(file.fileKey),
      })),
    );

    return { ...submission, files: filesWithUrls };
  }

  async submitForm(
    slug: string,
    data: SubmitFormInput,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const form = await formRepository.findBySlug(slug);
    if (!form) {
      throw new NotFoundError("Form not found or not published");
    }

    if (form.deadline && isDeadlinePassed(form.deadline) && !form.allowLate) {
      throw new ValidationError("Submission deadline has passed");
    }

    if (form.maxSubmissions) {
      const count = await submissionRepository.countByForm(form.id);
      if (count >= form.maxSubmissions) {
        throw new ValidationError("Maximum submissions reached");
      }
    }

    if (form.collectEmail && !data.email) {
      throw new ValidationError("Email is required for this form");
    }

    const inputFieldIds = new Set(
      form.fields
        .filter((f) => !["HEADING", "DIVIDER"].includes(f.type))
        .map((f) => f.id),
    );

    for (const field of form.fields) {
      if (field.required && !["HEADING", "DIVIDER"].includes(field.type)) {
        const answer = data.answers.find((a) => a.fieldId === field.id);
        const file = data.files?.find((f) => f.fieldId === field.id);
        const hasValue =
          (answer?.value && answer.value.trim()) ||
          (answer?.values && answer.values.length > 0) ||
          file;
        if (!hasValue) {
          throw new ValidationError(`Field "${field.label}" is required`);
        }
      }
    }

    for (const answer of data.answers) {
      if (!inputFieldIds.has(answer.fieldId)) {
        throw new ValidationError(`Invalid field: ${answer.fieldId}`);
      }
    }

    const status = determineSubmissionStatus(form.deadline, form.allowLate);

    const submission = await submissionRepository.create(form.id, data, status, meta);

    if (data.files?.length) {
      const filesWithUrls = await Promise.all(
        submission.files.map(async (file) => ({
          ...file,
          url: storage.getPublicUrl(file.fileKey),
        })),
      );
      return { ...submission, files: filesWithUrls };
    }

    return submission;
  }

  async updateStatus(id: string, mentorId: string, status: SubmissionStatus) {
    const submission = await submissionRepository.findById(id, mentorId);
    if (!submission) {
      throw new NotFoundError("Submission not found");
    }
    return submissionRepository.updateStatus(id, status);
  }

  async deleteSubmission(id: string, mentorId: string) {
    const submission = await submissionRepository.findById(id, mentorId);
    if (!submission) {
      throw new NotFoundError("Submission not found");
    }
    return submissionRepository.softDelete(id);
  }
}

export const submissionService = new SubmissionService();
