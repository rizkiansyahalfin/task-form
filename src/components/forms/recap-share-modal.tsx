"use client";

import { useState, useEffect, useMemo } from "react";
import {
  MessageCircle,
  Copy,
  Send,
  Check,
  Loader2,
  CheckSquare,
  Square,
  Users,
  FileText
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useMultiFormProgress } from "@/hooks/use-forms";
import { formatDate } from "@/utils";

interface RecapShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormatType = "per-student" | "per-task";

export function RecapShareModal({ open, onOpenChange }: RecapShareModalProps) {
  const { data: recapData, isLoading } = useMultiFormProgress(open);

  const [selectedFormIds, setSelectedFormIds] = useState<string[]>([]);
  const [formatType, setFormatType] = useState<FormatType>("per-student");
  const [copied, setCopied] = useState(false);

  // Initialize selected form IDs when recapData is loaded
  useEffect(() => {
    if (recapData?.forms) {
      setSelectedFormIds(recapData.forms.map((f) => f.id));
    }
  }, [recapData]);

  const publishedForms = recapData?.forms || [];
  const students = recapData?.students || [];

  // Toggle selection for a single form
  const toggleForm = (id: string) => {
    setSelectedFormIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle select all forms
  const toggleSelectAll = () => {
    if (selectedFormIds.length === publishedForms.length) {
      setSelectedFormIds([]);
    } else {
      setSelectedFormIds(publishedForms.map((f) => f.id));
    }
  };

  // Filter selected forms
  const activeSelectedForms = useMemo(() => {
    return publishedForms.filter((f) => selectedFormIds.includes(f.id));
  }, [publishedForms, selectedFormIds]);

  // Generate WhatsApp message text based on formatType and activeSelectedForms
  const waMessage = useMemo(() => {
    if (activeSelectedForms.length === 0) {
      return "Pilih setidaknya satu tugas untuk membuat pengingat WhatsApp.";
    }

    const host = typeof window !== "undefined" ? window.location.origin : "";

    if (formatType === "per-student") {
      // Group by student
      const unsubmittedList: { name: string; missingCount: number; missingFormTitles: string[] }[] = [];

      students.forEach((student) => {
        const missing = student.unsubmittedForms.filter((uf) =>
          selectedFormIds.includes(uf.formId)
        );
        if (missing.length > 0) {
          unsubmittedList.push({
            name: student.name,
            missingCount: missing.length,
            missingFormTitles: missing.map((m) => m.formTitle),
          });
        }
      });

      let text = `📢 *REKAP PENGUMPULAN TUGAS TASKFORM* 📢\n`;
      text += `📋 Total Tugas Terdaftar: ${activeSelectedForms.length}\n\n`;

      if (unsubmittedList.length === 0) {
        text += `🎉 *Luar biasa! Semua santri sudah mengumpulkan seluruh tugas!* 🎉\n`;
      } else {
        text += `❌ *Daftar Santri Belum Mengumpulkan (${unsubmittedList.length} Santri):*\n`;
        unsubmittedList.forEach((s, idx) => {
          text += `${idx + 1}. *${s.name}* (Belum ${s.missingCount} tugas: ${s.missingFormTitles.join(", ")})\n`;
        });
      }

      text += `\n👉 *Daftar Link Tugas:*\n`;
      activeSelectedForms.forEach((f) => {
        const deadlineText = f.deadline ? ` (Deadline: ${formatDate(f.deadline)})` : "";
        text += `- ${f.title}${deadlineText}:\n  ${host}/public/form/${f.slug}\n`;
      });

      return text;
    } else {
      // Group by task
      let text = `📢 *REKAP PENGUMPULAN PER TUGAS TASKFORM* 📢\n\n`;

      activeSelectedForms.forEach((f, idx) => {
        const deadlineText = f.deadline ? ` ⏰ ${formatDate(f.deadline)}` : "";
        const unsubmittedStudentsForThisForm = students.filter((student) =>
          student.unsubmittedForms.some((uf) => uf.formId === f.id)
        );

        text += `📌 *${idx + 1}. ${f.title}*${deadlineText}\n`;

        if (unsubmittedStudentsForThisForm.length === 0) {
          text += `   ✅ (Semua santri sudah mengumpulkan!)\n`;
        } else {
          text += `   ❌ Belum (${unsubmittedStudentsForThisForm.length} santri):\n`;
          text += `   ` + unsubmittedStudentsForThisForm.map((s) => s.name).join(", ") + `\n`;
        }

        text += `   👉 Link: ${host}/public/form/${f.slug}\n\n`;
      });

      return text.trim();
    }
  }, [activeSelectedForms, publishedForms, students, selectedFormIds, formatType]);

  const handleCopyText = () => {
    navigator.clipboard.writeText(waMessage);
    setCopied(true);
    toast.success("Pesan rekap WA berhasil disalin ke clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(waMessage)}`;
    window.open(waUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
            <DialogTitle className="text-xl">Bagikan Rekap Pengumpulkan Tugas</DialogTitle>
          </div>
          <DialogDescription>
            Buat pesan pengingat WhatsApp sekaligus untuk beberapa atau seluruh tugas.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : publishedForms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="font-semibold text-base">Belum Ada Tugas Diterbitkan</p>
            <p className="text-sm mt-1 max-w-sm">
              Terbitkan minimal 1 tugas (status Published) untuk dapat membagikan rekap pengumpulan ke WhatsApp Group.
            </p>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto pr-1 py-2 flex-1">
            {/* Form selection filter */}
            <div className="space-y-2 border rounded-lg p-3 bg-zinc-50 dark:bg-zinc-900/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Pilih Tugas yang Direkap ({selectedFormIds.length}/{publishedForms.length})
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={toggleSelectAll}
                >
                  {selectedFormIds.length === publishedForms.length ? (
                    <>
                      <CheckSquare className="h-3.5 w-3.5 text-primary" /> Hapus Semua
                    </>
                  ) : (
                    <>
                      <Square className="h-3.5 w-3.5" /> Pilih Semua
                    </>
                  )}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1 max-h-[120px] overflow-y-auto">
                {publishedForms.map((f) => {
                  const isSelected = selectedFormIds.includes(f.id);
                  return (
                    <Badge
                      key={f.id}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer transition-colors text-xs py-1 px-2.5 flex items-center gap-1.5 ${
                        isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                      }`}
                      onClick={() => toggleForm(f.id)}
                    >
                      {isSelected ? <CheckSquare className="h-3 w-3" /> : <Square className="h-3 w-3" />}
                      <span className="truncate max-w-[180px]">{f.title}</span>
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Format selection */}
            <div className="flex items-center justify-between gap-4 border-b pb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Format Pesan WhatsApp
              </span>
              <div className="flex gap-1 border p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900">
                <Button
                  type="button"
                  variant={formatType === "per-student" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => setFormatType("per-student")}
                >
                  <Users className="h-3.5 w-3.5" /> Per Santri
                </Button>
                <Button
                  type="button"
                  variant={formatType === "per-task" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => setFormatType("per-task")}
                >
                  <FileText className="h-3.5 w-3.5" /> Per Tugas
                </Button>
              </div>
            </div>

            {/* Live Message Preview */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                <span>Pratinjau Pesan WA:</span>
                <span className="text-[11px] text-muted-foreground/70">
                  Pesan dapat disunting manual di bawah ini jika diperlukan
                </span>
              </label>
              <Textarea
                className="font-mono text-xs min-h-[220px] max-h-[300px] leading-relaxed bg-zinc-900 text-zinc-100 dark:bg-zinc-950 p-3 rounded-md"
                value={waMessage}
                readOnly
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2 w-full sm:w-auto"
            onClick={handleCopyText}
            disabled={isLoading || publishedForms.length === 0 || selectedFormIds.length === 0}
          >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            {copied ? "Tersalin!" : "Salin Pesan WA"}
          </Button>
          <Button
            type="button"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs w-full sm:w-auto"
            onClick={handleOpenWhatsApp}
            disabled={isLoading || publishedForms.length === 0 || selectedFormIds.length === 0}
          >
            <Send className="h-4 w-4" /> Buka WhatsApp (Direct Share)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
