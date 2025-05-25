import { Controller, Logger } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../../entities/order.entity';
import { OrderProcessorService } from './order.processor.service';

@Controller()
export class OrderConsumer {
  private readonly logger = new Logger(OrderConsumer.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private processorService: OrderProcessorService,
  ) {}

  @EventPattern('process_order')
  async handleOrderProcessing(order: Order) {
    this.logger.log(`Starting processing for order ${order.orderId}`);

    try {
      // Step 1: Validate Address
      const coordinates = await this.processorService.validateAddress(order);
      this.logger.debug(
        `Address validated for order ${order.orderId} at coordinates: ${JSON.stringify(coordinates)}`,
      );

      // Step 2: Check Inventory
      await this.processorService.checkInventory(order);
      this.logger.debug(`Inventory checked for order ${order.orderId}`);

      // Step 3: Calculate Shipping
      const shippingDetails =
        await this.processorService.calculateShipping(order);
      this.logger.debug(
        `Shipping calculated for order ${order.orderId}: ${JSON.stringify(shippingDetails)}`,
      );

      // Step 4: Assess Risk
      await this.processorService.assessRisk(order);
      this.logger.debug(`Risk assessment completed for order ${order.orderId}`);

      // Update order status to completed
      order.status = OrderStatus.COMPLETED;
      await this.orderRepository.save(order);
      this.logger.log(
        `Successfully completed processing order ${order.orderId}`,
      );
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
}
