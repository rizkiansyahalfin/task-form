"use client";

import { use, useState } from "react";
import {
  ArrowLeft,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  Users,
  ExternalLink,
  ClipboardList
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { MentorLayout } from "@/components/layout/mentor-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useForm, useFormProgress } from "@/hooks/use-forms";
import { formatDate } from "@/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function FormProgressPage({ params }: PageProps) {
  const { id } = use(params);
  
  const { data: form, isLoading: isFormLoading } = useForm(id);
  const { data: progressData, isLoading: isProgressLoading } = useFormProgress(id);
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "submitted" | "unsubmitted">("all");

  const isLoading = isFormLoading || isProgressLoading;

  if (isLoading) {
    return (
      <MentorLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </MentorLayout>
    );
  }

  if (!form || !progressData) {
    return (
      <MentorLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h2 className="text-2xl font-bold">Form Not Found</h2>
          <p className="text-muted-foreground mt-2">
            The form progress details could not be loaded.
          </p>
          <Link href="/forms" className="mt-4">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Forms
            </Button>
          </Link>
        </div>
      </MentorLayout>
    );
  }

  const { totalStudents, submittedCount, progress } = progressData;
  const unsubmittedCount = totalStudents - submittedCount;
  const submissionRate = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;

  // Filter progress items
  const filteredProgress = progress.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase());
      
    if (!matchesSearch) return false;

    if (statusFilter === "submitted") return item.hasSubmitted;
    if (statusFilter === "unsubmitted") return !item.hasSubmitted;
    return true;
  });

  const getStatusBadge = (item: typeof progress[0]) => {
    if (!item.hasSubmitted) {
      return (
        <Badge variant="outline" className="bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
          Belum Mengumpulkan
        </Badge>
      );
    }

    switch (item.submissionStatus) {
      case "COMPLETED":
        return <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300">Completed</Badge>;
      case "REVIEWED":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300">Reviewed</Badge>;
      case "REVISION":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300">Revision</Badge>;
      case "LATE":
        return <Badge variant="destructive">Late</Badge>;
      default:
        return <Badge variant="secondary">Submitted</Badge>;
    }
  };

  return (
    <MentorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
          <div className="flex items-center gap-4">
            <Link href={`/forms/${id}`}>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">Progress Pengumpulan</h1>
                <Badge variant="outline" className="text-xs">
                  {form.status.toLowerCase()}
                </Badge>
              </div>
              <p className="mt-1 font-semibold text-lg text-primary">
                {form.title}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/public/form/${form.slug}`} target="_blank">
              <Button variant="outline" size="sm" className="gap-1.5 text-blue-600 dark:text-blue-400">
                <ExternalLink className="h-4 w-4" /> Live Form
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Santri</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Sudah Mengumpulkan</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{submittedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Belum Mengumpulkan</CardTitle>
              <XCircle className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{unsubmittedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Persentase</CardTitle>
              <ClipboardList className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submissionRate}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Daftar Progress Santri</CardTitle>
                <CardDescription>
                  Status pengumpulan tugas untuk seluruh santri yang terdaftar.
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-[260px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari santri..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-1 border p-1 rounded-lg bg-zinc-50 dark:bg-zinc-900">
                  <Button
                    variant={statusFilter === "all" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setStatusFilter("all")}
                  >
                    Semua
                  </Button>
                  <Button
                    variant={statusFilter === "submitted" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 text-xs text-green-600"
                    onClick={() => setStatusFilter("submitted")}
                  >
                    Sudah
                  </Button>
                  <Button
                    variant={statusFilter === "unsubmitted" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 text-xs text-amber-600"
                    onClick={() => setStatusFilter("unsubmitted")}
                  >
                    Belum
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredProgress.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium">Tidak ada santri yang cocok.</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden bg-card">
                <div className="min-w-full overflow-x-auto">
                  <table className="min-w-full divide-y divide-border text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-900 text-muted-foreground font-semibold">
                      <tr>
                        <th className="px-6 py-3 text-left">Nama</th>
                        <th className="px-6 py-3 text-left">Email</th>
                        <th className="px-6 py-3 text-left">Status</th>
                        <th className="px-6 py-3 text-left">Dikumpulkan Pada</th>
                        <th className="px-6 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredProgress.map((item) => (
                        <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                          <td className="px-6 py-4 font-medium whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {item.image ? (
                                <Image src={item.image} alt={item.name} width={24} height={24} className="h-6 w-6 rounded-full shrink-0" unoptimized />
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs shrink-0">
                                  {item.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="truncate max-w-[150px]">{item.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">{item.email}</td>
                          <td className="px-6 py-4">{getStatusBadge(item)}</td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {item.submittedAt ? formatDate(item.submittedAt) : "-"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {item.hasSubmitted && item.submissionId ? (
                              <Link href={`/submissions?formId=${id}`}>
                                <Button variant="outline" size="sm">
                                  Review
                                </Button>
                              </Link>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MentorLayout>
  );
}
