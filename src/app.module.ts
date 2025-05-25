import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FileUpload } from './entities/upload.entity';
import { Order } from './entities/order.entity';
import { UploadModule } from './modules/upload/upload.module';
import { OrderProcessingModule } from './modules/order/orderProcessingModule';
import { HealthModule } from './modules/health/health.module';
import { GraphQLUpload } from 'graphql-upload-minimal';
import { OrderProcessingLog } from 'src/entities/order-processing-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'postgres',
          host: configService.get('DB_HOST'),
          port: parseInt(configService.get('DB_PORT')) || 5432,
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_DATABASE'),
          entities: [FileUpload, Order, OrderProcessingLog],
          synchronize: configService.get('NODE_ENV') !== 'production',
          logging: configService.get('NODE_ENV') === 'development',
        };
      },
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          autoSchemaFile: 'src/graphql/schema.graphql',
          sortSchema: true, // Keeps schema consistent
          csrfPrevention: configService.get('CSRF_PREVENTION') === 'true',
          playground: configService.get('GRAPHQL_PLAYGROUND') === 'true',
          introspection: configService.get('NODE_ENV') !== 'production',
          resolvers: {
            Upload: GraphQLUpload,
          },
          context: ({ req, res }) => ({ req, res }), // For file uploads
          uploads: {
            maxFileSize: 10000000, // 10MB
            maxFiles: 5,
          },
        };
      },
    }),
    UploadModule,
    OrderProcessingModule,
    HealthModule,
  ],
})
export class AppModule {}
