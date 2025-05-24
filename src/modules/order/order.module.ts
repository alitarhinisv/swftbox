import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../entities/order.entity';
import { OrderConsumer } from './order.consumer';

@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  controllers: [OrderConsumer], // Change from providers to controllers
  providers: [], // Remove from providers or keep other services here
})
export class OrderModule {}
