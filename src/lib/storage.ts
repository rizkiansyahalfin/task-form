import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from "@/constants";
import { ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { SignedUploadUrl } from "@/types";

export interface StorageAdapter {
  getSignedUploadUrl(
    fileName: string,
    mimeType: string,
    fileSize: number,
    folder?: string,
  ): Promise<SignedUploadUrl>;
  getSignedDownloadUrl(fileKey: string, expiresIn?: number): Promise<string>;
  deleteFile(fileKey: string): Promise<void>;
  getPublicUrl(fileKey: string): string;
}

function validateFile(mimeType: string, fileSize: number): void {
  if (!ALLOWED_FILE_TYPES.includes(mimeType)) {
    throw new ValidationError(`File type ${mimeType} is not allowed`);
  }
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    throw new ValidationError(`File size exceeds maximum of ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`);
  }
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 255);
}

class R2StorageAdapter implements StorageAdapter {
  private client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    this.bucket = process.env.R2_BUCKET_NAME ?? "taskform-uploads";
    this.publicUrl = process.env.R2_PUBLIC_URL ?? "";

    if (!accountId || !accessKeyId || !secretAccessKey) {
      logger.warn("R2 credentials not configured, using local storage fallback");
    }

    this.client = new S3Client({
      region: "auto",
      endpoint: accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined,
      credentials:
        accessKeyId && secretAccessKey
          ? { accessKeyId, secretAccessKey }
          : { accessKeyId: "local", secretAccessKey: "local" },
    });
  }

  async getSignedUploadUrl(
    fileName: string,
    mimeType: string,
    fileSize: number,
    folder = "uploads",
  ): Promise<SignedUploadUrl> {
    validateFile(mimeType, fileSize);

    const sanitized = sanitizeFileName(fileName);
    const fileKey = `${folder}/${Date.now()}-${sanitized}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
      ContentType: mimeType,
      ContentLength: fileSize,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 3600 });
    const publicUrl = this.getPublicUrl(fileKey);

    return { uploadUrl, fileKey, publicUrl };
  }

  async getSignedDownloadUrl(fileKey: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  async deleteFile(fileKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
    });
    await this.client.send(command);
  }

  getPublicUrl(fileKey: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl.replace(/\/$/, "")}/${fileKey}`;
    }
    return `/api/uploads/${encodeURIComponent(fileKey)}`;
  }
}

class LocalStorageAdapter implements StorageAdapter {
  async getSignedUploadUrl(
    fileName: string,
    mimeType: string,
    fileSize: number,
    folder = "uploads",
  ): Promise<SignedUploadUrl> {
    validateFile(mimeType, fileSize);
    const sanitized = sanitizeFileName(fileName);
    const fileKey = `${folder}/${Date.now()}-${sanitized}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return {
      uploadUrl: `${baseUrl}/api/uploads/local`,
      fileKey,
      publicUrl: `${baseUrl}/api/uploads/${encodeURIComponent(fileKey)}`,
    };
  }

  async getSignedDownloadUrl(fileKey: string): Promise<string> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return `${baseUrl}/api/uploads/${encodeURIComponent(fileKey)}`;
  }

  async deleteFile(_fileKey: string): Promise<void> {
    // Local dev: no-op
  }

  getPublicUrl(fileKey: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return `${baseUrl}/api/uploads/${encodeURIComponent(fileKey)}`;
  }
}

function createStorageAdapter(): StorageAdapter {
  const hasR2 =
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY;

  if (hasR2) {
    return new R2StorageAdapter();
  }
  return new LocalStorageAdapter();
}

export const storage = createStorageAdapter();
