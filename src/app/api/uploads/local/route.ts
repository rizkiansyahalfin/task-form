import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fileKey = request.headers.get("x-file-key") || searchParams.get("fileKey");

    if (!fileKey) {
      return NextResponse.json(
        { success: false, message: "File key is required" },
        { status: 400 }
      );
    }

    const arrayBuffer = await request.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Build the absolute path to save inside process.cwd()/public/
    const filePath = path.join(process.cwd(), "public", fileKey);

    // Ensure the parent directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Write file to local disk
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({ success: true, message: "File uploaded successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
