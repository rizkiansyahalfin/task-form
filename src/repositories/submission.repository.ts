import type { Prisma, SubmissionStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { PaginationParams, SubmitFormInput } from "@/types";

const submissionInclude = {
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
};

export class SubmissionRepository {
  async findById(id: string, mentorId?: string) {
    return prisma.submission.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(mentorId
          ? { form: { mentorId, deletedAt: null } }
          : {}),
      },
      include: submissionInclude,
    });
  }

  async findMany(mentorId: string, params: PaginationParams & { formId?: string; status?: string }) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "submittedAt",
      sortOrder = "desc",
      formId,
      status,
    } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.SubmissionWhereInput = {
      deletedAt: null,
      form: { mentorId, deletedAt: null },
      ...(formId ? { formId } : {}),
      ...(status ? { status: status as SubmissionStatus } : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { form: { title: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: submissionInclude,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.submission.count({ where }),
    ]);

    return { items, total };
  }

  async create(
    formId: string,
    data: SubmitFormInput,
    status: SubmissionStatus,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    return prisma.submission.create({
      data: {
        formId,
        status,
        email: data.email,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        answers: {
          create: data.answers.map((answer) => ({
            fieldId: answer.fieldId,
            value: answer.value,
            values: answer.values ?? [],
          })),
        },
        files: data.files?.length
          ? {
              create: data.files.map((file) => ({
                fieldId: file.fieldId,
                fileName: file.fileName,
                fileKey: file.fileKey,
                mimeType: file.mimeType,
                fileSize: file.fileSize,
                url: null,
              })),
            }
          : undefined,
      },
      include: submissionInclude,
    });
  }

  async updateStatus(id: string, status: SubmissionStatus) {
    return prisma.submission.update({
      where: { id },
      data: { status },
      include: submissionInclude,
    });
  }

  async bulkUpdateStatus(ids: string[], mentorId: string, status: SubmissionStatus) {
    return prisma.submission.updateMany({
      where: {
        id: { in: ids },
        form: { mentorId, deletedAt: null },
        deletedAt: null,
      },
      data: { status },
    });
  }

  async bulkSoftDelete(ids: string[], mentorId: string) {
    return prisma.submission.updateMany({
      where: {
        id: { in: ids },
        form: { mentorId, deletedAt: null },
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });
  }

  async updateAnswerFeedback(answerId: string, feedback: string) {
    return prisma.submissionAnswer.update({
      where: { id: answerId },
      data: { feedback } as Prisma.SubmissionAnswerUncheckedUpdateInput,
    });
  }

  async updateSubmissionAnswersFeedback(submissionId: string, feedbackMap: Record<string, string>) {
    const updatePromises = Object.entries(feedbackMap).map(([answerId, feedback]) =>
      prisma.submissionAnswer.updateMany({
        where: {
          id: answerId,
          submissionId,
        },
        data: { feedback } as Prisma.SubmissionAnswerUncheckedUpdateManyInput,
      })
    );
    return Promise.all(updatePromises);
  }

  async softDelete(id: string) {
    return prisma.submission.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async countByMentor(mentorId: string) {
    return prisma.submission.count({
      where: { form: { mentorId, deletedAt: null }, deletedAt: null },
    });
  }

  async countTodayByMentor(mentorId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return prisma.submission.count({
      where: {
        form: { mentorId, deletedAt: null },
        deletedAt: null,
        submittedAt: { gte: startOfDay },
      },
    });
  }

  async countLateByMentor(mentorId: string) {
    return prisma.submission.count({
      where: {
        form: { mentorId, deletedAt: null },
        deletedAt: null,
        status: "LATE",
      },
    });
  }

  async countPendingReviewByMentor(mentorId: string) {
    return prisma.submission.count({
      where: {
        form: { mentorId, deletedAt: null },
        deletedAt: null,
        status: "SUBMITTED",
      },
    });
  }

  async countByForm(formId: string) {
    return prisma.submission.count({
      where: { formId, deletedAt: null },
    });
  }

  async findByFormAndEmails(formId: string, emails: string[]) {
    const validEmails = emails.map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (validEmails.length === 0) return [];

    return prisma.submission.findMany({
      where: {
        formId,
        deletedAt: null,
        OR: validEmails.map((email) => ({
          email: { equals: email, mode: "insensitive" },
        })),
      },
      select: {
        id: true,
        email: true,
        status: true,
        submittedAt: true,
      },
      orderBy: {
        submittedAt: "desc",
      },
    });
  }
}

export const submissionRepository = new SubmissionRepository();
