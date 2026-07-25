"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Trash,
  Eye,
  Download,
  FolderOpen,
  MessageSquare,
  CheckSquare,
  Square,
  Save,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { MentorLayout } from "@/components/layout/mentor-layout";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { SubmissionStatus, SubmissionWithAnswers, SubmissionAnswerItem, SubmissionFileItem } from "@/types";
import { useForms } from "@/hooks/use-forms";
import {
  useSubmissions,
  useSubmission,
  useUpdateSubmissionStatus,
  useDeleteSubmission,
  useUpdateSubmissionFeedback,
  useBulkUpdateSubmissionStatus,
  useBulkDeleteSubmissions
} from "@/hooks/use-submissions";

function SubmissionsContent() {
  const searchParams = useSearchParams();
  const initialFormId = searchParams.get("formId") || "all";

  const [formId, setFormId] = useState(initialFormId);
  const [page, setPage] = useState(1);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<SubmissionStatus | "">("");

  // Feedback State for current modal
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});

  // Queries & Mutations
  const { data: formsData } = useForms();
  const { data: subsData, isLoading: isSubsLoading, refetch } = useSubmissions({
    page,
    formId: formId === "all" ? undefined : formId
  });

  const { data: currentSubmission, isLoading: isSubDetailLoading } = useSubmission(selectedSubId || "");
  const updateStatusMutation = useUpdateSubmissionStatus();
  const deleteSubMutation = useDeleteSubmission();
  const updateFeedbackMutation = useUpdateSubmissionFeedback();
  const bulkStatusMutation = useBulkUpdateSubmissionStatus();
  const bulkDeleteMutation = useBulkDeleteSubmissions();

  const forms = formsData?.forms || [];
  const submissions = subsData?.submissions || [];
  const meta = subsData?.meta;

  // Initialize feedbacks when submission detail is loaded
  useEffect(() => {
    if (currentSubmission?.answers) {
      const initial: Record<string, string> = {};
      currentSubmission.answers.forEach((ans) => {
        initial[ans.id] = ans.feedback || "";
      });
      setFeedbacks(initial);
    }
  }, [currentSubmission]);

  // Handle single item selection toggle
  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Handle select all toggle
  const toggleSelectAll = () => {
    if (selectedIds.length === submissions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(submissions.map((sub) => sub.id));
    }
  };

  // Handle single status change
  const handleStatusChange = async (id: string, nextStatus: SubmissionStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: nextStatus });
      toast.success("Status pengumpulan berhasil diperbarui!");
      refetch();
    } catch {
      toast.error("Gagal memperbarui status");
    }
  };

  // Handle single delete
  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pengumpulan ini?")) return;
    try {
      await deleteSubMutation.mutateAsync(id);
      toast.success("Pengumpulan berhasil dihapus!");
      setSelectedSubId(null);
      refetch();
    } catch {
      toast.error("Gagal menghapus pengumpulan");
    }
  };

  // Handle Bulk Status Update
  const handleBulkStatusChange = async (status: SubmissionStatus) => {
    if (selectedIds.length === 0) return;
    try {
      await bulkStatusMutation.mutateAsync({ submissionIds: selectedIds, status });
      toast.success(`Berhasil memperbarui ${selectedIds.length} pengumpulan!`);
      setSelectedIds([]);
      setBulkStatus("");
      refetch();
    } catch {
      toast.error("Gagal melakukan pembaruan massal");
    }
  };

  // Handle Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} pengumpulan yang dipilih?`)) return;
    try {
      await bulkDeleteMutation.mutateAsync(selectedIds);
      toast.success(`Berhasil menghapus ${selectedIds.length} pengumpulan!`);
      setSelectedIds([]);
      refetch();
    } catch {
      toast.error("Gagal menghapus secara massal");
    }
  };

  // Handle Saving Feedback per answer
  const handleSaveFeedback = async () => {
    if (!selectedSubId) return;
    try {
      await updateFeedbackMutation.mutateAsync({
        submissionId: selectedSubId,
        feedbacks,
      });
      toast.success("Feedback komentar berhasil disimpan!");
    } catch {
      toast.error("Gagal menyimpan feedback");
    }
  };

  const handleExportCSV = () => {
    const url = `/api/submissions/export?formId=${formId}`;
    window.open(url, "_blank");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-950 dark:text-green-300">Selesai</Badge>;
      case "REVIEWED":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 dark:bg-blue-950 dark:text-green-300">Ditinjau</Badge>;
      case "REVISION":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300">Perlu Revisi</Badge>;
      case "LATE":
        return <Badge variant="destructive">Terlambat</Badge>;
      default:
        return <Badge variant="secondary">Dikumpulkan</Badge>;
    }
  };

  const allSelected = submissions.length > 0 && selectedIds.length === submissions.length;

  return (
    <MentorLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pengumpulan Tugas</h1>
            <p className="text-muted-foreground">
              Tinjau, beri feedback, dan nilai pengumpulan dari santri Anda.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Filter berdasarkan Formulir:</span>
              <Select
                value={formId}
                onValueChange={(val) => {
                  setFormId(val || "all");
                  setPage(1);
                  setSelectedIds([]);
                }}
              >
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder="Semua Formulir" />
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
            <Button onClick={handleExportCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" /> Ekspor CSV
            </Button>
          </div>
        </div>

        {/* Bulk Action Floating Bar */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-primary/10 border border-primary/20 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <CheckSquare className="h-4 w-4" />
              <span>{selectedIds.length} pengumpulan dipilih</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Ubah Status Massal:</span>
                <Select
                  value={bulkStatus}
                  onValueChange={(val) => {
                    if (val) {
                      setBulkStatus(val as SubmissionStatus);
                      handleBulkStatusChange(val as SubmissionStatus);
                    }
                  }}
                  disabled={bulkStatusMutation.isPending}
                >
                  <SelectTrigger className="w-[170px] h-9 text-xs">
                    <SelectValue placeholder="Pilih Status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUBMITTED">Dikumpulkan</SelectItem>
                    <SelectItem value="REVIEWED">Ditinjau</SelectItem>
                    <SelectItem value="REVISION">Minta Revisi</SelectItem>
                    <SelectItem value="COMPLETED">Selesai</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5 h-9"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
              >
                <Trash className="h-3.5 w-3.5" /> Hapus Terpilih
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs"
                onClick={() => setSelectedIds([])}
              >
                Batal
              </Button>
            </div>
          </div>
        )}

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
          <div className="border rounded-lg overflow-hidden bg-card shadow-xs">
            <div className="min-w-full overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-900 text-muted-foreground font-semibold">
                  <tr>
                    <th className="w-12 px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title={allSelected ? "Batal pilih semua" : "Pilih semua"}
                      >
                        {allSelected ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3.5 text-left">Email/IP Santri</th>
                    <th className="px-6 py-3.5 text-left">Judul Formulir</th>
                    <th className="px-6 py-3.5 text-left">Waktu Pengumpulan</th>
                    <th className="px-6 py-3.5 text-left">Status</th>
                    <th className="px-6 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {submissions.map((sub: SubmissionWithAnswers) => {
                    const isSelected = selectedIds.includes(sub.id);
                    return (
                      <tr
                        key={sub.id}
                        className={`transition-colors ${
                          isSelected
                            ? "bg-primary/5 dark:bg-primary/10"
                            : "hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30"
                        }`}
                      >
                        <td className="px-4 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelectRow(sub.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-primary" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                        </td>
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
                    );
                  })}
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
          <DialogContent className="sm:max-w-3xl md:max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Tinjau & Beri Feedback</span>
                {currentSubmission && getStatusBadge(currentSubmission.status)}
              </DialogTitle>
              <DialogDescription>
                Dikumpulkan oleh <span className="font-semibold text-foreground">{currentSubmission?.email || "Anonim"}</span> pada{" "}
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
                {/* Answers & Inline Feedback Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-bold text-sm tracking-wide text-foreground flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-600" /> Jawaban Santri & Feedback Mentor per-Field
                    </h3>
                  </div>

                  {currentSubmission?.answers?.map((ans: SubmissionAnswerItem) => (
                    <div
                      key={ans.id}
                      className="p-4 rounded-xl border bg-card space-y-3 hover:border-primary/40 transition-colors shadow-2xs"
                    >
                      <div>
                        <p className="text-xs font-bold text-primary tracking-wide">
                          {ans.field?.label || "Pertanyaan"}
                        </p>
                        <p className="text-sm font-medium mt-1 text-foreground">
                          {ans.value || ans.values?.join(", ") || (
                            <span className="text-muted-foreground italic">Tidak ada jawaban</span>
                          )}
                        </p>
                      </div>

                      {/* Mentor Feedback Input Box */}
                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1.5">
                        <label className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" /> Komentar / Catatan Revisi Mentor untuk Field ini:
                        </label>
                        <Input
                          placeholder="Tuliskan catatan khusus untuk jawaban ini (misal: link repo belum public, atau penjelasan kurang lengkap)..."
                          value={feedbacks[ans.id] || ""}
                          onChange={(e) =>
                            setFeedbacks((prev) => ({
                              ...prev,
                              [ans.id]: e.target.value,
                            }))
                          }
                          className="text-xs bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 focus-visible:ring-amber-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Uploaded Files Section */}
                {currentSubmission?.files && currentSubmission.files.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold border-b pb-2 text-sm">File yang Diunggah</h3>
                    <div className="grid gap-2">
                      {currentSubmission.files?.map((file: SubmissionFileItem) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between border rounded-lg p-3 text-sm bg-zinc-50 dark:bg-zinc-900"
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

                {/* Save Feedback & Status Actions Bar */}
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Aksi & Perbarui Status</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveFeedback}
                      disabled={updateFeedbackMutation.isPending}
                      className="gap-1.5 text-xs text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50"
                    >
                      <Save className="h-3.5 w-3.5" /> Simpan Feedback Komentar
                    </Button>
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Select
                      value={currentSubmission?.status}
                      onValueChange={(val) => currentSubmission && handleStatusChange(currentSubmission.id, val as SubmissionStatus)}
                      disabled={updateStatusMutation.isPending}
                    >
                      <SelectTrigger className="w-[220px]">
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
