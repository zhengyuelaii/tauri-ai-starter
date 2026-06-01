import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = module.get<AppController>(AppController);
  });

  describe('GET /', () => {
    it('should return "Hello, World!"', () => {
      expect(appController.getHello()).toBe('Hello, World!');
    });
  });

  describe('GET /health', () => {
    let httpApp: INestApplication;

    beforeAll(async () => {
      httpApp = module.createNestApplication();
      await httpApp.init();
    });

    afterAll(async () => {
      await httpApp.close();
    });

    it('should return 200 with status, timestamp, and version', async () => {
      const res = await request(httpApp.getHttpServer())
        .get('/health')
        .expect(200);

      expect(res.body).toMatchObject({ status: 'ok' });
      expect(res.body.version).toEqual(expect.any(String));
      expect(res.body.version).not.toBe('');
      expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
    });
  });
});
