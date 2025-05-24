import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsInt, Min, MaxLength, Matches, IsString } from 'class-validator';
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
  @IsNotEmpty()
  @Matches(/^ORD-\d{6}$/, { message: 'Order ID must be in format ORD-XXXXXX where X is a digit' })
  orderId: string;

  @Field()
  @Column()
  @IsNotEmpty()
  @IsEmail({}, { message: 'Invalid email format' })
  customerEmail: string;

  @Field()
  @Column()
  @IsNotEmpty()
  @Matches(/^SKU-[A-Z0-9]{8}$/, { message: 'Product SKU must be in format SKU-XXXXXXXX where X is a letter or digit' })
  productSku: string;

  @Field()
  @Column()
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;

  @Field()
  @Column()
  @IsNotEmpty()
  @IsString()
  @MaxLength(200, { message: 'Address cannot exceed 200 characters' })
  address: string;

  @Field()
  @Column()
  @IsNotEmpty()
  @IsString()
  @MaxLength(50, { message: 'City name cannot exceed 50 characters' })
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
  @MaxLength(500, { message: 'Error reason cannot exceed 500 characters' })
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
