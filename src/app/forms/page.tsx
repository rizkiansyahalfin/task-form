"use client";

import { useState } from "react";
import {
  FileText,
  Plus,
  Search,
  ExternalLink,
  Trash,
  CheckCircle,
  Eye,
  Calendar,
  ClipboardList,
  Edit,
  XCircle,
  Users,
  MessageCircle
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";

import { MentorLayout } from "@/components/layout/mentor-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useForms, usePublishForm, useUnpublishForm, useDeleteForm } from "@/hooks/use-forms";
import { Badge } from "@/components/ui/badge";
import { RecapShareModal } from "@/components/forms/recap-share-modal";

export default function FormsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showRecapModal, setShowRecapModal] = useState(false);

  const { data: formsData, isLoading, refetch } = useForms({ page, search });
  const publishFormMutation = usePublishForm();
  const unpublishFormMutation = useUnpublishForm();
  const deleteFormMutation = useDeleteForm();

  const forms = formsData?.forms || [];
  const meta = formsData?.meta;

  const handlePublish = async (id: string) => {
    try {
      await publishFormMutation.mutateAsync(id);
      toast.success("Formulir berhasil diterbitkan!");
      refetch();
    } catch {
      toast.error("Gagal menerbitkan formulir");
    }
  };

  const handleUnpublish = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin mencabut publikasi formulir ini? Status akan kembali menjadi draft.")) return;
    try {
      await unpublishFormMutation.mutateAsync(id);
      toast.success("Formulir berhasil dicabut publikasinya!");
      refetch();
    } catch {
      toast.error("Gagal mencabut publikasi formulir");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus formulir ini?")) return;
    try {
      await deleteFormMutation.mutateAsync(id);
      toast.success("Formulir berhasil dihapus!");
      refetch();
    } catch {
      toast.error("Gagal menghapus formulir");
    }
  };

  return (
    <MentorLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Formulir Tugas</h1>
            <p className="text-muted-foreground">
              Kelola tugas dan tinjau formulir pengumpulan santri Anda.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900 dark:hover:bg-emerald-900/50 shadow-xs"
              onClick={() => setShowRecapModal(true)}
            >
              <MessageCircle className="h-4 w-4" /> Rekap Progress WA
            </Button>
            <Link href="/forms/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Buat Formulir Baru
              </Button>
            </Link>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari formulir..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Forms Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="flex flex-col justify-between">
                <CardHeader className="space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : forms.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <CardTitle className="text-xl">Formulir tidak ditemukan</CardTitle>
            <CardDescription className="max-w-sm mt-2">
              {search ? "Tidak ada formulir yang cocok dengan pencarian Anda." : "Anda belum membuat formulir tugas apa pun. Klik tombol di atas untuk memulai."}
            </CardDescription>
            {!search && (
              <Link href="/forms/new" className="mt-4">
                <Button>Buat Formulir Pertama</Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => (
              <Card key={form.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="line-clamp-1 hover:underline">
                        <Link href={`/forms/${form.id}`}>{form.title}</Link>
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {form.description || "Tidak ada deskripsi."}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        form.status === "PUBLISHED"
                          ? "default"
                          : form.status === "DRAFT"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {form.status === "PUBLISHED" ? "Diterbitkan" : form.status === "DRAFT" ? "Draft" : "Diarsipkan"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 flex flex-col justify-end">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {form.deadline
                          ? `Tenggat: ${format(new Date(form.deadline), "PPp")}`
                          : "Tanpa Tenggat"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4" />
                      <span>{form._count?.submissions ?? 0} Pengumpulan</span>
                    </div>
                  </div>

                  <div className={`grid ${form.status === "PUBLISHED" ? "grid-cols-3" : "grid-cols-2"} gap-2 pt-2 border-t`}>
                    <Link href={`/submissions?formId=${form.id}`} className="w-full">
                      <Button variant="outline" size="xs" className="w-full gap-1 justify-center px-1 text-xs">
                        <Eye className="h-3.5 w-3.5" /> Pengumpulan
                      </Button>
                    </Link>
                    {form.status === "PUBLISHED" && (
                      <Link href={`/forms/${form.id}/progress`} className="w-full">
                        <Button variant="outline" size="xs" className="w-full gap-1 justify-center px-1 text-xs">
                          <Users className="h-3.5 w-3.5" /> Progress
                        </Button>
                      </Link>
                    )}
                    <Link href={`/public/form/${form.slug}`} target="_blank" className="w-full">
                      <Button variant="outline" size="xs" className="w-full gap-1 justify-center text-blue-600 dark:text-blue-400 px-1 text-xs">
                        <ExternalLink className="h-3.5 w-3.5" /> Lihat Live
                      </Button>
                    </Link>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2">
                    <Link href={`/forms/${form.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-1 justify-center">
                        <Edit className="h-3.5 w-3.5" /> Edit
                      </Button>
                    </Link>
                    {form.status === "DRAFT" ? (
                      <Button
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={() => handlePublish(form.id)}
                        disabled={publishFormMutation.isPending}
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Terbitkan
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                        onClick={() => handleUnpublish(form.id)}
                        disabled={unpublishFormMutation.isPending}
                      >
                        <XCircle className="h-3.5 w-3.5" /> Cabut
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(form.id)}
                      disabled={deleteFormMutation.isPending}
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
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
      </div>
      <RecapShareModal open={showRecapModal} onOpenChange={setShowRecapModal} />
    </MentorLayout>
  );
}
