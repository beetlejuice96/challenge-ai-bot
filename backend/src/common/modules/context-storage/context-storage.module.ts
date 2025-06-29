import { Global, Module } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { ClsModule } from 'nestjs-cls';

import { ContextStorageService } from './services/context-storage.service';

@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req: Request) =>
          (req.headers['x-correlation-id'] as string) ?? uuid(),
      },
    }),
  ],
  providers: [ContextStorageService],
  exports: [ContextStorageService],
})
export class ContextStorageModule {}
