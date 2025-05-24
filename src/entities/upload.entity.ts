import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { Order } from './order.entity';

export enum UploadProcessingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

registerEnumType(UploadProcessingStatus, {
  name: 'UploadProcessingStatus',
});

@ObjectType('FileUpload')
@Entity('uploads')
export class FileUpload {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  filename: string;

  @Field()
  @Column()
  totalOrders: number;

  @Field(() => UploadProcessingStatus)
  @Column({
    type: 'enum',
    enum: UploadProcessingStatus,
    default: UploadProcessingStatus.PENDING,
  })
  status: UploadProcessingStatus;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => [Order])
  @OneToMany(() => Order, (order) => order.upload)
  orders: Order[];
}
