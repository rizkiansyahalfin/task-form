"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Trash,
  Eye,
  Download,
  FolderOpen
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { MentorLayout } from "@/components/layout/mentor-layout";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { SubmissionStatus, SubmissionWithAnswers, SubmissionAnswerItem, SubmissionFileItem } from "@/types";
import { useForms } from "@/hooks/use-forms";
import { useSubmissions, useSubmission, useUpdateSubmissionStatus, useDeleteSubmission } from "@/hooks/use-submissions";

function SubmissionsContent() {
  const searchParams = useSearchParams();
  const initialFormId = searchParams.get("formId") || "all";

  const [formId, setFormId] = useState(initialFormId);
  const [page, setPage] = useState(1);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);

  // Queries
  const { data: formsData } = useForms();
  const { data: subsData, isLoading: isSubsLoading, refetch } = useSubmissions({
    page,
    formId: formId === "all" ? undefined : formId
  });

  const { data: currentSubmission, isLoading: isSubDetailLoading } = useSubmission(selectedSubId || "");
  const updateStatusMutation = useUpdateSubmissionStatus();
  const deleteSubMutation = useDeleteSubmission();

  const forms = formsData?.forms || [];
  const submissions = subsData?.submissions || [];
  const meta = subsData?.meta;

  const handleStatusChange = async (id: string, nextStatus: SubmissionStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: nextStatus });
      toast.success("Submission status updated successfully!");
      refetch();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this submission?")) return;
    try {
      await deleteSubMutation.mutateAsync(id);
      toast.success("Submission deleted successfully!");
      setSelectedSubId(null);
      refetch();
    } catch {
      toast.error("Failed to delete submission");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-950 dark:text-green-300">Selesai</Badge>;
      case "REVIEWED":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300">Ditinjau</Badge>;
      case "REVISION":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300">Perlu Revisi</Badge>;
      case "LATE":
        return <Badge variant="destructive">Terlambat</Badge>;
      default:
        return <Badge variant="secondary">Dikumpulkan</Badge>;
    }
  };

  return (
    <MentorLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pengumpulan Tugas</h1>
            <p className="text-muted-foreground">
              Tinjau dan nilai pengumpulan dari santri Anda.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Filter berdasarkan Formulir:</span>
            <Select
              value={formId}
              onValueChange={(val) => {
                setFormId(val || "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder="All Forms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Formulir</SelectItem>
                {forms.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Submissions List */}
        {isSubsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : submissions.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <FolderOpen className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <CardTitle className="text-xl">Belum ada pengumpulan</CardTitle>
            <CardDescription className="max-w-sm mt-2">
              Belum ada pengumpulan yang sesuai dengan filter Anda. Bagikan link formulir kepada santri Anda.
            </CardDescription>
          </Card>
        ) : (
          <div className="border rounded-lg overflow-hidden bg-card">
            <div className="min-w-full overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-900 text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-6 py-3.5 text-left">Email/IP Santri</th>
                    <th className="px-6 py-3.5 text-left">Judul Formulir</th>
                    <th className="px-6 py-3.5 text-left">Waktu Pengumpulan</th>
                    <th className="px-6 py-3.5 text-left">Status</th>
                    <th className="px-6 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {submissions.map((sub: SubmissionWithAnswers) => (
                    <tr key={sub.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                      <td className="px-6 py-4 font-medium">
                        {sub.email || <span className="text-muted-foreground italic">Anonymous ({sub.ipAddress})</span>}
                      </td>
                      <td className="px-6 py-4">{sub.form?.title || "Unknown Form"}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {format(new Date(sub.submittedAt), "PPp")}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(sub.status)}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => setSelectedSubId(sub.id)}
                        >
                          <Eye className="h-3.5 w-3.5" /> Tinjau
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-4">
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

        {/* Submission Details Modal */}
        <Dialog open={!!selectedSubId} onOpenChange={(open) => !open && setSelectedSubId(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tinjau Pengumpulan</DialogTitle>
              <DialogDescription>
                Dikumpulkan oleh {currentSubmission?.email || "Anonim"} pada{" "}
                {currentSubmission?.submittedAt && format(new Date(currentSubmission.submittedAt), "PPp")}
              </DialogDescription>
            </DialogHeader>

            {isSubDetailLoading ? (
              <div className="space-y-4 py-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="space-y-6 py-4">
                {/* Answers Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold border-b pb-2">Jawaban Santri</h3>
                  {currentSubmission?.answers?.map((ans: SubmissionAnswerItem) => (
                    <div key={ans.id} className="space-y-1.5 border-l-2 pl-3 py-1">
                      <p className="text-xs font-semibold text-muted-foreground">
                        {ans.field?.label || "Pertanyaan"}
                      </p>
                      <p className="text-sm">
                        {ans.value || ans.values?.join(", ") || (
                          <span className="text-muted-foreground italic">Tidak ada jawaban</span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Uploaded Files Section */}
                {currentSubmission?.files && currentSubmission.files.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold border-b pb-2">File yang Diunggah</h3>
                    <div className="grid gap-2">
                      {currentSubmission.files?.map((file: SubmissionFileItem) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between border rounded p-3 text-sm bg-zinc-50 dark:bg-zinc-900"
                        >
                          <div className="truncate pr-4">
                            <p className="font-medium truncate">{file.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.fileSize / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                          {file.url && (
                            <a href={file.url} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm" className="gap-1.5">
                                <Download className="h-3.5 w-3.5" /> Unduh
                              </Button>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grade & Actions */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold text-sm">Perbarui Status Pengumpulan</h3>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Select
                      value={currentSubmission?.status}
                      onValueChange={(val) => currentSubmission && handleStatusChange(currentSubmission.id, val as SubmissionStatus)}
                      disabled={updateStatusMutation.isPending}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Pilih Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUBMITTED">Dikumpulkan</SelectItem>
                        <SelectItem value="REVIEWED">Ditinjau</SelectItem>
                        <SelectItem value="REVISION">Minta Revisi</SelectItem>
                        <SelectItem value="COMPLETED">Selesai</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="destructive"
                      className="sm:ml-auto gap-1"
                      onClick={() => currentSubmission && handleDelete(currentSubmission.id)}
                      disabled={deleteSubMutation.isPending}
                    >
                      <Trash className="h-4 w-4" /> Hapus Pengumpulan
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MentorLayout>
  );
}

export default function SubmissionsPage() {
  return (
    <Suspense
      fallback={
        <MentorLayout>
          <div className="space-y-6">
            <Skeleton className="h-10 w-[200px]" />
            <Skeleton className="h-40 w-full" />
          </div>
        </MentorLayout>
      }
    >
      <SubmissionsContent />
    </Suspense>
  );
}
