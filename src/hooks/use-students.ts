"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export interface StudentItem {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface StudentStats {
  total: number;
  active: number;
  inactive: number;
}

export function useStudents(params?: { page?: number; search?: string; status?: "active" | "inactive" | "all" }) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.search) searchParams.set("search", params.search);
  if (params?.status) searchParams.set("status", params.status);

  return useQuery({
    queryKey: ["students", params],
    queryFn: async () => {
      const res = await apiFetch<{ students: StudentItem[]; stats: StudentStats }>(`/api/students?${searchParams}`);
      return {
        students: res.data!.students,
        stats: res.data!.stats,
        meta: res.meta,
      };
    },
  });
}

export function useUpdateStudentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await apiFetch<StudentItem>(`/api/students/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ active }),
      });
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      queryClient.invalidateQueries({ queryKey: ["form-progress"] });
    },
  });
}
