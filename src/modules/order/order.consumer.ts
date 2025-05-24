import { Controller, Logger } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../../entities/order.entity';

@Controller()
export class OrderConsumer {
  private readonly logger = new Logger(OrderConsumer.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  @EventPattern('process_order')
  async handleOrderProcessing(order: Order) {
    this.logger.log(`Starting processing for order ${order.orderId}`);
    
    try {
      // Mock processing stages with delays
      await this.validateAddress(order);
      await this.checkInventory(order);
      await this.calculateShipping(order);
      await this.assessRisk(order);

      order.status = OrderStatus.COMPLETED;
      await this.orderRepository.save(order);
      this.logger.log(`Successfully completed processing order ${order.orderId}`);
    } catch (error) {
      order.status = OrderStatus.FAILED;
      order.errorReason = error.message;
      await this.orderRepository.save(order);
      this.logger.error(
        `Failed to process order ${order.orderId}: ${error.message}`,
        error.stack,
      );
    }
  }

  private async validateAddress(order: Order): Promise<void> {
    this.logger.debug(`Validating address for order ${order.orderId}`);
    try {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * 3000 + 2000),
      );
      this.logger.debug(`Address validation completed for order ${order.orderId}`);
    } catch (error) {
      this.logger.error(
        `Address validation failed for order ${order.orderId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async checkInventory(order: Order): Promise<void> {
    this.logger.debug(`Checking inventory for order ${order.orderId}`);
    try {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * 2000 + 1000),
      );
      this.logger.debug(`Inventory check completed for order ${order.orderId}`);
    } catch (error) {
      this.logger.error(
        `Inventory check failed for order ${order.orderId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async calculateShipping(order: Order): Promise<void> {
    this.logger.debug(`Calculating shipping for order ${order.orderId}`);
    try {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * 2000 + 1000),
      );
      this.logger.debug(`Shipping calculation completed for order ${order.orderId}`);
    } catch (error) {
      this.logger.error(
        `Shipping calculation failed for order ${order.orderId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async assessRisk(order: Order): Promise<void> {
    this.logger.debug(`Assessing risk for order ${order.orderId}`);
    try {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * 2000 + 1000),
      );
      this.logger.debug(`Risk assessment completed for order ${order.orderId}`);
    } catch (error) {
      this.logger.error(
        `Risk assessment failed for order ${order.orderId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
