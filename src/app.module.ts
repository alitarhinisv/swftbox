import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { FileUpload } from './entities/upload.entity';
import { Order } from './entities/order.entity';
import { OrderProcessingLog } from './entities/order-processing-log.entity';
import { UploadModule } from './modules/upload/upload.module';
import { GraphQLUpload } from 'graphql-upload-minimal';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'swftbox',
      password: 'swftbox', //to load from .env file later on
      database: 'swftbox',
      entities: [FileUpload, Order, OrderProcessingLog],
      synchronize: true, // Set to false in production
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
  ],
})
export class AppModule {}
