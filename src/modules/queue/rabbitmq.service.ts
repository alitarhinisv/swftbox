import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { ORDER_PROCESSING_QUEUE } from 'src/modules/order/constants';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      // Create connection
      this.connection = await amqp.connect(
        this.configService.get<string>('RABBITMQ_URL'),
      );

      // Create channel
      this.channel = await this.connection.createChannel();

      // Assert queues
      await this.channel.assertQueue(ORDER_PROCESSING_QUEUE, { durable: true });

      this.logger.log('Successfully connected to RabbitMQ');

      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error', err);
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
      });
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      throw error;
    }
  }

  private async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ', error);
    }
  }

  async publishMessage(queue: string, message: any): Promise<void> {
    try {
      await this.channel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(message)),
        { persistent: true },
      );
    } catch (error) {
      this.logger.error(`Error publishing message to queue ${queue}`, error);
      throw error;
    }
  }

  async consume(
    queue: string,
    callback: (message: any) => Promise<void>,
  ): Promise<void> {
    try {
      await this.channel.consume(queue, async (msg) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            await callback(content);
            await this.channel.ack(msg);
          } catch (error) {
            this.logger.error(
              `Error processing message from queue ${queue}`,
              error,
            );
            // Reject the message and don't requeue it if processing fails
            await this.channel.nack(msg, false, false);
          }
        }
      });
    } catch (error) {
      this.logger.error(`Error setting up consumer for queue ${queue}`, error);
      throw error;
    }
  }
}
