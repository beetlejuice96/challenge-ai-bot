import { PickType } from '@nestjs/swagger';

import { LoggerBodyDto } from './logger-body.dto';

export class LoggerParamsDto extends PickType(LoggerBodyDto, [
  'className',
  'method',
  'payload',
]) {}
