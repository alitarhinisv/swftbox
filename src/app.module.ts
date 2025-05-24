import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { FileUpload } from './entities/upload.entity';
import { Order } from './entities/order.entity';
import { OrderProcessingLog } from './entities/order-processing-log.entity';
import { UploadModule } from './modules/upload/upload.module';
import { OrderModule } from './modules/order/order.module';
import { GraphQLUpload } from 'graphql-upload-minimal';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'swftbox',
      password: 'swftbox',
      database: 'swftbox',
      entities: [FileUpload, Order, OrderProcessingLog],
      synchronize: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'src/graphql/schema.graphql',
      csrfPrevention: false,
      resolvers: {
        Upload: GraphQLUpload,
      },
    }),
    UploadModule,
    OrderModule,
  ],
})
export class AppModule {}
