import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { HealthController } from './health.controller';

@Module({
  imports: [
    TerminusModule,
    TypeOrmModule,
    ClientsModule.register([
      {
        name: 'HEALTH_CHECK',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://swftbox:swftbox@localhost:5672'],
          queue: 'health_check',
        },
      },
    ]),
  ],
  controllers: [HealthController],
})
export class HealthModule {}
