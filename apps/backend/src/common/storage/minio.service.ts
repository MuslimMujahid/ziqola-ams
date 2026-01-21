import { Injectable } from "@nestjs/common";
import { Client } from "minio";

@Injectable()
export class MinioService {
  private readonly client: Client;
  private readonly bucket: string;

  constructor() {
    const endpoint = process.env.MINIO_ENDPOINT ?? "localhost";
    const port = Number(process.env.MINIO_PORT ?? 9000);
    const useSSL = String(process.env.MINIO_USE_SSL ?? "false") === "true";
    const accessKey = process.env.MINIO_ACCESS_KEY ?? "";
    const secretKey = process.env.MINIO_SECRET_KEY ?? "";

    this.bucket = process.env.MINIO_BUCKET ?? "session-materials";

    this.client = new Client({
      endPoint: endpoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });
  }

  getBucketName() {
    return this.bucket;
  }

  async getPresignedUploadUrl(params: {
    objectKey: string;
    contentType: string;
    expirySeconds?: number;
  }) {
    const expirySeconds = params.expirySeconds ?? 15 * 60;
    return this.client.presignedPutObject(
      this.bucket,
      params.objectKey,
      expirySeconds,
      {
        "Content-Type": params.contentType,
      },
    );
  }

  async getPresignedDownloadUrl(params: {
    objectKey: string;
    expirySeconds?: number;
  }) {
    const expirySeconds = params.expirySeconds ?? 15 * 60;
    return this.client.presignedGetObject(
      this.bucket,
      params.objectKey,
      expirySeconds,
    );
  }
}
