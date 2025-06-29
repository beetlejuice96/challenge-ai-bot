import { PickType } from '@nestjs/swagger';

import { LoggerBodyDto } from './logger-body.dto';

export class LoggerFormatterParamsDto extends PickType(LoggerBodyDto, [
  'className',
  'method',
  'payload',
  'level',
]) {}
