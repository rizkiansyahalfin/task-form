import type { FieldType, FormStatus, SubmissionStatus } from "@prisma/client";

export type { FieldType, FormStatus, SubmissionStatus };

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  details?: Record<string, string[]>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

export interface DashboardStats {
  formCount: number;
  submissionCount: number;
  todaySubmissions: number;
  lateSubmissions: number;
  pendingReview: number;
}

export interface FormWithFields {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: FormStatus;
  deadline: Date | null;
  allowLate: boolean;
  maxSubmissions: number | null;
  allowEdit: boolean;
  collectEmail: boolean;
  successTitle: string | null;
  successMessage: string | null;
  customMessage: string | null;
  mentorId: string;
  createdAt: Date;
  updatedAt: Date;
  fields: FormFieldWithOptions[];
  _count?: {
    submissions: number;
  };
}

export interface FormFieldWithOptions {
  id: string;
  formId: string;
  type: FieldType;
  label: string;
  description: string | null;
  placeholder: string | null;
  required: boolean;
  order: number;
  validation: Record<string, unknown> | null;
  defaultValue: string | null;
  options: FormFieldOptionItem[];
}

export interface FormFieldOptionItem {
  id: string;
  label: string;
  value: string;
  order: number;
}

export interface SubmissionWithAnswers {
  id: string;
  formId: string;
  status: SubmissionStatus;
  email: string | null;
  submittedAt: Date;
  updatedAt: Date;
  answers: SubmissionAnswerItem[];
  files: SubmissionFileItem[];
  form?: {
    title: string;
    slug: string;
  };
}

export interface SubmissionAnswerItem {
  id: string;
  fieldId: string;
  value: string | null;
  values: string[];
  field?: {
    label: string;
    type: FieldType;
  };
}

export interface SubmissionFileItem {
  id: string;
  fieldId: string | null;
  fileName: string;
  fileKey: string;
  mimeType: string;
  fileSize: number;
  url: string | null;
}

export interface SignedUploadUrl {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
}

export interface CreateFormInput {
  title: string;
  description?: string;
  deadline?: string | null;
  allowLate?: boolean;
  maxSubmissions?: number | null;
  allowEdit?: boolean;
  collectEmail?: boolean;
  successTitle?: string;
  successMessage?: string;
  customMessage?: string;
  fields?: CreateFormFieldInput[];
}

export interface CreateFormFieldInput {
  type: FieldType;
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  order: number;
  validation?: Record<string, unknown>;
  defaultValue?: string;
  options?: { label: string; value: string; order: number }[];
}

export interface UpdateFormInput extends Partial<CreateFormInput> {
  status?: FormStatus;
}

export interface SubmitFormInput {
  email?: string;
  answers: {
    fieldId: string;
    value?: string;
    values?: string[];
  }[];
  files?: {
    fieldId: string;
    fileKey: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
  }[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
}
