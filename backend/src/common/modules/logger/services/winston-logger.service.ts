import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { ConfigType } from '@nestjs/config';

import loggerOptions from '@/common/modules/logger/config/logger.config';

@Injectable()
export class WinstonLoggerService implements LoggerService {
  private logger: LoggerService;

  constructor(
    @Inject(loggerOptions.KEY) options: ConfigType<typeof loggerOptions>,
  ) {
    this.logger = WinstonModule.createLogger(options);
  }

  log(message: string): void {
    this.logger.log(message);
  }

  error(message: string): void {
    this.logger.error(message);
  }

  warn(message: string): void {
    this.logger.warn(message);
  }

  debug(message: string): void {
    if (this.logger) {
      if (this.logger && typeof this.logger.debug === 'function') {
        this.logger.debug(message);
      }
    }
  }
}
