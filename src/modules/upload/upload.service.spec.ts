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

      // Fix: Use arrow function or cast the method
      const saveSpy = jest
        .spyOn(uploadRepository, 'save' as any)
        .mockResolvedValue(mockUpload);

      const result = await service.processUpload(
        'sample-orders.csv',
        'sample-orders.csv',
      );

      expect(result).toEqual(mockUpload);
      expect(saveSpy).toHaveBeenCalled();
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

      // Fix: Use arrow function or cast the method
      const findOneSpy = jest
        .spyOn(uploadRepository, 'findOne' as any)
        .mockResolvedValue(mockUpload);

      const result = await service.getUploadStatus('1');

      expect(result).toEqual(mockUpload);
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['orders'],
      });
    });
  });
});
