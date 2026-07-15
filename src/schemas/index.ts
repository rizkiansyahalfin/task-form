import { z } from "zod";

import { FIELD_TYPES, FORM_STATUSES, SUBMISSION_STATUSES } from "@/constants";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export const formFieldOptionSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  order: z.number().int().min(0),
});

export const formFieldSchema = z.object({
  id: z.string().optional(),
  type: z.enum(FIELD_TYPES),
  label: z.string().min(1, "Label is required"),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional().default(false),
  order: z.number().int().min(0),
  validation: z.record(z.string(), z.unknown()).optional(),
  defaultValue: z.string().optional(),
  options: z.array(formFieldOptionSchema).optional(),
});

export const createFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  deadline: z.string().datetime().optional().nullable(),
  allowLate: z.boolean().optional().default(false),
  maxSubmissions: z.number().int().positive().optional().nullable(),
  allowEdit: z.boolean().optional().default(false),
  collectEmail: z.boolean().optional().default(false),
  successTitle: z.string().max(200).optional(),
  successMessage: z.string().max(2000).optional(),
  customMessage: z.string().max(2000).optional(),
  fields: z.array(formFieldSchema).optional(),
});

export const updateFormSchema = createFormSchema.partial().extend({
  status: z.enum(FORM_STATUSES).optional(),
});

export const paginationSchema = z.object({
  page: z.preprocess((val) => (val === null || val === "" ? undefined : val), z.coerce.number().int().positive().optional().default(1)),
  limit: z.preprocess((val) => (val === null || val === "" ? undefined : val), z.coerce.number().int().positive().max(100).optional().default(10)),
  sortBy: z.preprocess((val) => (val === null || val === "" ? undefined : val), z.string().optional()),
  sortOrder: z.preprocess((val) => (val === null || val === "" ? undefined : val), z.enum(["asc", "desc"]).optional().default("desc")),
  search: z.preprocess((val) => (val === null || val === "" ? undefined : val), z.string().optional()),
  status: z.preprocess((val) => (val === null || val === "" ? undefined : val), z.enum(SUBMISSION_STATUSES).optional()),
  formId: z.preprocess((val) => (val === null || val === "" ? undefined : val), z.string().optional()),
});

export const submitFormSchema = z.object({
  email: z.preprocess((val) => (val === null || val === "" ? undefined : val), z.string().email().optional()),
  answers: z.array(
    z.object({
      fieldId: z.string().min(1),
      value: z.preprocess((val) => (val === null || val === "" ? undefined : val), z.string().optional()),
      values: z.array(z.string()).optional(),
    }),
  ),
  files: z
    .array(
      z.object({
        fieldId: z.string().min(1),
        fileKey: z.string().min(1),
        fileName: z.string().min(1),
        mimeType: z.string().min(1),
        fileSize: z.number().int().positive(),
      }),
    )
    .optional(),
});

export const uploadRequestSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().int().positive(),
  folder: z.string().optional(),
});

export const updateSubmissionStatusSchema = z.object({
  status: z.enum(SUBMISSION_STATUSES),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateFormInput = z.infer<typeof createFormSchema>;
export type UpdateFormInput = z.infer<typeof updateFormSchema>;
export type SubmitFormInput = z.infer<typeof submitFormSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
