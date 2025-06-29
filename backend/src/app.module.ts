import { Module } from '@nestjs/common';
import { CartsModule } from './carts/carts.module';
import { ProductsModule } from './products/products.module';
import { ConfigModule } from '@nestjs/config';
import config from '@/common/config/env.config';
import { validationSchema } from '@/common/config/env.validation-schema';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      load: [config],
      isGlobal: true,
      validationSchema,
    }),
    DatabaseModule,
    CartsModule,
    ProductsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
