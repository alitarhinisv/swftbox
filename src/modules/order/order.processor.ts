import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../../entities/order.entity';
import {
  OrderProcessingLog,
  ProcessingStage,
} from '../../entities/order-processing-log.entity';

@Controller()
export class OrderProcessor {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderProcessingLog)
    private readonly logRepository: Repository<OrderProcessingLog>,
  ) {}

  @EventPattern('process_order')
  async processOrder(order: Order) {
    try {
      order.status = OrderStatus.PROCESSING;
      await this.orderRepository.save(order);

      await this.processStage(order, ProcessingStage.ADDRESS_VALIDATION);
      await this.processStage(order, ProcessingStage.INVENTORY_CHECK);
      await this.processStage(order, ProcessingStage.SHIPPING_CALCULATION);
      await this.processStage(order, ProcessingStage.RISK_ASSESSMENT);

      order.status = OrderStatus.COMPLETED;
      await this.orderRepository.save(order);
    } catch (error) {
      order.status = OrderStatus.FAILED;
      order.errorReason = error.message;
      await this.orderRepository.save(order);
    }
  }

  private async processStage(order: Order, stage: ProcessingStage) {
    const log = new OrderProcessingLog();
    log.order = order;
    log.stage = stage;

    try {
      await this.executeStage(stage, order);
      log.success = true;
    } catch (error) {
      log.success = false;
      log.errorMessage = error.message;
      throw error;
    } finally {
      await this.logRepository.save(log);
    }
  }

  private async executeStage(stage: ProcessingStage, order: Order) {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 3000 + 2000),
    );

    switch (stage) {
      case ProcessingStage.ADDRESS_VALIDATION:
        break;

      case ProcessingStage.INVENTORY_CHECK:
        if (Math.random() < 0.1) {
          throw new Error('Insufficient inventory');
        }
        break;

      case ProcessingStage.SHIPPING_CALCULATION:
        break;

      case ProcessingStage.RISK_ASSESSMENT:
        if (order.quantity > 10) {
          throw new Error('High risk order detected');
        }
        break;
    }
  }
}
