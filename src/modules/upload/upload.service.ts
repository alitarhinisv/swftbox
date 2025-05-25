import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import {
  FileUpload,
  UploadProcessingStatus,
} from '../../entities/upload.entity';
import { Order, OrderStatus } from '../../entities/order.entity';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    @InjectRepository(FileUpload)
    private uploadRepository: Repository<FileUpload>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private queueService: QueueService,
  ) {}

  async processUpload(filePath: string, filename: string): Promise<FileUpload> {
    this.logger.log(`Processing upload: ${filename}`);

    const upload = new FileUpload();
    upload.filename = filename;
    upload.status = UploadProcessingStatus.PENDING;

    upload.status = UploadProcessingStatus.PROCESSING;

    const orders = await this.parseCsvFile(filePath, upload);
    upload.totalOrders = orders.length;

    this.logger.log(`Found ${orders.length} orders in ${filename}`);
    upload.status = UploadProcessingStatus.COMPLETED;

    const savedUpload = await this.uploadRepository.save(upload);
    this.logger.debug(`Saved upload record with ID: ${savedUpload.id}`);

    this.processOrders(orders);

    return savedUpload;
  }

  private async parseCsvFile(
    filePath: string,
    upload: FileUpload,
  ): Promise<Order[]> {
    this.logger.debug(`Parsing CSV file: ${filePath}`);

    return new Promise((resolve, reject) => {
      const orders: Order[] = [];
      createReadStream(filePath)
        .pipe(parse({ columns: true, skip_empty_lines: true }))
        .on('data', (row) => {
          const order = new Order();
          order.orderId = row.order_id;
          order.customerEmail = row.customer_email;
          order.productSku = row.product_sku;
          order.quantity = parseInt(row.quantity);
          order.address = row.address;
          order.city = row.city;
          order.status = OrderStatus.PENDING;
          order.upload = upload;
          orders.push(order);
        })
        .on('end', () => {
          this.logger.debug(`Finished parsing CSV file: ${filePath}`);
          resolve(orders);
        })
        .on('error', (error) => {
          this.logger.error(`Error parsing CSV file: ${filePath}`, error.stack);
          reject(error);
        });
    });
  }

  private async processOrders(orders: Order[]) {
    this.logger.log(`Starting to process ${orders.length} orders`);

    await this.orderRepository.save(orders);
    this.logger.debug('Saved all orders to database');

    for (const order of orders) {
      try {
        order.status = OrderStatus.PROCESSING;
        await this.orderRepository.save(order);
        this.logger.debug(`Sending order ${order.orderId} to processing queue`);

        await this.queueService.sendOrderForProcessing(order).toPromise();
        this.logger.debug(`Successfully queued order ${order.orderId}`);
      } catch (error) {
        order.status = OrderStatus.FAILED;
        order.errorReason = error.message;
        await this.orderRepository.save(order);
        this.logger.error(
          `Failed to queue order ${order.orderId}: ${error.message}`,
          error.stack,
        );
      }
    }
  }

  async getUploadStatus(uploadId: string): Promise<FileUpload> {
    this.logger.debug(`Fetching status for upload: ${uploadId}`);

    const upload = await this.uploadRepository.findOne({
      where: { id: uploadId },
      relations: ['orders'],
    });

    if (!upload) {
      this.logger.warn(`Upload with ID ${uploadId} not found`);
      throw new Error(`Upload with ID ${uploadId} not found`);
    }

    return upload;
  }

  async getOrders(
    uploadId: string,
    status?: string,
    limit = 20,
  ): Promise<Order[]> {
    this.logger.debug(
      `Fetching orders for upload ${uploadId} with status ${status || 'ALL'} (limit: ${limit})`,
    );

    const query = this.orderRepository
      .createQueryBuilder('order')
      .where('order.uploadId = :uploadId', { uploadId })
      .take(limit);

    if (status) {
      query.andWhere('order.status = :status', { status });
    }

    return query.getMany();
  }
}
