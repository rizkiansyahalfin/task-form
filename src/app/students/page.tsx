"use client";

import { useState } from "react";
import {
  Users,
  Search,
  UserCheck,
  UserX,
  Loader2,
  ShieldCheck,
  UserMinus
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { format } from "date-fns";

import { MentorLayout } from "@/components/layout/mentor-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudents, useUpdateStudentStatus, type StudentItem } from "@/hooks/use-students";

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useStudents({
    page,
    search,
    status: statusFilter,
  });

  const updateStatusMutation = useUpdateStudentStatus();

  const students = data?.students || [];
  const stats = data?.stats;
  const meta = data?.meta;

  const handleToggleStatus = async (student: StudentItem, targetActive: boolean) => {
    const actionLabel = targetActive ? "mengaktifkan kembali" : "menonaktifkan (DO)";
    if (!confirm(`Apakah Anda yakin ingin ${actionLabel} akun santri "${student.name}"?`)) {
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        id: student.id,
        active: targetActive,
      });
      toast.success(`Santri "${student.name}" berhasil di-${targetActive ? "aktifkan" : "nonaktifkan"}!`);
      refetch();
    } catch {
      toast.error("Gagal memperbarui status santri");
    }
  };

  return (
    <MentorLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manajemen Santri</h1>
            <p className="text-muted-foreground">
              Kelola status keaktifan santri terdaftar dan penonaktifan akun santri Drop Out (DO).
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Terdaftar</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Santri Aktif</CardTitle>
              <ShieldCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.active ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nonaktif / Drop Out</CardTitle>
              <UserMinus className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats?.inactive ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Daftar Akun Santri</CardTitle>
                <CardDescription>
                  Santri nonaktif tidak akan lagi dihitung pada persentase tugas & broadcast pengingat WA.
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-[260px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama / email santri..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <div className="flex gap-1 border p-1 rounded-lg bg-zinc-50 dark:bg-zinc-900">
                  <Button
                    variant={statusFilter === "all" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => { setStatusFilter("all"); setPage(1); }}
                  >
                    Semua
                  </Button>
                  <Button
                    variant={statusFilter === "active" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 text-xs text-green-600"
                    onClick={() => { setStatusFilter("active"); setPage(1); }}
                  >
                    Aktif
                  </Button>
                  <Button
                    variant={statusFilter === "inactive" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 text-xs text-amber-600"
                    onClick={() => { setStatusFilter("inactive"); setPage(1); }}
                  >
                    Nonaktif (DO)
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3 py-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium">Santri tidak ditemukan.</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden bg-card">
                <div className="min-w-full overflow-x-auto">
                  <table className="min-w-full divide-y divide-border text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-900 text-muted-foreground font-semibold">
                      <tr>
                        <th className="px-6 py-3.5 text-left">Santri</th>
                        <th className="px-6 py-3.5 text-left">Email Akun</th>
                        <th className="px-6 py-3.5 text-left">Tanggal Terdaftar</th>
                        <th className="px-6 py-3.5 text-left">Status</th>
                        <th className="px-6 py-3.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {students.map((student) => {
                        const isActive = !student.deletedAt;
                        return (
                          <tr key={student.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                            <td className="px-6 py-4 font-medium whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                {student.image ? (
                                  <Image
                                    src={student.image}
                                    alt={student.name}
                                    width={32}
                                    height={32}
                                    className="h-8 w-8 rounded-full shrink-0"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                    {student.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span>{student.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">{student.email}</td>
                            <td className="px-6 py-4 text-muted-foreground">
                              {format(new Date(student.createdAt), "PP")}
                            </td>
                            <td className="px-6 py-4">
                              {isActive ? (
                                <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300">
                                  Aktif
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400">
                                  Nonaktif (DO)
                                </Badge>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {isActive ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1 text-xs text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50"
                                  onClick={() => handleToggleStatus(student, false)}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  <UserX className="h-3.5 w-3.5" /> Nonaktifkan (DO)
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1 text-xs text-green-700 dark:text-green-400 border-green-300 dark:border-green-800 hover:bg-green-50"
                                  onClick={() => handleToggleStatus(student, true)}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  <UserCheck className="h-3.5 w-3.5" /> Aktifkan Kembali
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Sebelumnya
                </Button>
                <span className="flex items-center px-4 text-sm font-medium">
                  Halaman {page} dari {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Berikutnya
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MentorLayout>
  );
}
