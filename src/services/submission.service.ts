import prisma from "@/lib/prisma";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { storage } from "@/lib/storage";
import { formRepository } from "@/repositories/form.repository";
import { submissionRepository } from "@/repositories/submission.repository";
import type { DashboardStats, PaginationParams, SubmitFormInput, SubmissionStatus } from "@/types";
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
      submission.files.map(async (file: any) => ({
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
        .filter((f: any) => !["HEADING", "DIVIDER"].includes(f.type))
        .map((f: any) => f.id),
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
        submission.files.map(async (file: any) => ({
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

  async getStudentSubmission(email: string, query: { formId?: string; slug?: string }) {
    if (!query.formId && !query.slug) {
      throw new ValidationError("formId or slug is required");
    }

    const whereClause: any = {
      email,
      deletedAt: null,
    };

    if (query.formId) {
      whereClause.formId = query.formId;
    } else if (query.slug) {
      whereClause.form = { slug: query.slug, deletedAt: null };
    }

    const submission = await prisma.submission.findFirst({
      where: whereClause,
      include: {
        answers: {
          include: {
            field: {
              select: { label: true, type: true },
            },
          },
        },
        files: true,
        form: {
          select: { title: true, slug: true },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    if (!submission) {
      return null;
    }

    const filesWithUrls = await Promise.all(
      submission.files.map(async (file: any) => ({
        ...file,
        url: await storage.getSignedDownloadUrl(file.fileKey),
      })),
    );

    return { ...submission, files: filesWithUrls };
  }

  async updateStudentSubmission(
    id: string,
    email: string,
    data: SubmitFormInput,
  ) {
    const submission = await prisma.submission.findFirst({
      where: {
        id,
        email,
        deletedAt: null,
      },
      include: {
        form: true,
      },
    });

    if (!submission) {
      throw new NotFoundError("Submission not found");
    }

    const { form } = submission;

    // Check if editing is allowed
    // Allowed if: form.allowEdit is true OR the current submission status is "REVISION"
    const canEdit = form.allowEdit || submission.status === "REVISION";
    if (!canEdit) {
      throw new ValidationError("Form ini tidak mengizinkan pengeditan jawaban");
    }

    // Check deadline constraints
    if (form.deadline && isDeadlinePassed(form.deadline) && !form.allowLate) {
      throw new ValidationError("Submission deadline has passed and late updates are not allowed");
    }

    // Validate required fields
    // Let's get the full form details.
    const fullForm = await formRepository.findById(form.id);
    if (!fullForm) {
      throw new NotFoundError("Form definition not found");
    }

    const fullInputFieldIds = new Set(
      fullForm.fields
        .filter((f: any) => !["HEADING", "DIVIDER"].includes(f.type))
        .map((f: any) => f.id)
    );

    for (const field of fullForm.fields) {
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
      if (!fullInputFieldIds.has(answer.fieldId)) {
        throw new ValidationError(`Invalid field: ${answer.fieldId}`);
      }
    }

    const status = determineSubmissionStatus(fullForm.deadline, fullForm.allowLate);

    // Run update in transaction
    const updatedSubmission = await prisma.$transaction(async (tx: any) => {
      // delete existing answers
      await tx.submissionAnswer.deleteMany({ where: { submissionId: id } });
      // create new answers
      if (data.answers.length > 0) {
        await tx.submissionAnswer.createMany({
          data: data.answers.map((answer) => ({
            submissionId: id,
            fieldId: answer.fieldId,
            value: answer.value,
            values: answer.values ?? [],
          })),
        });
      }

      // delete existing files
      await tx.submissionFile.deleteMany({ where: { submissionId: id } });
      // create new files
      if (data.files && data.files.length > 0) {
        await tx.submissionFile.createMany({
          data: data.files.map((file) => ({
            submissionId: id,
            fieldId: file.fieldId,
            fileName: file.fileName,
            fileKey: file.fileKey,
            mimeType: file.mimeType,
            fileSize: file.fileSize,
          })),
        });
      }

      return tx.submission.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date(),
        },
        include: {
          answers: {
            include: {
              field: {
                select: { label: true, type: true },
              },
            },
          },
          files: true,
          form: {
            select: { title: true, slug: true },
          },
        },
      });
    });

    const filesWithUrls = await Promise.all(
      updatedSubmission.files.map(async (file: any) => ({
        ...file,
        url: await storage.getSignedDownloadUrl(file.fileKey),
      })),
    );

    return { ...updatedSubmission, files: filesWithUrls };
  }
}

export const submissionService = new SubmissionService();
