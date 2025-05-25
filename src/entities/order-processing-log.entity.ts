import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

export enum ProcessingStage {
  ADDRESS_VALIDATION = 'ADDRESS_VALIDATION',
  SHIPPING_CALCULATION = 'SHIPPING_CALCULATION',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('order_processing_logs')
export class OrderProcessingLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column()
  orderId: string;

  @Column({
    type: 'enum',
    enum: ProcessingStage,
  })
  stage: ProcessingStage;

  @Column({ nullable: true })
  errorMessage?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
