import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
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
  async create(): Promise<void> {
    try {
      this.logger.log({
        className: this.className,
        method: 'create',
        payload: {},
      });
      await this.cartsService.create();
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
}
