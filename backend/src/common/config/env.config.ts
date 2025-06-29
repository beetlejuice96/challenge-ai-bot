import { registerAs } from '@nestjs/config';

export default registerAs('config', () => {
  return {
    envrionment: process.env.NODE_ENV || 'local',
    pgDatabase: {
      host: process.env.TYPEORM_HOST,
      username: process.env.TYPEORM_USERNAME,
      port: parseInt(process.env.TYPEORM_PORT || '3306', 10),
      password: process.env.TYPEORM_PASSWORD,
      database: process.env.TYPEORM_DATABASE,
      migrations: process.env.TYPEORM_MIGRATIONS,
    },
    server: {
      port: process.env.PORT,
    },
  };
});
