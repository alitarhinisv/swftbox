import { Injectable } from '@nestjs/common';
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
  constructor(
    @InjectRepository(FileUpload)
    private uploadRepository: Repository<FileUpload>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private queueService: QueueService,
  ) {}

  async processUpload(filePath: string, filename: string): Promise<FileUpload> {
    // First parse the CSV file to get the orders
    const upload = new FileUpload();
    upload.filename = filename;
    upload.status = UploadProcessingStatus.PENDING;

    // Parse CSV first to get total orders
    const orders = await this.parseCsvFile(filePath, upload);
    upload.totalOrders = orders.length;

    // Now save the upload with the total orders count
    const savedUpload = await this.uploadRepository.save(upload);

    // Start processing orders
    this.processOrders(orders);

    return savedUpload;
  }

  private async parseCsvFile(
    filePath: string,
    upload: FileUpload,
  ): Promise<Order[]> {
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
        .on('end', () => resolve(orders))
        .on('error', reject);
    });
  }

  private async processOrders(orders: Order[]) {
    // Save all orders first
    await this.orderRepository.save(orders);

    // Send each order to the queue
    for (const order of orders) {
      try {
        order.status = OrderStatus.PROCESSING;
        await this.orderRepository.save(order);

        // Send to RabbitMQ and wait for confirmation
        await this.queueService.sendOrderForProcessing(order).toPromise();
      } catch (error) {
        order.status = OrderStatus.FAILED;
        order.errorReason = error.message;
        await this.orderRepository.save(order);
      }
    }
  }

  async getUploadStatus(uploadId: string): Promise<FileUpload> {
    const upload = await this.uploadRepository.findOne({
      where: { id: uploadId },
      relations: ['orders'],
    });

    if (!upload) {
      throw new Error(`Upload with ID ${uploadId} not found`);
    }

    return upload;
  }

  async getOrders(
    uploadId: string,
    status?: string,
    limit = 20,
  ): Promise<Order[]> {
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
