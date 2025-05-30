import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileUpload } from '../../entities/upload.entity';
import { Order } from '../../entities/order.entity';
import { UploadResolver } from './upload.resolver';
import { UploadService } from './upload.service';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [TypeOrmModule.forFeature([FileUpload, Order]), QueueModule],
  providers: [UploadResolver, UploadService],
})
export class UploadModule {}
