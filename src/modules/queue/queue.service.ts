import { Injectable } from '@nestjs/common';
import { Order } from '../../entities/order.entity';
import { RabbitMQService } from './rabbitmq.service';
import { ORDER_PROCESSING_QUEUE } from 'src/modules/order/constants';

@Injectable()
export class QueueService {
  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async sendOrderForProcessing(order: Order): Promise<void> {
    await this.rabbitMQService.publishMessage(ORDER_PROCESSING_QUEUE, order);
  }
}
