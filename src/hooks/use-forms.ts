import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type { DashboardStats, FormWithFields, PaginationMeta, FormProgressSummary, StudentFormWithStatus, MultiFormProgressSummary } from "@/types";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await apiFetch<DashboardStats>("/api/dashboard");
      return res.data!;
    },
  });
}

export function useForms(params?: { page?: number; limit?: number; search?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.search) searchParams.set("search", params.search);

  return useQuery({
    queryKey: ["forms", params],
    queryFn: async () => {
      const res = await apiFetch<FormWithFields[]>(`/api/forms?${searchParams}`);
      return { forms: res.data!, meta: res.meta as PaginationMeta };
    },
  });
}

export function useForm(id: string) {
  return useQuery({
    queryKey: ["forms", id],
    queryFn: async () => {
      const res = await apiFetch<FormWithFields>(`/api/forms/${id}`);
      return res.data!;
    },
    enabled: !!id,
  });
}

export function usePublicForm(slug: string) {
  return useQuery({
    queryKey: ["public-form", slug],
    queryFn: async () => {
      const res = await apiFetch<FormWithFields>(`/api/forms/public/${slug}`);
      return res.data!;
    },
    enabled: !!slug,
  });
}

export function useCreateForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiFetch<FormWithFields>("/api/forms", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateForm(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiFetch<FormWithFields>(`/api/forms/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      queryClient.invalidateQueries({ queryKey: ["forms", id] });
    },
  });
}

export function usePublishForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch<FormWithFields>(`/api/forms/${id}/publish`, {
        method: "POST",
      });
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
  });
}

export function useUnpublishForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch<FormWithFields>(`/api/forms/${id}/publish`, {
        method: "DELETE",
      });
      return res.data!;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      queryClient.invalidateQueries({ queryKey: ["forms", id] });
    },
  });
}

export function useDeleteForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/forms/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useSubmitForm(slug: string) {
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiFetch(`/api/forms/public/${slug}/submit`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.data;
    },
  });
}

export function useStudentForms(params?: { page?: number; limit?: number; search?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.search) searchParams.set("search", params.search);

  return useQuery({
    queryKey: ["student-forms", params],
    queryFn: async () => {
      const res = await apiFetch<StudentFormWithStatus[]>(`/api/student/forms?${searchParams}`);
      return { forms: res.data!, meta: res.meta as PaginationMeta };
    },
  });
}

export function useFormProgress(formId: string) {
  return useQuery({
    queryKey: ["form-progress", formId],
    queryFn: async () => {
      const res = await apiFetch<FormProgressSummary>(`/api/forms/${formId}/progress`);
      return res.data!;
    },
    enabled: !!formId,
  });
}

export function useMultiFormProgress(enabled = true) {
  return useQuery({
    queryKey: ["multi-form-progress"],
    queryFn: async () => {
      const res = await apiFetch<MultiFormProgressSummary>("/api/forms/recap-progress");
      return res.data!;
    },
    enabled,
  });
}
