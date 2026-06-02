import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableCors();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello, World!');
  });

  describe('/health (GET)', () => {
    it('returns 200 with status ok', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
          expect(res.body.version).toEqual(expect.any(String));
          expect(res.body.timestamp).toEqual(expect.any(String));
        });
    });

    it('responds with CORS headers', () => {
      return request(app.getHttpServer())
        .get('/health')
        .set('Origin', 'https://tauri.localhost')
        .expect(200)
        .expect('Access-Control-Allow-Origin', '*');
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
