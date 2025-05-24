import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { FileUpload } from './upload.entity';

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

registerEnumType(OrderStatus, {
  name: 'OrderStatus',
});

@ObjectType()
@Entity('orders')
export class Order {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  orderId: string;

  @Field()
  @Column()
  customerEmail: string;

  @Field()
  @Column()
  productSku: string;

  @Field()
  @Column()
  quantity: number;

  @Field()
  @Column()
  address: string;

  @Field()
  @Column()
  city: string;

  @Field(() => OrderStatus)
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Field({ nullable: true })
  @Column({ nullable: true })
  errorReason: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  processedAt: Date;

  @Field(() => FileUpload)
  @ManyToOne(() => FileUpload, (upload) => upload.orders)
  upload: FileUpload;
}
