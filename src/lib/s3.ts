import { basename, dirname, join } from "node:path";
import { S3 } from "@aws-sdk/client-s3";

export type UploadToS3Props = {
  accessKey: string;
  secretKey: string;
  endpoint: string;
  bucketName: string;
  region: string;
};
export async function getS3Client({
  accessKey,
  endpoint,
  region,
  secretKey,
  bucketName,
}: UploadToS3Props) {
  const s3Client = new S3({
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
    region,
    endpoint,
    forcePathStyle: true,
  });

  await s3Client.headBucket({ Bucket: bucketName });

  return {
    upload: (filename: string, data: string) => {
      return s3Client.putObject({
        Bucket: bucketName,
        Key: filename,
        Body: data,
      });
    },
    list: async (dirName: string) => {
      const { Contents } = await s3Client.listObjects({
        Bucket: bucketName,
        Prefix: dirName,
      });
      if (!Contents) {
        return [];
      }
      return Contents.reduce(
        (prev, file) => (file.Key ? prev.concat(file.Key) : prev),
        [] as string[],
      );
    },
    download: async (filename: string) => {
      const { Body } = await s3Client.getObject({
        Bucket: bucketName,
        Key: filename,
      });
      if (!Body) {
        throw new Error("getObject: no result");
      }
      return Body.transformToString("utf8");
    },
    archive: async (filename: string) => {
      await s3Client.copyObject({
        Bucket: bucketName,
        CopySource: `${bucketName}/${filename}`,
        Key: join(
          "`_archives",
          dirname(filename),
          `${new Date().toISOString()}_${basename(filename)}`,
        ),
      });
      await s3Client.deleteObject({
        Bucket: bucketName,
        Key: filename,
      });
    },
  };
}

export type S3Client = Awaited<ReturnType<typeof getS3Client>>;
