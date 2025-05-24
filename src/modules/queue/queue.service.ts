import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Order } from '../../entities/order.entity';

@Injectable()
export class QueueService {
  constructor(
    @Inject('ORDER_SERVICE') private readonly orderClient: ClientProxy,
  ) {}

  sendOrderForProcessing(order: Order) {
    return this.orderClient.emit('process_order', order);
  }
}
