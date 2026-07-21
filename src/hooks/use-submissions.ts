"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type { SubmissionStatus, SubmissionWithAnswers } from "@/types";

export function useSubmissions(params?: { page?: number; formId?: string; status?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.formId) searchParams.set("formId", params.formId);
  if (params?.status) searchParams.set("status", params.status);

  return useQuery({
    queryKey: ["submissions", params],
    queryFn: async () => {
      const res = await apiFetch<SubmissionWithAnswers[]>(`/api/submissions?${searchParams}`);
      return { submissions: res.data!, meta: res.meta };
    },
  });
}

export function useSubmission(id: string) {
  return useQuery({
    queryKey: ["submissions", id],
    queryFn: async () => {
      const res = await apiFetch<SubmissionWithAnswers>(`/api/submissions/${id}`);
      return res.data!;
    },
    enabled: !!id,
  });
}

export function useUpdateSubmissionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: SubmissionStatus }) => {
      const res = await apiFetch<SubmissionWithAnswers>(`/api/submissions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      return res.data!;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      queryClient.invalidateQueries({ queryKey: ["submissions", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/submissions/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useStudentSubmission(params: { formId?: string; slug?: string }) {
  const searchParams = new URLSearchParams();
  if (params.formId) searchParams.set("formId", params.formId);
  if (params.slug) searchParams.set("slug", params.slug);

  const enabled = !!params.formId || !!params.slug;

  return useQuery({
    queryKey: ["student-submission", params],
    queryFn: async () => {
      const res = await apiFetch<SubmissionWithAnswers | null>(`/api/student/submissions?${searchParams}`);
      return res.data;
    },
    enabled,
  });
}

export function useUpdateStudentSubmission(submissionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiFetch(`/api/student/submissions?id=${submissionId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-submission"] });
      queryClient.invalidateQueries({ queryKey: ["student-forms"] });
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    },
  });
}
