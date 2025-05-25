import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../entities/order.entity';
import {
  OrderProcessingLog,
  ProcessingStage,
} from '../../entities/order-processing-log.entity';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ShippingDetails {
  cost: number;
  estimatedDays: number;
  provider: string;
}

@Injectable()
export class OrderProcessorService {
  private readonly logger = new Logger(OrderProcessorService.name);

  constructor(
    @InjectRepository(OrderProcessingLog)
    private readonly orderProcessingLogRepository: Repository<OrderProcessingLog>,
  ) {}

  private readonly cityCoordinates: Record<string, Coordinates> = {
    'New York': { lat: 40.7128, lng: -74.006 },
    'Los Angeles': { lat: 34.0522, lng: -118.2437 },
    Chicago: { lat: 41.8781, lng: -87.6298 },
    Dubai: { lat: 25.2048, lng: 55.2708 }, // Fixed coordinates
    'Abu Dhabi': { lat: 24.4539, lng: 54.3773 }, // Fixed coordinates
    // Add more cities as needed
  };

  private async delay(): Promise<void> {
    const delayTime = Math.floor(Math.random() * 3000) + 2000; // Random 2-5 seconds
    await new Promise((resolve) => setTimeout(resolve, delayTime));
  }

  private async logProcessingStage(
    orderId: string,
    stage: ProcessingStage,
    metadata?: Record<string, any>,
    errorMessage?: string,
  ): Promise<void> {
    try {
      const log = this.orderProcessingLogRepository.create({
        orderId,
        stage,
        metadata,
        errorMessage,
      });
      await this.orderProcessingLogRepository.save(log);

      this.logger.debug(`Logged stage ${stage} for order ${orderId}`);
    } catch (error) {
      this.logger.error(
        `Failed to log processing stage for order ${orderId}:`,
        error,
      );
      // Don't throw here to avoid breaking the main processing flow
    }
  }

  async validateAddress(order: Order): Promise<Coordinates> {
    this.logger.debug(`Validating address for order ${order.orderId}`);

    try {
      await this.delay();

      const coordinates = this.cityCoordinates[order.city];
      if (!coordinates) {
        const errorMessage = `Invalid city: ${order.city}`;
        await this.logProcessingStage(
          order.orderId,
          ProcessingStage.FAILED,
          { stage: 'address_validation', city: order.city },
          errorMessage,
        );
        throw new Error(errorMessage);
      }

      const variation = 0.01; // About 1km variation
      const validatedCoordinates = {
        lat: coordinates.lat + (Math.random() - 0.5) * variation,
        lng: coordinates.lng + (Math.random() - 0.5) * variation,
      };

      await this.logProcessingStage(
        order.orderId,
        ProcessingStage.ADDRESS_VALIDATION,
        {
          originalCoordinates: coordinates,
          validatedCoordinates,
          city: order.city,
        },
      );

      this.logger.debug(
        `Address validated for order ${order.orderId}: ${JSON.stringify(validatedCoordinates)}`,
      );

      return validatedCoordinates;
    } catch (error) {
      if (error.message !== `Invalid city: ${order.city}`) {
        // Log unexpected errors
        await this.logProcessingStage(
          order.orderId,
          ProcessingStage.FAILED,
          { stage: 'address_validation' },
          error.message,
        );
      }
      throw error;
    }
  }

  async checkInventory(order: Order): Promise<boolean> {
    this.logger.debug(`Checking inventory for order ${order.orderId}`);

    try {
      await this.delay();

      if (Math.random() < 0.1) {
        const errorMessage = 'Insufficient inventory';
        await this.logProcessingStage(
          order.orderId,
          ProcessingStage.FAILED,
          {
            stage: 'inventory_check',
            requestedQuantity: order.quantity,
          },
          errorMessage,
        );
        this.logger.warn(`Insufficient inventory for order ${order.orderId}`);
        throw new Error(errorMessage);
      }

      // Log successful inventory check (you might want a separate stage for this)
      await this.logProcessingStage(
        order.orderId,
        ProcessingStage.ADDRESS_VALIDATION, // Or create INVENTORY_CHECK stage
        {
          stage: 'inventory_check',
          requestedQuantity: order.quantity,
          status: 'available',
        },
      );

      this.logger.debug(`Inventory check passed for order ${order.orderId}`);
      return true;
    } catch (error) {
      if (error.message !== 'Insufficient inventory') {
        await this.logProcessingStage(
          order.orderId,
          ProcessingStage.FAILED,
          { stage: 'inventory_check' },
          error.message,
        );
      }
      throw error;
    }
  }

  async calculateShipping(order: Order): Promise<ShippingDetails> {
    this.logger.debug(`Calculating shipping for order ${order.orderId}`);

    try {
      await this.delay();

      const baseCost = 10;
      const costPerItem = 2;
      const providers = ['FedEx', 'UPS', 'USPS'];

      const shippingDetails: ShippingDetails = {
        cost: baseCost + order.quantity * costPerItem,
        estimatedDays: Math.floor(Math.random() * 3) + 2, // 2-4 days
        provider: providers[Math.floor(Math.random() * providers.length)],
      };

      if (['New York', 'Los Angeles', 'Abu Dhabi'].includes(order.city)) {
        shippingDetails.cost *= 1.2; // 20% premium for major cities
      }

      await this.logProcessingStage(
        order.orderId,
        ProcessingStage.SHIPPING_CALCULATION,
        {
          shippingDetails,
          baseCost,
          costPerItem,
          quantity: order.quantity,
          city: order.city,
          premiumApplied: ['New York', 'Los Angeles', 'Abu Dhabi'].includes(
            order.city,
          ),
        },
      );

      this.logger.debug(
        `Shipping calculated for order ${order.orderId}: ${JSON.stringify(shippingDetails)}`,
      );

      return shippingDetails;
    } catch (error) {
      await this.logProcessingStage(
        order.orderId,
        ProcessingStage.FAILED,
        { stage: 'shipping_calculation' },
        error.message,
      );
      throw error;
    }
  }

  async assessRisk(order: Order): Promise<void> {
    this.logger.debug(`Assessing risk for order ${order.orderId}`);

    try {
      await this.delay();

      if (order.quantity > 10) {
        const errorMessage = 'High risk order detected';
        await this.logProcessingStage(
          order.orderId,
          ProcessingStage.FAILED,
          {
            stage: 'risk_assessment',
            riskReason: 'quantity_exceeded',
            quantity: order.quantity,
            maxAllowed: 10,
          },
          errorMessage,
        );
        this.logger.warn(`High risk order detected: ${order.orderId}`);
        throw new Error(errorMessage);
      }

      const riskFactors = [];

      if (order.quantity * 100 > 1000) {
        riskFactors.push('High value order');
      }

      // Updated to match cities in cityCoordinates
      if (['Dubai', 'Abu Dhabi'].includes(order.city)) {
        riskFactors.push('High risk city');
      }

      if (riskFactors.length > 0) {
        this.logger.warn(
          `Risk factors identified for order ${order.orderId}: ${riskFactors.join(', ')}`,
        );

        await this.logProcessingStage(
          order.orderId,
          ProcessingStage.COMPLETED, // Or create RISK_ASSESSED stage
          {
            stage: 'risk_assessment',
            riskFactors,
            riskLevel: 'medium',
            quantity: order.quantity,
            city: order.city,
            orderValue: order.quantity * 100,
          },
        );
      } else {
        this.logger.debug(
          `No risk factors identified for order ${order.orderId}`,
        );

        await this.logProcessingStage(
          order.orderId,
          ProcessingStage.COMPLETED,
          {
            stage: 'risk_assessment',
            riskLevel: 'low',
            quantity: order.quantity,
            city: order.city,
            orderValue: order.quantity * 100,
          },
        );
      }
    } catch (error) {
      if (error.message !== 'High risk order detected') {
        await this.logProcessingStage(
          order.orderId,
          ProcessingStage.FAILED,
          { stage: 'risk_assessment' },
          error.message,
        );
      }
      throw error;
    }
  }

  // Helper method to get processing logs for an order
  async getOrderProcessingLogs(orderId: string): Promise<OrderProcessingLog[]> {
    return this.orderProcessingLogRepository.find({
      where: { orderId },
      order: { createdAt: 'ASC' },
    });
  }

  // Helper method to mark order as completed
  async markOrderCompleted(
    orderId: string,
    finalMetadata?: Record<string, any>,
  ): Promise<void> {
    await this.logProcessingStage(orderId, ProcessingStage.COMPLETED, {
      stage: 'order_completed',
      ...finalMetadata,
    });
  }
}
