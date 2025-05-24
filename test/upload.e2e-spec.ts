import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createReadStream } from 'fs';
import { join } from 'path';
import { AppModule } from '../src/app.module';

describe('Upload Flow (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should upload CSV and process orders', async () => {
    const csvPath = join(__dirname, '../sample-orders.csv');
    
    // Upload mutation
    const uploadResponse = await request(app.getHttpServer())
      .post('/graphql')
      .field('operations', JSON.stringify({
        query: `
          mutation($file: Upload!) {
            uploadOrders(file: $file) {
              uploadId
              totalOrders
            }
          }
        `,
        variables: {
          file: null,
        },
      }))
      .field('map', JSON.stringify({ '0': ['variables.file'] }))
      .attach('0', csvPath);

    expect(uploadResponse.status).toBe(200);
    expect(uploadResponse.body.data.uploadOrders).toHaveProperty('uploadId');

    const uploadId = uploadResponse.body.data.uploadOrders.uploadId;

    // Check upload status
    const statusResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          query($uploadId: ID!) {
            getUploadStatus(uploadId: $uploadId) {
              uploadId
              totalOrders
              processedOrders
              failedOrders
              status
            }
          }
        `,
        variables: {
          uploadId,
        },
      });

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.data.getUploadStatus).toHaveProperty('status');
  });
});