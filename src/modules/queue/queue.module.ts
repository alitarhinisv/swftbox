import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { RabbitMQService } from './rabbitmq.service';

@Module({
  providers: [QueueService, RabbitMQService],
  exports: [QueueService, RabbitMQService],
})
export class QueueModule {}
