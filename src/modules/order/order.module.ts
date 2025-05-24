import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../entities/order.entity';
import { OrderConsumer } from './order.consumer';
import { OrderResolver } from './order.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  controllers: [OrderConsumer], // Change from providers to controllers
  providers: [OrderResolver], // Add OrderResolver to providers
})
export class OrderModule {}
