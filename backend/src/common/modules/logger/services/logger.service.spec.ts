import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { LoggerService } from './logger.service';
import loggerOptions from '../config/logger.config';
import { ContextStorageModule } from '@/common/modules/context-storage/context-storage.module';
import { WinstonLoggerService } from './winston-logger.service';

describe('LoggerService', () => {
  let service: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [loggerOptions],
        }),
        ContextStorageModule,
      ],
      providers: [LoggerService, WinstonLoggerService],
    }).compile();
    service = await module.resolve<LoggerService>(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
