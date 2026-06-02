import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

  describe('root', () => {
    it('should return "Hello, World!"', () => {
      expect(appController.getHello()).toBe('Hello, World!');
    });
  });

  describe('/health', () => {
    it('should return status ok with version and timestamp', () => {
      const result = appController.getHealth();

      expect(result.status).toBe('ok');
      expect(result.version).toEqual(expect.any(String));
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });
  });
});
