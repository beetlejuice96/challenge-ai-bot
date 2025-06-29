import { LoggerLevelType } from '../types/logger-level.type';

export class LoggerBodyDto {
  readonly track: string;
  readonly date: Date;
  readonly level: LoggerLevelType;
  readonly className: string;
  readonly method: string;
  readonly payload?: any;

  constructor(params: LoggerBodyDto) {
    Object.assign(this, params);
  }
}
