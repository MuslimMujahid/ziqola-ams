declare module "minio" {
  export type ClientOptions = {
    endPoint: string;
    port?: number;
    useSSL?: boolean;
    accessKey: string;
    secretKey: string;
  };

  export class Client {
    constructor(options: ClientOptions);
    presignedPutObject(
      bucket: string,
      objectName: string,
      expiry?: number,
      reqParams?: Record<string, string>,
    ): Promise<string>;
    presignedGetObject(
      bucket: string,
      objectName: string,
      expiry?: number,
    ): Promise<string>;
  }
}
