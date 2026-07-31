"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Plus,
  Users,
  Clock,
  AlertCircle,
  AlertTriangle,
  Calendar,
  ExternalLink,
  Loader2,
  LogOut,
  Search,
  BookOpen,
  ArrowRight,
  Eye,
  MessageCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, differenceInHours } from "date-fns";
import { toast } from "sonner";
import type { StudentFormWithStatus } from "@/types";

import { MentorLayout } from "@/components/layout/mentor-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession, signOut } from "@/lib/auth-client";
import { useDashboardStats, useForms, useStudentForms } from "@/hooks/use-forms";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { RecapShareModal } from "@/components/forms/recap-share-modal";

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const role = (session.user as { role?: string }).role ?? "mentor";

  if (role === "mentor") {
    return <MentorDashboard />;
  }

  return <StudentDashboard name={session.user.name} />;
}

// =============================================================================
// MENTOR DASHBOARD VIEW
// =============================================================================
function MentorDashboard() {
  const { data: stats, isLoading: isStatsLoading } = useDashboardStats();
  const { data: formsData, isLoading: isFormsLoading } = useForms({ limit: 5 });
  const [showRecapModal, setShowRecapModal] = useState(false);

  const forms = formsData?.forms || [];

  return (
    <MentorLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dasbor</h1>
            <p className="text-muted-foreground">
              Ringkasan formulir dan pengumpulan tugas Anda.
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
                <Plus className="h-4 w-4" /> Buat Formulir
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Formulir</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isStatsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats?.formCount ?? 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pengumpulan</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isStatsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats?.submissionCount ?? 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pengumpulan Hari Ini</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isStatsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats?.todaySubmissions ?? 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Menunggu Tinjauan</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isStatsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">
                  {stats?.pendingReview ?? 0}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Forms & Submissions List */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Formulir Terbaru</CardTitle>
                <CardDescription>
                  Formulir tugas yang baru Anda buat.
                </CardDescription>
              </div>
              <Link href="/forms">
                <Button variant="outline" size="sm">
                  Lihat Semua
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {isFormsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : forms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm">Belum ada formulir yang dibuat.</p>
                  <Link href="/forms/new" className="mt-2">
                    <Button variant="link" size="sm">
                      Buat formulir pertama Anda
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y">
                  {forms.map((form) => (
                    <div
                      key={form.id}
                      className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                    >
                      <div className="space-y-1">
                        <Link
                          href={`/forms/${form.id}`}
                          className="font-medium hover:underline flex items-center gap-1.5"
                        >
                          {form.title}
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              form.status === "PUBLISHED"
                                ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-950 dark:text-green-400"
                                : form.status === "DRAFT"
                                ? "bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-950 dark:text-yellow-400"
                                : "bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {form.status.toLowerCase()}
                          </span>
                        </Link>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {form.deadline
                              ? `Tenggat: ${format(new Date(form.deadline), "PPp")}`
                              : "Tanpa Tenggat"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/public/form/${form.slug}`}
                          target="_blank"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          Lihat Langsung <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <RecapShareModal open={showRecapModal} onOpenChange={setShowRecapModal} />
    </MentorLayout>
  );
}

// =============================================================================
// STUDENT DASHBOARD VIEW (SANTRI)
// =============================================================================
interface StudentDashboardProps {
  name: string;
}

function StudentDashboard({ name }: StudentDashboardProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "revision" | "submitted">("all");
  const { data: formsData, isLoading } = useStudentForms({ page, search });

  const forms = formsData?.forms || [];
  const meta = formsData?.meta;

  // Client-side filter by status
  const filteredForms = forms.filter((form) => {
    if (statusFilter === "pending") return !form.hasSubmitted;
    if (statusFilter === "revision") return form.submissionStatus === "REVISION";
    if (statusFilter === "submitted") return form.hasSubmitted;
    return true;
  });

  // Count per filter category
  const counts = {
    all: forms.length,
    pending: forms.filter((f) => !f.hasSubmitted).length,
    revision: forms.filter((f) => f.submissionStatus === "REVISION").length,
    submitted: forms.filter((f) => f.hasSubmitted).length,
  };

  const handleSignOut = () => {
    signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/login";
        },
      },
    });
  };

  const getSubmissionStatusBadge = (form: StudentFormWithStatus) => {
    if (!form.hasSubmitted) {
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400">
          Belum Mengumpulkan
        </Badge>
      );
    }

    switch (form.submissionStatus) {
      case "COMPLETED":
        return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-950 dark:text-green-300">Selesai</Badge>;
      case "REVIEWED":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300">Ditinjau</Badge>;
      case "REVISION":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-950 dark:text-yellow-300 animate-pulse">Perlu Revisi</Badge>;
      case "LATE":
        return <Badge variant="destructive">Terlambat</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-950 dark:text-green-300">Sudah Mengumpulkan</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      {/* Top Header */}
      <header className="border-b bg-card px-6 py-4 sticky top-0 z-50 shadow-sm backdrop-blur-md bg-opacity-95">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight bg-linear-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              TaskForm
            </span>
            <Badge variant="secondary" className="font-semibold text-xs rounded-full">
              Santri
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold">Assalamu&apos;alaikum, {name} 👋</p>
              <p className="text-xs text-muted-foreground">Portal Santri</p>
            </div>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:bg-destructive/10 h-9 w-9 rounded-full"
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Student Portal Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Welcome Banner */}
        <div className="rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 p-6 md:p-8 text-white shadow-lg overflow-hidden relative">
          <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-3 max-w-lg">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Kumpulkan Tugas Santri Mudah & Cepat
            </h2>
            <p className="text-blue-100 text-sm md:text-base">
              Silakan pilih daftar formulir tugas di bawah yang dipublikasikan oleh Mentor Anda. Isi jawaban dan kumpulkan berkas/tautan sebelum tenggat waktu.
            </p>
          </div>
        </div>

        {/* Search Bar + Filters */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 max-w-md bg-card p-1.5 rounded-lg border shadow-sm">
            <Search className="h-4 w-4 text-muted-foreground ml-2.5" />
            <Input
              placeholder="Cari formulir tugas..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
            />
          </div>

          {/* Status Filter Pills */}
          {!isLoading && forms.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {([
                { key: "all", label: "Semua" },
                { key: "pending", label: "Belum Dikumpulkan" },
                { key: "revision", label: "Perlu Revisi" },
                { key: "submitted", label: "Sudah Dikumpulkan" },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setStatusFilter(key); setPage(1); }}
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-colors",
                    statusFilter === key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground",
                  ].join(" ")}
                >
                  {label}
                  <span className={[
                    "inline-flex items-center justify-center rounded-full w-4 h-4 text-[10px] font-bold",
                    statusFilter === key ? "bg-white/20" : "bg-muted",
                  ].join(" ")}>
                    {counts[key]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Task Forms Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" /> Daftar Formulir Tugas Yang Tersedia
          </h3>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          ) : filteredForms.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center bg-card border-dashed border-2">
              <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <CardTitle className="text-xl">
                {statusFilter === "all" ? "Tidak ada tugas saat ini" : "Tidak ada formulir di kategori ini"}
              </CardTitle>
              <CardDescription className="max-w-sm mt-2">
                {search
                  ? "Formulir tugas yang Anda cari tidak ditemukan."
                  : statusFilter !== "all"
                  ? "Coba pilih filter lain untuk melihat formulir lainnya."
                  : "Belum ada formulir tugas yang diterbitkan oleh mentor saat ini. Hubungi mentor Anda jika ini kesalahan."}
              </CardDescription>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredForms.map((form) => {
                const isDeadlinePassed = form.deadline ? new Date() > new Date(form.deadline) : false;
                const isClosed = isDeadlinePassed && !form.allowLate;
                const hoursUntilDeadline = form.deadline && !isDeadlinePassed
                  ? differenceInHours(new Date(form.deadline), new Date())
                  : null;
                const isDeadlineCritical = hoursUntilDeadline !== null && hoursUntilDeadline <= 24;
                const isDeadlineWarning = hoursUntilDeadline !== null && hoursUntilDeadline <= 48 && !isDeadlineCritical;

                return (
                  <Card key={form.id} className="flex flex-col justify-between hover:shadow-md transition-shadow bg-card">
                    <CardHeader className="pb-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="line-clamp-1 text-base font-bold" title={form.title}>{form.title}</CardTitle>
                          {isClosed && !form.hasSubmitted ? (
                            <Badge variant="destructive" className="text-xs rounded-full">Tutup</Badge>
                          ) : (
                            <Badge variant="default" className="bg-green-600 text-white text-xs rounded-full hover:bg-green-600">Aktif</Badge>
                          )}
                        </div>
                        <CardDescription className="line-clamp-2 min-h-[40px] text-xs">
                          {form.description || "Tidak ada deskripsi instruksi."}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-0 border-t border-zinc-100 dark:border-zinc-800/50 mt-2">
                      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/50 pb-3 mb-2 text-xs pt-4">
                        <span className="text-muted-foreground">Status Tugas:</span>
                        {getSubmissionStatusBadge(form)}
                      </div>

                      <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                        <div className={[
                            "flex items-center gap-2",
                            isDeadlineCritical ? "text-red-600 dark:text-red-400 font-semibold" : "",
                            isDeadlineWarning ? "text-amber-600 dark:text-amber-400 font-medium" : "",
                          ].join(" ")}>
                            {isDeadlineCritical ? (
                              <AlertTriangle className="h-3.5 w-3.5 animate-pulse" />
                            ) : isDeadlineWarning ? (
                              <Clock className="h-3.5 w-3.5" />
                            ) : (
                              <Calendar className="h-3.5 w-3.5 text-blue-500" />
                            )}
                            <span>
                              {form.deadline
                                ? isDeadlineCritical
                                  ? `Tenggat dalam ${hoursUntilDeadline} jam!`
                                  : isDeadlineWarning
                                  ? `Tenggat dalam ${hoursUntilDeadline} jam`
                                  : `Tenggat: ${format(new Date(form.deadline), "PPp")}`
                                : "Tanpa Tenggat Waktu"}
                            </span>
                          </div>
                        {isDeadlinePassed && form.allowLate && !form.hasSubmitted && (
                          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span>Mengizinkan pengumpulan terlambat</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <Link href={`/public/form/${form.slug}`} target="_blank" className="flex-1">
                          <Button
                            className="w-full gap-1.5 justify-center group text-sm font-semibold"
                            variant={form.hasSubmitted ? "outline" : isClosed ? "outline" : "default"}
                            disabled={isClosed && !form.hasSubmitted}
                          >
                            {form.hasSubmitted ? "Lihat Pengumpulan" : isClosed ? "Pengumpulan Ditutup" : "Mulai Mengerjakan"}
                            {!isClosed && !form.hasSubmitted && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                            {form.hasSubmitted && <Eye className="h-4 w-4 transition-transform group-hover:scale-110" />}
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 shrink-0 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-950 dark:hover:bg-emerald-950/30"
                          title="Salin pengingat tugas ke WA Group"
                          onClick={() => {
                            const deadlineText = form.deadline ? format(new Date(form.deadline), "PPp") : "Tanpa Tenggat Waktu";
                            const liveLink = typeof window !== "undefined" ? `${window.location.origin}/public/form/${form.slug}` : `/public/form/${form.slug}`;
                            const text = `📢 *PENGINGAT TUGAS CLASS* 📢\n\n📌 *Tugas:* ${form.title}\n⏰ *Tenggat Waktu:* ${deadlineText}\n\n👉 *Silakan kumpulkan tugas melalui link berikut:*\n${liveLink}`;
                            navigator.clipboard.writeText(text);
                            toast.success("Format pengingat WA disalin! Siap ditempel ke Grup WA.");
                          }}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
        </div>
      </main>
    </div>
  );
}
