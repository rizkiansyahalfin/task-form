"use client";

import { use, useState } from "react";
import {
  FileText,
  Calendar,
  AlertTriangle,
  UploadCloud,
  CheckCircle,
  FileCheck,
  Loader2,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
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
import { usePublicForm, useSubmitForm } from "@/hooks/use-forms";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function PublicFormPage({ params }: PageProps) {
  const { slug } = use(params);

  // Queries
  const { data: form, isLoading, error } = usePublicForm(slug);
  const submitFormMutation = useSubmitForm(slug);

  // Form State
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<Record<string, { value?: string; values?: string[] }>>({});
  const [files, setFiles] = useState<Record<string, { fileKey: string; fileName: string; mimeType: string; fileSize: number }>>({});
  
  // UI States
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [uploadingFieldId, setUploadingFieldId] = useState<string | null>(null);

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
    } catch (err: any) {
      toast.error(err.message || "File upload failed");
    } finally {
      setUploadingFieldId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form?.collectEmail && !email.trim()) {
      toast.error("Email address is required");
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
          toast.error(`Question "${field.label}" is required`);
          return;
        }
      }
    }

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
        email: email || null,
        answers: formattedAnswers,
        files: formattedFiles
      };

      await submitFormMutation.mutateAsync(payload);
      setIsSubmitted(true);
      toast.success("Submission sent successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit task form");
    }
  };

  if (isLoading) {
    return (
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
    );
  }

  if (error || !form || form.status !== "PUBLISHED") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <Lock className="mx-auto h-12 w-12 text-destructive mb-3" />
            <CardTitle>Form Unavailable</CardTitle>
            <CardDescription>
              This form task is not available, not published, or does not exist.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
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
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Form Meta Alert */}
        {isDeadlinePassed && form.allowLate && (
          <Alert className="bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-400" />
            <AlertTitle>Late Submissions Allowed</AlertTitle>
            <AlertDescription>
              The deadline for this form has passed ({format(new Date(form.deadline!), "PPp")}), but late submissions are still being accepted.
            </AlertDescription>
          </Alert>
        )}

        {isClosed && (
          <Alert variant="destructive">
            <Lock className="h-4 w-4" />
            <AlertTitle>Submissions Closed</AlertTitle>
            <AlertDescription>
              This task is closed. The deadline was {format(new Date(form.deadline!), "PPp")} and late submissions are not allowed.
            </AlertDescription>
          </Alert>
        )}

        {/* Form Title & Description Card */}
        <Card className="border-t-8 border-t-primary">
          <CardHeader>
            <CardTitle className="text-3xl">{form.title}</CardTitle>
            <CardDescription className="text-base mt-2">
              {form.description || "Please fill out the questions below."}
            </CardDescription>
            {form.deadline && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
                <Calendar className="h-4 w-4" />
                <span>Deadline: {format(new Date(form.deadline), "PPp")}</span>
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
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your-email@student.com"
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
                      onValueChange={(val) => handleInputChange(field.id, val)}
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
                            Remove
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
                              <p className="text-sm font-medium">Uploading file...</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center">
                              <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                              <p className="text-sm font-medium text-primary hover:underline">
                                Click to upload a file
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {field.type === "IMAGE_UPLOAD" ? "Images only" : "All file types allowed"} (Max 10MB)
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
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...
              </>
            ) : (
              "Submit Answers"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
