import { Resolver, Query, ObjectType, Field, Int } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../entities/order.entity';

@ObjectType()
class CityMetric {
  @Field()
  city: string;

  @Field(() => Int)
  orderCount: number;

  @Field(() => Int)
  totalQuantity: number;
}

@Resolver()
export class OrderResolver {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  @Query(() => [CityMetric])
  async getOrdersByCity(): Promise<CityMetric[]> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.city', 'city')
      .addSelect('COUNT(*)', 'orderCount')
      .addSelect('SUM(order.quantity)', 'totalQuantity')
      .groupBy('order.city')
      .getRawMany();

    return result.map((row) => ({
      city: row.city,
      orderCount: parseInt(row.orderCount),
      totalQuantity: parseInt(row.totalQuantity),
    }));
  }
}
