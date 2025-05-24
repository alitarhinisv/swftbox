import { Resolver, Mutation, Query, Args, ID } from '@nestjs/graphql';
import { createWriteStream } from 'fs';
import {
  GraphQLUpload,
  FileUpload as GraphQLFileUpload,
} from 'graphql-upload-minimal';
import { UploadService } from './upload.service';
import { FileUpload } from '../../entities/upload.entity';
import { Order } from '../../entities/order.entity';

@Resolver()
export class UploadResolver {
  constructor(private readonly uploadService: UploadService) {}

  @Mutation(() => FileUpload)
  async uploadOrders(
    @Args({ name: 'file', type: () => GraphQLUpload })
    { createReadStream, filename }: GraphQLFileUpload,
  ): Promise<FileUpload> {
    const uploadDir = './uploads';
    const filePath = `${uploadDir}/${filename}`;

    // Ensure upload directory exists
    await new Promise<void>((resolve, reject) => {
      const stream = createReadStream()
        .pipe(createWriteStream(filePath))
        .on('finish', () => resolve())
        .on('error', (error) => reject(error));
    });

    return this.uploadService.processUpload(filePath, filename);
  }

  @Query(() => FileUpload)
  async getUploadStatus(
    @Args('uploadId', { type: () => ID }) uploadId: string,
  ) {
    return this.uploadService.getUploadStatus(uploadId);
  }

  @Query(() => [Order])
  async getOrders(
    @Args('uploadId', { type: () => ID }) uploadId: string,
    @Args('status', { type: () => String, nullable: true }) status?: string,
    @Args('limit', { type: () => Number, defaultValue: 20 }) limit?: number,
  ) {
    return this.uploadService.getOrders(uploadId, status, limit);
  }
}
