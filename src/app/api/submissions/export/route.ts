import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";
import prisma from "@/lib/prisma";
import { requireMentorAuth } from "@/server/auth";
import { enforceRateLimit } from "@/lib/rate-limiter";
import { handleApiError } from "@/lib/api-response";

function escapeCSV(val: string | null | undefined): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireMentorAuth();
    enforceRateLimit(`submissions-export:${user.id}`);

    const searchParams = request.nextUrl.searchParams;
    const formId = searchParams.get("formId");

    let csvContent = "";
    let filename = "";

    if (formId && formId !== "all") {
      // Export submissions for a specific form
      const form = await prisma.form.findFirst({
        where: {
          id: formId,
          mentorId: user.id,
          deletedAt: null,
        },
        include: {
          fields: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      });

      if (!form) {
        return NextResponse.json(
          { success: false, message: "Formulir tidak ditemukan" },
          { status: 404 }
        );
      }

      const submissions = await prisma.submission.findMany({
        where: {
          formId,
          deletedAt: null,
          form: {
            mentorId: user.id,
            deletedAt: null,
          },
        },
        include: {
          answers: true,
          files: true,
        },
        orderBy: {
          submittedAt: "desc",
        },
      });

      // Filter active fields for answer columns (ignore HEADING and DIVIDER)
      const activeFields = form.fields.filter(
        (f) => f.type !== "HEADING" && f.type !== "DIVIDER"
      );

      // Header row
      const headers = [
        "No",
        "Email/IP",
        "Status",
        "Tanggal Pengumpulan",
        ...activeFields.map((f) => f.label),
      ];
      csvContent += headers.map(escapeCSV).join(",") + "\n";

      // Data rows
      submissions.forEach((sub, idx) => {
        const row = [
          String(idx + 1),
          sub.email || sub.ipAddress || "-",
          sub.status === "COMPLETED"
            ? "Selesai"
            : sub.status === "REVIEWED"
            ? "Ditinjau"
            : sub.status === "REVISION"
            ? "Perlu Revisi"
            : sub.status === "LATE"
            ? "Terlambat"
            : "Dikumpulkan",
          format(new Date(sub.submittedAt), "yyyy-MM-dd HH:mm:ss"),
        ];

        // Map answers to the correct columns
        activeFields.forEach((field) => {
          const answer = sub.answers.find((a) => a.fieldId === field.id);
          const file = sub.files.find((f) => f.fieldId === field.id);

          if (file) {
            row.push(file.fileName);
          } else if (answer) {
            if (answer.values && answer.values.length > 0) {
              row.push(answer.values.join(", "));
            } else {
              row.push(answer.value || "");
            }
          } else {
            row.push("");
          }
        });

        csvContent += row.map(escapeCSV).join(",") + "\n";
      });

      filename = `ekspor-pengumpulan-${form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;
    } else {
      // Export all submissions for all mentor forms
      const submissions = await prisma.submission.findMany({
        where: {
          deletedAt: null,
          form: {
            mentorId: user.id,
            deletedAt: null,
          },
        },
        include: {
          form: true,
          answers: {
            include: {
              field: true,
            },
          },
          files: true,
        },
        orderBy: {
          submittedAt: "desc",
        },
      });

      // Header row
      const headers = [
        "No",
        "Formulir",
        "Email/IP",
        "Status",
        "Tanggal Pengumpulan",
        "Ringkasan Jawaban",
      ];
      csvContent += headers.map(escapeCSV).join(",") + "\n";

      // Data rows
      submissions.forEach((sub, idx) => {
        const answersSummary = sub.answers
          .filter(
            (a) =>
              a.field &&
              a.field.type !== "HEADING" &&
              a.field.type !== "DIVIDER"
          )
          .map((a) => {
            const val =
              a.values && a.values.length > 0
                ? a.values.join(", ")
                : a.value || "";
            return `${a.field.label}: ${val}`;
          });

        const filesSummary = sub.files.map((f) => `File (${f.fileName})`);
        const summaryString = [...answersSummary, ...filesSummary].join(" | ");

        const row = [
          String(idx + 1),
          sub.form.title,
          sub.email || sub.ipAddress || "-",
          sub.status === "COMPLETED"
            ? "Selesai"
            : sub.status === "REVIEWED"
            ? "Ditinjau"
            : sub.status === "REVISION"
            ? "Perlu Revisi"
            : sub.status === "LATE"
            ? "Terlambat"
            : "Dikumpulkan",
          format(new Date(sub.submittedAt), "yyyy-MM-dd HH:mm:ss"),
          summaryString,
        ];

        csvContent += row.map(escapeCSV).join(",") + "\n";
      });

      filename = "ekspor-semua-pengumpulan.csv";
    }

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
