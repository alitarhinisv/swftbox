import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Order } from './order.entity';

export enum ProcessingStage {
  ADDRESS_VALIDATION = 'ADDRESS_VALIDATION',
  INVENTORY_CHECK = 'INVENTORY_CHECK',
  SHIPPING_CALCULATION = 'SHIPPING_CALCULATION',
  RISK_ASSESSMENT = 'RISK_ASSESSMENT',
}

@Entity('order_processing_logs')
export class OrderProcessingLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order)
  order: Order;

  @Column({
    type: 'enum',
    enum: ProcessingStage,
  })
  stage: ProcessingStage;

  @Column()
  success: boolean;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
