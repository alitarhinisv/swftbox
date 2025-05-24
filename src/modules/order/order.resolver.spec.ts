import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderResolver } from './order.resolver';
import { Order } from '../../entities/order.entity';

describe('OrderResolver', () => {
  let resolver: OrderResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderResolver,
        {
          provide: getRepositoryToken(Order),
          useValue: {
            createQueryBuilder: jest.fn(() => ({
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              groupBy: jest.fn().mockReturnThis(),
              getRawMany: jest.fn().mockResolvedValue([
                { city: 'New York', orderCount: '5', totalQuantity: '10' },
                { city: 'Los Angeles', orderCount: '3', totalQuantity: '6' },
              ]),
            })),
          },
        },
      ],
    }).compile();

    resolver = module.get<OrderResolver>(OrderResolver);
  });

  describe('getOrdersByCity', () => {
    it('should return orders grouped by city', async () => {
      const result = await resolver.getOrdersByCity();

      expect(result).toEqual([
        { city: 'New York', orderCount: 5, totalQuantity: 10 },
        { city: 'Los Angeles', orderCount: 3, totalQuantity: 6 },
      ]);
    });
  });
});
