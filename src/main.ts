import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import { graphqlUploadExpress } from 'graphql-upload-minimal';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Add this line to handle multipart/form-data uploads
  app.use(graphqlUploadExpress());

  // Create a microservice instance
  const microservice = app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get('RABBITMQ_URL')],
      queue: configService.get('RABBITMQ_QUEUE'),
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(configService.get('PORT'));
}
bootstrap();
