import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let healthController: HealthController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService],
    }).compile();

    healthController = app.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(healthController).toBeDefined();
  });

  describe('root', () => {
    it('should return "Hello, World!"', () => {
      expect(healthController.getHello()).toBe('Hello, World!');
    });
  });

  describe('/health', () => {
    it('should return status ok with version and timestamp', () => {
      const result = healthController.getHealth();

      expect(result.status).toBe('ok');
      expect(result.version).toEqual(expect.any(String));
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });
  });
});
