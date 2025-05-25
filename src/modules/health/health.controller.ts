import { Controller, Get, Inject } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { timeout, catchError } from 'rxjs/operators';
import { of, firstValueFrom } from 'rxjs';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject('HEALTH_CHECK') private readonly client: ClientProxy,
  ) {}

  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      // Database health check
      async () =>
        this.db.pingCheck('database', { connection: this.dataSource }),

      // RabbitMQ health check
      async () => {
        try {
          await firstValueFrom(
            this.client.emit('health', {}).pipe(
              timeout(5000), // 5 seconds timeout
              catchError(() => of(false)),
            ),
          );

          return {
            rabbitmq: {
              status: 'up',
            },
          };
        } catch (error) {
          return {
            rabbitmq: {
              status: 'down',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          };
        }
      },
    ]);
  }
}
