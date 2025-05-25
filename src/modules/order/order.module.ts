import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../entities/order.entity';
import { OrderConsumer } from './order.consumer';
import { OrderResolver } from './order.resolver';
import { OrderProcessorService } from './order.processor.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  controllers: [OrderConsumer], // Change from providers to controllers
  providers: [OrderResolver, OrderProcessorService], // Add OrderProcessorService to providers
})
export class OrderModule {}
