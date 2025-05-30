import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../entities/order.entity';
import { OrderConsumer } from './order.consumer';
import { OrderResolver } from './order.resolver';
import { OrderProcessorService } from './order.processor.service';
import { QueueModule } from '../queue/queue.module';
import { OrderProcessingLog } from 'src/entities/order-processing-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderProcessingLog]), QueueModule],
  providers: [OrderResolver, OrderProcessorService, OrderConsumer],
  exports: [OrderProcessorService],
})
export class OrderProcessingModule {}
