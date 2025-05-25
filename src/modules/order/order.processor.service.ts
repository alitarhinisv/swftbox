import { Injectable, Logger } from '@nestjs/common';
import { Order } from '../../entities/order.entity';

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
  private readonly cityCoordinates: Record<string, Coordinates> = {
    'New York': { lat: 40.7128, lng: -74.006 },
    'Los Angeles': { lat: 34.0522, lng: -118.2437 },
    Chicago: { lat: 41.8781, lng: -87.6298 },
    Dubai: { lat: 43.8781, lng: -82.6298 },
    'Abu Dhabi': { lat: 31.0522, lng: -168.2437 },
    // Add more cities as needed
  };

  private async delay(): Promise<void> {
    const delayTime = Math.floor(Math.random() * 3000) + 2000; // Random 2-5 seconds
    await new Promise((resolve) => setTimeout(resolve, delayTime));
  }

  async validateAddress(order: Order): Promise<Coordinates> {
    this.logger.debug(`Validating address for order ${order.orderId}`);
    await this.delay();

    const coordinates = this.cityCoordinates[order.city];
    if (!coordinates) {
      throw new Error(`Invalid city: ${order.city}`);
    }

    const variation = 0.01; // About 1km variation
    const validatedCoordinates = {
      lat: coordinates.lat + (Math.random() - 0.5) * variation,
      lng: coordinates.lng + (Math.random() - 0.5) * variation,
    };

    this.logger.debug(
      `Address validated for order ${order.orderId}: ${JSON.stringify(validatedCoordinates)}`,
    );
    return validatedCoordinates;
  }

  async checkInventory(order: Order): Promise<boolean> {
    this.logger.debug(`Checking inventory for order ${order.orderId}`);
    await this.delay();

    if (Math.random() < 0.1) {
      this.logger.warn(`Insufficient inventory for order ${order.orderId}`);
      throw new Error('Insufficient inventory');
    }

    this.logger.debug(`Inventory check passed for order ${order.orderId}`);
    return true;
  }

  async calculateShipping(order: Order): Promise<ShippingDetails> {
    this.logger.debug(`Calculating shipping for order ${order.orderId}`);
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

    this.logger.debug(
      `Shipping calculated for order ${order.orderId}: ${JSON.stringify(shippingDetails)}`,
    );
    return shippingDetails;
  }

  async assessRisk(order: Order): Promise<void> {
    this.logger.debug(`Assessing risk for order ${order.orderId}`);
    await this.delay();

    if (order.quantity > 10) {
      this.logger.warn(`High risk order detected: ${order.orderId}`);
      throw new Error('High risk order detected');
    }

    const riskFactors = [];

    if (order.quantity * 100 > 1000) {
      riskFactors.push('High value order');
    }

    if (['Miami', 'Las Vegas', 'Dubai'].includes(order.city)) {
      riskFactors.push('High risk city');
    }

    if (riskFactors.length > 0) {
      this.logger.warn(
        `Risk factors identified for order ${order.orderId}: ${riskFactors.join(', ')}`,
      );
    } else {
      this.logger.debug(
        `No risk factors identified for order ${order.orderId}`,
      );
    }
  }
}
