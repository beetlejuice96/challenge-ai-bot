import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import config from '@/common/config/env.config';
import { ConfigType } from '@nestjs/config';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [config.KEY],
      useFactory: (configService: ConfigType<typeof config>) => {
        const { host, port, username, password, database, migrations } =
          configService.pgDatabase;
        return {
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,
          synchronize: true,
          autoLoadEntities: true,
          migrations: migrations ? [migrations] : [],
          //   migrations: [migrations],
        };
      },
    }),
  ],
})
export class DatabaseModule {}
