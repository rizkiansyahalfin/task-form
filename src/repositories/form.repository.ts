import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { CreateFormInput, PaginationParams } from "@/types";

const formInclude = {
  fields: {
    where: { deletedAt: null },
    orderBy: { order: "asc" as const },
    include: {
      options: { orderBy: { order: "asc" as const } },
    },
  },
  _count: {
    select: { submissions: { where: { deletedAt: null } } },
  },
};

export class FormRepository {
  async findById(id: string, mentorId?: string) {
    return prisma.form.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(mentorId ? { mentorId } : {}),
      },
      include: formInclude,
    });
  }

  async findBySlug(slug: string) {
    return prisma.form.findFirst({
      where: { slug, deletedAt: null, status: "PUBLISHED" },
      include: formInclude,
    });
  }

  async findMany(mentorId: string, params: PaginationParams) {
    const { page = 1, limit = 10, search, sortBy = "createdAt", sortOrder = "desc" } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.FormWhereInput = {
      mentorId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.form.findMany({
        where,
        include: formInclude,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.form.count({ where }),
    ]);

    return { items, total };
  }

  async findPublished(params: PaginationParams) {
    const { page = 1, limit = 10, search, sortBy = "createdAt", sortOrder = "desc" } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.FormWhereInput = {
      status: "PUBLISHED",
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.form.findMany({
        where,
        include: formInclude,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.form.count({ where }),
    ]);

    return { items, total };
  }

  async create(mentorId: string, data: CreateFormInput & { slug: string }) {
    const { fields, ...formData } = data;

    return prisma.form.create({
      data: {
        ...formData,
        mentorId,
        deadline: formData.deadline ? new Date(formData.deadline) : null,
        fields: fields?.length
          ? {
              create: fields.map((field) => ({
                type: field.type,
                label: field.label,
                description: field.description,
                placeholder: field.placeholder,
                required: field.required ?? false,
                order: field.order,
                validation: field.validation as Prisma.InputJsonValue,
                defaultValue: field.defaultValue,
                options: field.options?.length
                  ? { create: field.options }
                  : undefined,
              })),
            }
          : undefined,
      },
      include: formInclude,
    });
  }

  async update(id: string, mentorId: string, data: Partial<CreateFormInput>) {
    const { fields, ...formData } = data;

    if (fields) {
      // Find all existing active fields for this form
      const existingFields = await prisma.formField.findMany({
        where: { formId: id, deletedAt: null },
        select: { id: true },
      });
      const existingFieldIds = new Set(existingFields.map((f) => f.id));

      const payloadFieldIds = new Set(
        fields.map((f) => f.id).filter(Boolean) as string[],
      );

      // Soft-delete fields that are in database but NOT in payload
      const fieldsToSoftDelete = [...existingFieldIds].filter(
        (fieldId) => !payloadFieldIds.has(fieldId),
      );

      if (fieldsToSoftDelete.length > 0) {
        await prisma.formField.updateMany({
          where: { id: { in: fieldsToSoftDelete } },
          data: { deletedAt: new Date() },
        });
      }

      // Upsert fields from payload
      for (const field of fields) {
        if (field.id) {
          // Clean up old options first
          await prisma.formFieldOption.deleteMany({
            where: { fieldId: field.id },
          });

          // Update the field
          await prisma.formField.update({
            where: { id: field.id },
            data: {
              type: field.type,
              label: field.label,
              description: field.description || null,
              placeholder: field.placeholder || null,
              required: field.required ?? false,
              order: field.order,
              validation: field.validation as Prisma.InputJsonValue,
              defaultValue: field.defaultValue || null,
              options: field.options?.length
                ? {
                    create: field.options.map((opt) => ({
                      label: opt.label,
                      value: opt.value,
                      order: opt.order,
                    })),
                  }
                : undefined,
              deletedAt: null,
            },
          });
        } else {
          // Create new field
          await prisma.formField.create({
            data: {
              formId: id,
              type: field.type,
              label: field.label,
              description: field.description || null,
              placeholder: field.placeholder || null,
              required: field.required ?? false,
              order: field.order,
              validation: field.validation as Prisma.InputJsonValue,
              defaultValue: field.defaultValue || null,
              options: field.options?.length
                ? {
                    create: field.options.map((opt) => ({
                      label: opt.label,
                      value: opt.value,
                      order: opt.order,
                    })),
                  }
                : undefined,
            },
          });
        }
      }
    }

    return prisma.form.update({
      where: { id, mentorId },
      data: {
        ...formData,
        deadline:
          formData.deadline !== undefined
            ? formData.deadline
              ? new Date(formData.deadline)
              : null
            : undefined,
      },
      include: formInclude,
    });
  }

  async updateStatus(id: string, mentorId: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
    return prisma.form.update({
      where: { id, mentorId },
      data: { status },
      include: formInclude,
    });
  }

  async softDelete(id: string, mentorId: string) {
    return prisma.form.update({
      where: { id, mentorId },
      data: { deletedAt: new Date() },
    });
  }

  async duplicate(id: string, mentorId: string, slug: string, title: string) {
    const original = await this.findById(id, mentorId);
    if (!original) return null;

    return prisma.form.create({
      data: {
        slug,
        title,
        description: original.description,
        status: "DRAFT",
        deadline: original.deadline,
        allowLate: original.allowLate,
        maxSubmissions: original.maxSubmissions,
        allowEdit: original.allowEdit,
        collectEmail: original.collectEmail,
        successTitle: original.successTitle,
        successMessage: original.successMessage,
        customMessage: original.customMessage,
        mentorId,
        fields: {
          create: original.fields.map((field) => ({
            type: field.type,
            label: field.label,
            description: field.description,
            placeholder: field.placeholder,
            required: field.required,
            order: field.order,
            validation: field.validation ?? undefined,
            defaultValue: field.defaultValue,
            options: field.options.length
              ? {
                  create: field.options.map((opt) => ({
                    label: opt.label,
                    value: opt.value,
                    order: opt.order,
                  })),
                }
              : undefined,
          })),
        },
      },
      include: formInclude,
    });
  }

  async countByMentor(mentorId: string) {
    return prisma.form.count({
      where: { mentorId, deletedAt: null },
    });
  }
}

export const formRepository = new FormRepository();
