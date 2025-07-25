import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CartsService } from './carts.service';
import { LoggerService } from '@/common/modules/logger/services/logger.service';
import { CartEntity } from './entities';
import { ApiOperation } from '@nestjs/swagger';

@Controller('carts')
export class CartsController {
  private className = CartsController.name;

  constructor(
    private readonly cartsService: CartsService,
    private readonly logger: LoggerService,
  ) {}

  @ApiOperation({ summary: 'Create a new cart' })
  @Post()
  async create(): Promise<CartEntity> {
    try {
      this.logger.log({
        className: this.className,
        method: 'create',
        payload: {},
      });
      return await this.cartsService.create();
    } catch (error) {
      this.logger.error({
        className: this.className,
        method: 'create',
        payload: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  @ApiOperation({ summary: 'Update an existing cart' })
  @Patch(':id')
  async update(
    @Param('id') cartId: number,
    @Body() cartData: Partial<CartEntity>,
  ): Promise<void> {
    try {
      this.logger.log({
        className: this.className,
        method: 'update',
        payload: { cartId, cartData },
      });
      await this.cartsService.update(cartId, cartData);
    } catch (error) {
      this.logger.error({
        className: this.className,
        method: 'update',
        payload: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  @ApiOperation({ summary: 'Add item to cart' })
  @Post(':id/items')
  async addItem(
    @Param('id', ParseIntPipe) cartId: number,
    @Body() itemData: { product_variant_id: number; qty: number },
  ): Promise<void> {
    try {
      this.logger.log({
        className: this.className,
        method: 'addItem',
        payload: { cartId, itemData },
      });
      await this.cartsService.addItem(cartId, itemData);
    } catch (error) {
      this.logger.error({
        className: this.className,
        method: 'addItem',
        payload: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  @ApiOperation({ summary: 'Update item quantity in cart' })
  @Patch(':id/items/:itemId')
  async updateItem(
    @Param('id', ParseIntPipe) cartId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() updateData: { qty: number },
  ): Promise<CartEntity> {
    try {
      this.logger.log({
        className: this.className,
        method: 'updateItem',
        payload: { cartId, itemId, updateData },
      });
      return this.cartsService.updateItem(cartId, itemId, updateData);
    } catch (error) {
      this.logger.error({
        className: this.className,
        method: 'updateItem',
        payload: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  @ApiOperation({ summary: 'Get cart details' })
  @Get(':id')
  async getCartDetails(
    @Param('id', ParseIntPipe) cartId: number,
  ): Promise<CartEntity> {
    try {
      this.logger.log({
        className: this.className,
        method: 'getCartDetails',
        payload: { cartId },
      });
      return await this.cartsService.findOne(cartId);
    } catch (error) {
      this.logger.error({
        className: this.className,
        method: 'getCartDetails',
        payload: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
