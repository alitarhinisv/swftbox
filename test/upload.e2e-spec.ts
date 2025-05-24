import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { join } from 'path';
import { createReadStream, writeFileSync, unlinkSync } from 'fs';
import { AppModule } from './../src/app.module';
import { UploadProcessingStatus } from '../src/entities/upload.entity';
import { OrderStatus } from '../src/entities/order.entity';
import { graphqlUploadExpress } from 'graphql-upload-minimal';
import { getConnection } from 'typeorm';

describe('Upload (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(graphqlUploadExpress());
    await app.init();
  });

  it('should upload a CSV file and process orders', async () => {
    const testFilePath = join(__dirname, '..', 'sample-orders.csv');

    // First, perform the file upload mutation
    const uploadResponse = await request(app.getHttpServer())
      .post('/graphql')
      .field(
        'operations',
        JSON.stringify({
          query: `
          mutation($file: Upload!) {
            uploadOrders(file: $file) {
              id
              filename
              totalOrders
              status
            }
          }
        `,
          variables: {
            file: null,
          },
        }),
      )
      .field('map', JSON.stringify({ '0': ['variables.file'] }))
      .attach('0', testFilePath);

    expect(uploadResponse.status).toBe(200);

    const uploadResult = uploadResponse.body.data.uploadOrders;
    expect(uploadResult).toBeDefined();
    expect(uploadResult.filename).toBe('sample-orders.csv');
    expect(uploadResult.status).toBe(UploadProcessingStatus.PENDING);
    expect(uploadResult.totalOrders).toBeGreaterThan(0);

    const uploadId = uploadResult.id;

    // Then, check the upload status
    const statusResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          query($uploadId: ID!) {
            getUploadStatus(uploadId: $uploadId) {
              id
              filename
              totalOrders
              status
              orders {
                id
                orderId
                status
                errorReason
              }
            }
          }
        `,
        variables: {
          uploadId,
        },
      });

    expect(statusResponse.status).toBe(200);
    const statusResult = statusResponse.body.data.getUploadStatus;
    expect(statusResult).toBeDefined();
    expect(statusResult.id).toBe(uploadId);
    expect(statusResult.orders).toBeDefined();
    expect(Array.isArray(statusResult.orders)).toBe(true);

    // Finally, check the orders with different statuses
    const ordersResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          query($uploadId: ID!, $status: String) {
            getOrders(uploadId: $uploadId, status: $status) {
              id
              orderId
              status
              errorReason
            }
          }
        `,
        variables: {
          uploadId,
          status: OrderStatus.PENDING,
        },
      });

    expect(ordersResponse.status).toBe(200);
    const ordersResult = ordersResponse.body.data.getOrders;
    expect(ordersResult).toBeDefined();
    expect(Array.isArray(ordersResult)).toBe(true);
  });
});
