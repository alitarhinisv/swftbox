import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../../entities/order.entity';

@Controller()
export class OrderConsumer {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  @EventPattern('process_order')
  async handleOrderProcessing(order: Order) {
    try {
      // Mock processing stages with delays
      await this.validateAddress(order);
      await this.checkInventory(order);
      await this.calculateShipping(order);
      await this.assessRisk(order);

      order.status = OrderStatus.COMPLETED;
      await this.orderRepository.save(order);
    } catch (error) {
      order.status = OrderStatus.FAILED;
      order.errorReason = error.message;
      await this.orderRepository.save(order);
    }
  }

  private async validateAddress(order: Order): Promise<void> {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 3000 + 2000),
    );
  }

  private async checkInventory(order: Order): Promise<void> {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 2000 + 1000),
    );
  }

  private async calculateShipping(order: Order): Promise<void> {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 2000 + 1000),
    );
  }

  private async assessRisk(order: Order): Promise<void> {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 2000 + 1000),
    );
  }
}
