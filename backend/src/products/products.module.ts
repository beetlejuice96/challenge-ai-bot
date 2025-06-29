import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity])], // Add your Product entities here
  providers: [ProductsService],
  controllers: [ProductsController],
})
export class ProductsModule {}
