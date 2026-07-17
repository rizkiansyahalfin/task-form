"use client";

import { use, useState, useEffect } from "react";
import {
  Calendar,
  AlertTriangle,
  UploadCloud,
  CheckCircle,
  FileCheck,
  Loader2,
  Lock,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { usePublicForm, useSubmitForm } from "@/hooks/use-forms";
import { useStudentSubmission } from "@/hooks/use-submissions";
import { useSession } from "@/lib/auth-client";
import type { FormFieldWithOptions, FormFieldOptionItem, SubmissionAnswerItem, SubmissionFileItem } from "@/types";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function PublicFormPage({ params }: PageProps) {
  const { slug } = use(params);

  // Queries
  const { data: form, isLoading, error } = usePublicForm(slug);
  const submitFormMutation = useSubmitForm(slug);
  const { data: session, isPending: isSessionPending } = useSession();

  // Check if student is logged in and fetch their submission
  const isLoggedInStudent = session?.user && (session.user as { role?: string }).role === "student";
  const { data: studentSubmission, isLoading: isSubmissionLoading } = useStudentSubmission({
    slug: isLoggedInStudent ? slug : undefined,
  });

  // Form State
  const [email, setEmail] = useState("");

  // Pre-fill email from session if logged in
  useEffect(() => {
    if (session?.user?.email) {
      const timer = setTimeout(() => {
        setEmail((prev) => prev || session.user.email || "");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [session]);
  const [answers, setAnswers] = useState<Record<string, { value?: string; values?: string[] }>>({});
  const [files, setFiles] = useState<Record<string, { fileKey: string; fileName: string; mimeType: string; fileSize: number }>>({});
  
  // UI States
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [uploadingFieldId, setUploadingFieldId] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const isDeadlinePassed = form?.deadline ? new Date() > new Date(form.deadline) : false;
  const isClosed = isDeadlinePassed && !form?.allowLate;

  // Set default values when form loads
  useState(() => {
    if (form) {
      const initialAnswers: typeof answers = {};
      form.fields.forEach((field) => {
        if (field.defaultValue) {
          initialAnswers[field.id] = { value: field.defaultValue };
        }
      });
      setAnswers(initialAnswers);
    }
  });

  const handleInputChange = (fieldId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [fieldId]: { ...prev[fieldId], value }
    }));
  };

  const handleCheckboxChange = (fieldId: string, optionValue: string, checked: boolean) => {
    const currentValues = answers[fieldId]?.values || [];
    const nextValues = checked
      ? [...currentValues, optionValue]
      : currentValues.filter((v) => v !== optionValue);

    setAnswers((prev) => ({
      ...prev,
      [fieldId]: { ...prev[fieldId], values: nextValues }
    }));
  };

  const handleFileUpload = async (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFieldId(fieldId);

    try {
      // 1. Get signed upload URL from backend
      const res = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          folder: "submissions"
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to initiate file upload");
      }

      const { uploadUrl, fileKey } = data.data;

      // 2. Perform direct PUT upload to R2/S3 (or local api fallback)
      const uploadRes = await fetch(`${uploadUrl}?fileKey=${encodeURIComponent(fileKey)}`, {
        method: "PUT",
        headers: {
          "Content-Type": file.type
        },
        body: file
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file contents");
      }

      // 3. Save uploaded file info to page state
      setFiles((prev) => ({
        ...prev,
        [fieldId]: {
          fileKey,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size
        }
      }));

      toast.success(`File "${file.name}" uploaded successfully!`);
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "File upload failed");
    } finally {
      setUploadingFieldId(null);
    }
  };

  // Step 1: Validate and open confirmation dialog
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (form?.collectEmail && !email.trim()) {
      toast.error("Alamat email wajib diisi");
      return;
    }

    // Check required fields
    for (const field of form?.fields || []) {
      if (["HEADING", "DIVIDER"].includes(field.type)) continue;

      const isRequired = field.required;
      if (isRequired) {
        const answer = answers[field.id];
        const file = files[field.id];
        
        const hasAnswer =
          (answer?.value && answer.value.trim()) ||
          (answer?.values && answer.values.length > 0) ||
          file;

        if (!hasAnswer) {
          toast.error(`Pertanyaan "${field.label}" wajib diisi`);
          return;
        }
      }
    }

    // All validation passed — open confirmation dialog
    setShowConfirmDialog(true);
  };

  // Step 2: User confirmed — run actual submission
  const handleConfirmedSubmit = async () => {
    setShowConfirmDialog(false);
    try {
      // Build answers array format for API
      const formattedAnswers = Object.entries(answers).map(([fieldId, ans]) => ({
        fieldId,
        value: ans.value || null,
        values: ans.values || []
      }));

      // Build files array format for API
      const formattedFiles = Object.entries(files).map(([fieldId, f]) => ({
        fieldId,
        ...f
      }));

      const payload = {
        email: email || session?.user?.email || null,
        answers: formattedAnswers,
        files: formattedFiles
      };

      await submitFormMutation.mutateAsync(payload);
      setIsSubmitted(true);
      toast.success("Jawaban berhasil dikumpulkan!");
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Gagal mengumpulkan jawaban");
    }
  };

  if (isLoading || isSubmissionLoading) {
    return (
      <>
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
          <Card className="w-full max-w-2xl">
            <CardHeader className="space-y-3">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (error || !form || form.status !== "PUBLISHED") {
    return (
      <>
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <Lock className="mx-auto h-12 w-12 text-destructive mb-3" />
              <CardTitle>Formulir Tidak Tersedia</CardTitle>
              <CardDescription>
                Formulir tugas ini tidak tersedia, belum diterbitkan, atau tidak ditemukan.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </>
    );
  }

  if (studentSubmission) {
    return (
      <>
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold tracking-tight">{form.title}</CardTitle>
              {form.description && (
                <CardDescription className="mt-2 text-sm">
                  {form.description}
                </CardDescription>
              )}
            </CardHeader>
          </Card>

          {/* Status Alert Banner */}
          {studentSubmission.status === "COMPLETED" && (
            <Alert className="bg-green-50 border-green-200 text-green-800 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/50">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="font-semibold text-green-800 dark:text-green-400">Tugas Selesai</AlertTitle>
              <AlertDescription className="text-xs">
                Tugas Anda telah diperiksa dan disetujui oleh mentor. Kerja bagus!
              </AlertDescription>
            </Alert>
          )}

          {studentSubmission.status === "REVIEWED" && (
            <Alert className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50">
              <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="font-semibold text-blue-850 dark:text-blue-400">Tugas Ditinjau</AlertTitle>
              <AlertDescription className="text-xs">
                Tugas Anda telah dikumpulkan dan sedang dalam peninjauan oleh mentor.
              </AlertDescription>
            </Alert>
          )}

          {studentSubmission.status === "REVISION" && (
            <Alert className="bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-pulse" />
              <AlertTitle className="font-semibold text-amber-800 dark:text-amber-400">Perlu Revisi</AlertTitle>
              <AlertDescription className="text-xs">
                Mentor meminta revisi untuk tugas ini. Silakan periksa masukan atau hubungi mentor Anda.
              </AlertDescription>
            </Alert>
          )}

          {(studentSubmission.status === "SUBMITTED" || studentSubmission.status === "LATE") && (
            <Alert className="bg-zinc-100 border-zinc-200 text-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400 dark:border-zinc-800">
              <FileCheck className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              <AlertTitle className="font-semibold text-zinc-800 dark:text-zinc-400">Sudah Dikumpulkan</AlertTitle>
              <AlertDescription className="text-xs">
                Tugas telah dikumpulkan pada {format(new Date(studentSubmission.submittedAt), "PPp")}.
                {studentSubmission.status === "LATE" && " (Terlambat)"}
              </AlertDescription>
            </Alert>
          )}

          {/* Submission Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold tracking-tight px-1">Jawaban Anda</h3>
            {form.fields.map((field: FormFieldWithOptions) => {
              if (["HEADING", "DIVIDER"].includes(field.type)) {
                if (field.type === "HEADING") {
                  return (
                    <h4 key={field.id} className="text-base font-bold pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                      {field.label}
                    </h4>
                  );
                }
                return <Separator key={field.id} className="my-6" />;
              }

              const answer = studentSubmission.answers.find((a: SubmissionAnswerItem) => a.fieldId === field.id);
              const answerFiles = studentSubmission.files.filter((f: SubmissionFileItem) => f.fieldId === field.id);

              return (
                <Card key={field.id} className="bg-card">
                  <CardHeader className="pb-3">
                    <Label className="text-sm font-semibold">{field.label}</Label>
                    {field.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{field.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="text-sm">
                    {/* Render Text / Short text / Paragraph / Select */}
                    {answer?.value && !["RADIO", "CHECKBOX", "DROPDOWN", "FILE_UPLOAD", "IMAGE_UPLOAD"].includes(field.type) && (
                      <p className="p-3 border rounded-lg bg-zinc-50/50 dark:bg-zinc-900/20 whitespace-pre-wrap">
                        {answer.value}
                      </p>
                    )}

                    {/* Dropdown / Radio */}
                    {["RADIO", "DROPDOWN"].includes(field.type) && answer?.value && (
                      <p className="p-3 border rounded-lg bg-zinc-50/50 dark:bg-zinc-900/20">
                        {field.options?.find((opt: FormFieldOptionItem) => opt.value === answer.value)?.label || answer.value}
                      </p>
                    )}

                    {field.type === "CHECKBOX" && answer && answer.values && answer.values.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {answer.values.map((v: string, idx: number) => {
                          const optionLabel = field.options?.find((opt: FormFieldOptionItem) => opt.value === v)?.label || v;
                          return (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {optionLabel}
                            </Badge>
                          );
                        })}
                      </div>
                    )}

                    {/* Files */}
                    {answerFiles.length > 0 && (
                      <div className="space-y-2">
                        {answerFiles.map((file: SubmissionFileItem) => (
                          <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg bg-zinc-50/50 dark:bg-zinc-900/20">
                            <div className="flex items-center gap-2 truncate pr-4">
                              <FileCheck className="h-5 w-5 text-green-600 shrink-0" />
                              <span className="truncate font-medium text-xs">{file.fileName}</span>
                            </div>
                            {file.url && (
                              <Link href={file.url} target="_blank">
                                <Button variant="outline" size="sm" className="h-7 text-xs">
                                  Unduh
                                </Button>
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Empty state for this field */}
                    {!answer?.value && (!answer?.values || answer.values.length === 0) && answerFiles.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">Tidak ada jawaban.</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center pt-4">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full sm:w-auto">
                Kembali ke Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
      </>
    );
  }

  if (isSubmitted) {
    return (
      <>
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
          <Card className="w-full max-w-xl text-center py-8">
            <CardHeader>
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-3" />
              <CardTitle className="text-3xl">{form.successTitle || "Thank you!"}</CardTitle>
              <CardDescription className="text-lg mt-2">
                {form.successMessage || "Your submission has been received."}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Login Recommendation Banner */}
        {!isSessionPending && !session && showLoginPrompt && (
          <Alert className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="font-semibold text-blue-850 dark:text-blue-400">Disarankan Login</AlertTitle>
            <AlertDescription className="text-sm mt-1">
              Login dengan akun santri untuk melacak status pengumpulan tugas. Anda tetap bisa mengumpulkan tanpa login.
            </AlertDescription>
            <div className="mt-3 flex items-center gap-2">
              <Link href={`/login?redirect=${encodeURIComponent(`/public/form/${slug}`)}`}>
                <Button size="sm" className="h-8">
                  Login
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowLoginPrompt(false)}
              >
                Lanjutkan Tanpa Login
              </Button>
            </div>
          </Alert>
        )}

        {/* Form Meta Alert */}
        {isDeadlinePassed && form.allowLate && (
          <Alert className="bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-400" />
            <AlertTitle>Pengumpulan Terlambat Diizinkan</AlertTitle>
            <AlertDescription>
              Tenggat formulir ini telah lewat ({format(new Date(form.deadline!), "PPp")}), namun pengumpulan terlambat masih diterima.
            </AlertDescription>
          </Alert>
        )}

        {isClosed && (
          <Alert variant="destructive">
            <Lock className="h-4 w-4" />
            <AlertTitle>Pengumpulan Ditutup</AlertTitle>
            <AlertDescription>
              Tugas ini sudah ditutup. Tenggat waktu adalah {format(new Date(form.deadline!), "PPp")} dan pengumpulan terlambat tidak diizinkan.
            </AlertDescription>
          </Alert>
        )}

        {/* Form Title & Description Card */}
        <Card className="border-t-8 border-t-primary">
          <CardHeader>
            <CardTitle className="text-3xl">{form.title}</CardTitle>
            <CardDescription className="text-base mt-2">
              {form.description || "Silakan isi pertanyaan di bawah ini."}
            </CardDescription>
            {form.deadline && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
                <Calendar className="h-4 w-4" />
                <span>Tenggat: {format(new Date(form.deadline), "PPp")}</span>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Questions Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {form.collectEmail && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-semibold">
                    Alamat Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@santri.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isClosed}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {form.fields.map((field) => {
            if (field.type === "HEADING") {
              return (
                <div key={field.id} className="pt-4 pb-2">
                  <h3 className="text-xl font-bold tracking-tight">{field.label}</h3>
                  {field.description && <p className="text-sm text-muted-foreground mt-1">{field.description}</p>}
                </div>
              );
            }

            if (field.type === "DIVIDER") {
              return <Separator key={field.id} className="my-6" />;
            }

            return (
              <Card key={field.id}>
                <CardContent className="pt-6 space-y-3">
                  <Label className="text-base font-semibold block">
                    {field.label} {field.required && <span className="text-destructive">*</span>}
                  </Label>
                  {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}

                  {/* Render Short Text */}
                  {["SHORT_TEXT", "EMAIL", "PHONE", "URL", "GITHUB_URL", "DEPLOY_URL"].includes(field.type) && (
                    <Input
                      type={field.type === "NUMBER" ? "number" : "text"}
                      placeholder={field.placeholder || ""}
                      value={answers[field.id]?.value || ""}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      disabled={isClosed}
                    />
                  )}

                  {/* Render Paragraph/Textarea */}
                  {(field.type === "TEXTAREA" || field.type === "PARAGRAPH") && (
                    <Textarea
                      placeholder={field.placeholder || ""}
                      rows={4}
                      value={answers[field.id]?.value || ""}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      disabled={isClosed}
                    />
                  )}

                  {/* Render Number */}
                  {field.type === "NUMBER" && (
                    <Input
                      type="number"
                      placeholder={field.placeholder || ""}
                      value={answers[field.id]?.value || ""}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      disabled={isClosed}
                    />
                  )}

                  {/* Render Date */}
                  {field.type === "DATE" && (
                    <Input
                      type="date"
                      value={answers[field.id]?.value || ""}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      disabled={isClosed}
                    />
                  )}

                  {/* Render Radio Group */}
                  {field.type === "RADIO" && (
                    <RadioGroup
                      value={answers[field.id]?.value || ""}
                      onValueChange={(val) => handleInputChange(field.id, val)}
                      disabled={isClosed}
                    >
                      {field.options?.map((opt) => (
                        <div key={opt.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt.value} id={opt.id} />
                          <Label htmlFor={opt.id} className="font-normal cursor-pointer">
                            {opt.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {/* Render Checkbox */}
                  {field.type === "CHECKBOX" && (
                    <div className="space-y-2">
                      {field.options?.map((opt) => (
                        <div key={opt.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={opt.id}
                            checked={answers[field.id]?.values?.includes(opt.value) || false}
                            onCheckedChange={(checked) =>
                              handleCheckboxChange(field.id, opt.value, !!checked)
                            }
                            disabled={isClosed}
                          />
                          <Label htmlFor={opt.id} className="font-normal cursor-pointer">
                            {opt.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Render Dropdown */}
                  {field.type === "DROPDOWN" && (
                    <Select
                      value={answers[field.id]?.value || ""}
                      onValueChange={(val) => handleInputChange(field.id, val || "")}
                      disabled={isClosed}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={field.placeholder || "Select option"} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((opt) => (
                          <SelectItem key={opt.id} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Render File & Image Upload */}
                  {["FILE_UPLOAD", "IMAGE_UPLOAD"].includes(field.type) && (
                    <div className="space-y-3">
                      {files[field.id] ? (
                        <div className="flex items-center gap-3 border rounded-lg p-3 bg-zinc-50 dark:bg-zinc-900">
                          <FileCheck className="h-8 w-8 text-green-500" />
                          <div className="flex-1 truncate">
                            <p className="text-sm font-medium truncate">
                              {files[field.id].fileName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Uploaded ({(files[field.id].fileSize / (1024 * 1024)).toFixed(2)} MB)
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              const nextFiles = { ...files };
                              delete nextFiles[field.id];
                              setFiles(nextFiles);
                            }}
                            disabled={isClosed}
                          >
                            Hapus
                          </Button>
                        </div>
                      ) : (
                        <div className="relative border-2 border-dashed rounded-lg p-6 text-center hover:bg-zinc-50/50 cursor-pointer">
                          <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            accept={field.type === "IMAGE_UPLOAD" ? "image/*" : undefined}
                            onChange={(e) => handleFileUpload(field.id, e)}
                            disabled={isClosed || uploadingFieldId !== null}
                          />
                          {uploadingFieldId === field.id ? (
                            <div className="flex flex-col items-center justify-center">
                              <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                              <p className="text-sm font-medium">Mengunggah file...</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center">
                              <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                              <p className="text-sm font-medium text-primary hover:underline">
                                Klik untuk mengunggah file
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {field.type === "IMAGE_UPLOAD" ? "Hanya gambar" : "Semua tipe file diizinkan"} (Maks 10MB)
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold"
            disabled={isClosed || submitFormMutation.isPending}
          >
            {submitFormMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Mengirim...
              </>
            ) : (
              "Kirim Jawaban"
            )}
          </Button>
        </form>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Konfirmasi Pengumpulan</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin mengumpulkan jawaban ini? Pastikan semua jawaban sudah benar sebelum mengirim.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                disabled={submitFormMutation.isPending}
                className="w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button
                onClick={handleConfirmedSubmit}
                disabled={submitFormMutation.isPending}
                className="w-full sm:w-auto"
              >
                {submitFormMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengirim...</>
                ) : (
                  "Ya, Kirim Sekarang"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    </>
  );
}
