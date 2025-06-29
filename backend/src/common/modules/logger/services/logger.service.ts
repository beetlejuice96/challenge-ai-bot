import { Injectable, Scope } from '@nestjs/common';

import { LoggerFormatterParamsDto } from '../dtos/logger-formatter-params.dto';
import { LoggerBodyDto } from '../dtos/logger-body.dto';
import { LoggerParamsDto } from '../dtos/logger-params.dto';
import { ContextStorageService } from '@/common/modules/context-storage/services/context-storage.service';
import { WinstonLoggerService } from './winston-logger.service';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService {
  constructor(
    private logger: WinstonLoggerService,
    private contextStorageService: ContextStorageService,
  ) {}

  private formatter(params: LoggerFormatterParamsDto): string {
    let response: string;
    try {
      response = JSON.stringify(
        new LoggerBodyDto({
          ...params,
          track: this.contextStorageService.getContextId(),
          date: new Date(),
        }),
      );
    } catch (e) {
      response = JSON.stringify(
        new LoggerBodyDto({
          ...params,
          payload: 'Failed stringify',
          track: this.contextStorageService.getContextId(),
          date: new Date(),
        }),
      );
    }
    return response;
  }

  log(params: LoggerParamsDto): void {
    const message = this.formatter({ ...params, level: 'log' });
    this.logger.log(message);
  }

  error(params: LoggerParamsDto): void {
    const message = this.formatter({ ...params, level: 'error' });
    this.logger.error(message);
  }

  warn(params: LoggerParamsDto): void {
    const message = this.formatter({ ...params, level: 'warn' });
    this.logger.warn(message);
  }

  debug(params: LoggerParamsDto): void {
    const message = this.formatter({ ...params, level: 'debug' });
    this.logger.debug(message);
  }
}
