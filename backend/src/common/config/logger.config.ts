import { transports, format } from 'winston';
import { WinstonModuleOptions } from 'nest-winston';
import { registerAs } from '@nestjs/config';

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
        level: 'warn',
        handleExceptions: true,
      }),
    ],
    exitOnError: false,
    format: format.combine(
      format.uncolorize(),
      format.timestamp(),
      format.printf((info) => {
        const {
          level = '',
          message = '',
          context = '',
          timestamp = '',
        } = info as {
          level?: string;
          message?: string;
          context?: string;
          timestamp?: string;
        };
        return `${timestamp} [${context}] ${level}: ${message}`;
      }),
    ),
  };
  return options;
});
//checkear que ande esto del printf
