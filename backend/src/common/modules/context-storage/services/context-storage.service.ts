import { Injectable } from '@nestjs/common';
import { CLS_ID, ClsService } from 'nestjs-cls';

import { ContextStorageServiceInterface } from '../interfaces/context-storage-service.interface';

@Injectable()
export class ContextStorageService implements ContextStorageServiceInterface {
  constructor(private readonly cls: ClsService) {}

  get<T>(key: string): T | undefined {
    return this.cls.get(key);
  }

  setContextId(id: string) {
    this.cls.set(String(CLS_ID), id);
  }

  getContextId(): string {
    return this.cls.getId();
  }

  set<T>(key: string, value: T): void {
    this.cls.set(key, value);
  }
}
