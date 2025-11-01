import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, PutObjectCommand, PutObjectCommandInput, S3Client } from "@aws-sdk/client-s3";
import fs, { ReadStream } from "node:fs";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";

interface IS3PutObjectCommand extends PutObjectCommandInput {
  Body: string | Buffer | ReadStream;
}
export class S3ClientService {
  private s3Client = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });

  async getFileWithSignUrl(key: string, expiresIn: number = 60) {
    const getCommend = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME as string,
      Key: key,
    });
    return await getSignedUrl(this.s3Client, getCommend, { expiresIn });
  }

  async uploadFileOns3(file: Express.Multer.File, key: string) {
    const keyName = `${process.env.AWS_KEY_FOLDER}/${key}/${Date.now()}-${file.originalname}`;

    const params: IS3PutObjectCommand = {
      Bucket: process.env.BUCKET_NAME as string,
      Key: keyName,
      Body: fs.createReadStream(file.path),
      ContentType: file.mimetype,
    };
    const putCommend = new PutObjectCommand(params);
    console.log(putCommend);
    await this.s3Client.send(putCommend);
    const signedUrl = await this.getFileWithSignUrl(keyName, 60 * 60 * 24 * 7);
    return {
      key: keyName,
      url: signedUrl,
    };
  }

  async DeleteFileFromS3(key: string) {
    const deleteParams = {
      Bucket: process.env.BUCKET_NAME as string,
      Key: key,
    };
    const deleteCommand = new DeleteObjectCommand(deleteParams);
    return await this.s3Client.send(deleteCommand);
  }

  async DeleteBulkFroms3(key: string[]) {
    const deleteParams = {
      Bucket: process.env.BUCKET_NAME as string,
      Delete: {
        Objects: key.map((k) => ({ Key: k })),
      },
    };
    const deleteCommand = new DeleteObjectsCommand(deleteParams);
    return await this.s3Client.send(deleteCommand);
  }

  async uploadLargeFileOnS3(file: Express.Multer.File, key: string) {
    const keyName = `${process.env.AWS_KEY_FOLDER}/${key}/${Date.now()}-${file.originalname}`;

    const params: IS3PutObjectCommand = {
      Bucket: process.env.BUCKET_NAME as string,
      Key: keyName,
      Body: fs.createReadStream(file.path),
      ContentType: file.mimetype,
    };

    const upload = new Upload({
      client: this.s3Client,
      params,
      partSize: 5 * 1024 * 1024,
      queueSize: 4,
    });

    upload.on("httpUploadProgress", (progress) => {
      console.log(`Uploaded ${progress.loaded} of ${progress.total}`);
    });

    return await upload.done();
  }
}
