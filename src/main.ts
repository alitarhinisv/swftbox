import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { graphqlUploadExpress } from 'graphql-upload-minimal';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Add this line to handle multipart/form-data uploads
  app.use(graphqlUploadExpress());

  await app.listen(configService.get('PORT'));
}
bootstrap();
