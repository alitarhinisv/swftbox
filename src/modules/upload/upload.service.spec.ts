import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UploadService } from './upload.service';
import {
  FileUpload,
  UploadProcessingStatus,
} from '../../entities/upload.entity';
import { Order, OrderStatus } from '../../entities/order.entity';
import { QueueService } from '../queue/queue.service';

describe('UploadService', () => {
  let service: UploadService;
  let uploadRepository: Repository<FileUpload>;
  let orderRepository: Repository<Order>;
  let queueService: QueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: getRepositoryToken(FileUpload),
          useValue: {
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Order),
          useValue: {
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            })),
          },
        },
        {
          provide: QueueService,
          useValue: {
            sendOrderForProcessing: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
    uploadRepository = module.get<Repository<FileUpload>>(
      getRepositoryToken(FileUpload),
    );
    orderRepository = module.get<Repository<Order>>(getRepositoryToken(Order));
    queueService = module.get<QueueService>(QueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processUpload', () => {
    it('should create upload record and process orders', async () => {
      const mockUpload = new FileUpload();
      mockUpload.id = '1';
      mockUpload.filename = 'sample-orders.csv';
      mockUpload.status = UploadProcessingStatus.PENDING;

      jest.spyOn(uploadRepository, 'save').mockResolvedValue(mockUpload);

      const result = await service.processUpload(
        'sample-orders.csv',
        'sample-orders.csv',
      );

      expect(result).toEqual(mockUpload);
      expect(uploadRepository.save).toHaveBeenCalled();
    });
  });

  describe('getUploadStatus', () => {
    it('should return upload status with order counts', async () => {
      const mockUpload = new FileUpload();
      mockUpload.id = '1';
      mockUpload.totalOrders = 2;
      mockUpload.orders = [
        { status: OrderStatus.COMPLETED } as Order,
        { status: OrderStatus.FAILED } as Order,
      ];

      jest.spyOn(uploadRepository, 'findOne').mockResolvedValue(mockUpload);

      const result = await service.getUploadStatus('1');

      expect(result).toEqual(mockUpload);
      expect(uploadRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['orders'],
      });
    });
  });
});
