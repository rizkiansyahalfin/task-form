import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

interface RouteParams {
  params: Promise<{ fileKey: string[] }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { fileKey } = await params;

    // Prevent path traversal segments
    if (fileKey.some((segment) => segment === ".." || segment === ".")) {
      return NextResponse.json({ success: false, message: "Invalid file path" }, { status: 400 });
    }

    const relativePath = fileKey.join("/");
    const baseDir = path.join(process.cwd(), "public");
    const filePath = path.resolve(baseDir, relativePath);

    // Ensure the resolved path remains inside the public directory
    if (!filePath.startsWith(baseDir)) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
    }

    // Read file contents
    const buffer = await fs.readFile(filePath);

    // Map file extension to content type
    const ext = path.extname(relativePath).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".zip") contentType = "application/zip";
    else if (ext === ".docx") {
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${path.basename(filePath)}"`,
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: "File not found" }, { status: 404 });
  }
}
