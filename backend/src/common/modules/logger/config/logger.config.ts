import { transports, format } from 'winston';
import { WinstonModuleOptions } from 'nest-winston';
import { registerAs } from '@nestjs/config';

enum LogColors {
  red = '\x1b[31m',
  green = '\x1b[32m',
  yellow = '\x1b[33m',
  blue = '\x1b[34m',
  magenta = '\x1b[35m',
  cyan = '\x1b[36m',
  pink = '\x1b[38;5;206m',
}

function mapLogLevelColor(level: string): LogColors {
  switch (level) {
    case 'debug':
      return LogColors.blue;
    case 'info':
      return LogColors.green;
    case 'error':
      return LogColors.red;
    case 'fatal':
      return LogColors.magenta;
    default:
      return LogColors.cyan;
  }
}

function colorize(color: LogColors, message: string): string {
  return `${color}${message}\x1b[0m`;
}

export default registerAs('loggerOptions', () => {
  const options: WinstonModuleOptions = {
    transports: [
      new transports.Console({
        level: 'info',
        handleExceptions: true,
      }),
      new transports.Console({
        level: 'debug',
        handleExceptions: true,
      }),
      new transports.Console({
        level: 'error',
        handleExceptions: true,
      }),
      new transports.Console({
        level: 'fatal',
        handleExceptions: true,
      }),
    ],
    exitOnError: false,
    format: format.combine(
      // format.uncolorize(),
      format.timestamp(),
      format.printf(({ level, message, context, timestamp }) => {
        const color = mapLogLevelColor(level);
        return `${colorize(color, timestamp as string)} [${colorize(color, context as string)}] ${colorize(color, level)}: ${colorize(color, message as string)}`;
      }),
    ),
  };
  return options;
});
