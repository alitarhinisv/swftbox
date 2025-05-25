import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../../entities/order.entity';
import { OrderProcessorService } from './order.processor.service';
import { RabbitMQService } from '../queue/rabbitmq.service';
import { ORDER_PROCESSING_QUEUE } from 'src/modules/order/constants';

@Injectable()
export class OrderConsumer implements OnModuleInit {
  private readonly logger = new Logger(OrderConsumer.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private processorService: OrderProcessorService,
    private rabbitMQService: RabbitMQService,
  ) {}

  async onModuleInit() {
    await this.setupConsumer();
  }

  private async setupConsumer() {
    await this.rabbitMQService.consume(
      ORDER_PROCESSING_QUEUE,
      async (order: Order) => {
        this.logger.log(`Starting processing for order ${order.orderId}`);

        try {
          // Step 1: Validate Address
          const coordinates =
            await this.processorService.validateAddress(order);
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
          this.logger.debug(
            `Risk assessment completed for order ${order.orderId}`,
          );

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
      },
    );
  }
}
