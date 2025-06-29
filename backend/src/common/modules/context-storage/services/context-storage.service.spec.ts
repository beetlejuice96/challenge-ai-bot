import { Test, TestingModule } from '@nestjs/testing';
import { ClsModule } from 'nestjs-cls';

import { ContextStorageService } from './context-storage.service';

describe('ContextStorageService', () => {
  let service: ContextStorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ClsModule],
      providers: [ContextStorageService],
    }).compile();
    service = await module.resolve<ContextStorageService>(
      ContextStorageService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
