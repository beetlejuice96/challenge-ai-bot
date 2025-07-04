import { LoggerService } from '@/common/modules/logger/services/logger.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CartEntity, CartItemEntity } from './entities';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class CartsService {
  private className = CartsService.name;

  constructor(
    private readonly logger: LoggerService,

    @InjectRepository(CartEntity)
    private readonly cartRepository: Repository<CartEntity>,

    @InjectRepository(CartItemEntity)
    private readonly cartItemRepository: Repository<CartItemEntity>,
  ) {}

  async create(): Promise<CartEntity> {
    try {
      this.logger.log({
        className: this.className,
        method: 'create',
        payload: {},
      });
      const cart = this.cartRepository.create();
      await this.cartRepository.save(cart);
      return cart;
    } catch (error) {
      this.logger.error({
        className: this.className,
        method: 'create',
        payload: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  //TODO: por ahora voy asignar los items con esta funcion pero deberia hacer un endpoint nuevo para poder gestionar el stock, cuando agrego un item al carrito deberia restar el stock del producto?
  async update(
    cartId: number,
    cartData: Partial<CartEntity>,
  ): Promise<CartEntity> {
    try {
      this.logger.log({
        className: this.className,
        method: 'update',
        payload: { cartId, cartData },
      });
      const cart = await this.cartRepository.findOneBy({ id: cartId });
      if (!cart) {
        throw new NotFoundException(`Cart with ID ${cartId} not found`);
      }
      Object.assign(cart, cartData);
      await this.cartRepository.save(cart);
      return cart;
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
