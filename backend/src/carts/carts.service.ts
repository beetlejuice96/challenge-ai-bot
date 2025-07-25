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

  async findOne(cartId: number): Promise<CartEntity> {
    try {
      this.logger.log({
        className: this.className,
        method: 'findOne',
        payload: { cartId },
      });
      const cart = await this.cartRepository.findOne({
        where: { id: cartId },
        relations: [
          'cartItems',
          'cartItems.productVariant',
          'cartItems.productVariant.product',
        ],
      });
      if (!cart) {
        throw new NotFoundException(`Cart with ID ${cartId} not found`);
      }
      return cart;
    } catch (error) {
      this.logger.error({
        className: this.className,
        method: 'findOne',
        payload: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async addItem(
    cartId: number,
    itemData: { product_variant_id: number; qty: number },
  ): Promise<void> {
    try {
      this.logger.log({
        className: this.className,
        method: 'addItem',
        payload: { cartId, itemData },
      });
      const cart = await this.cartRepository.findOneBy({ id: cartId });
      if (!cart) {
        throw new NotFoundException(`Cart with ID ${cartId} not found`);
      }
      const cartItem = this.cartItemRepository.create({
        ...itemData,
        cart,
      });
      await this.cartItemRepository.save(cartItem);
    } catch (error) {
      this.logger.error({
        className: this.className,
        method: 'addItem',
        payload: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async updateItem(
    cartId: number,
    itemId: number,
    itemData: Partial<CartItemEntity>,
  ): Promise<CartEntity> {
    try {
      this.logger.log({
        className: this.className,
        method: 'updateItem',
        payload: { cartId, itemId, itemData },
      });
      const cart = await this.cartRepository.findOne({
        where: { id: cartId },
        relations: ['cartItems'],
      });
      if (!cart) {
        throw new NotFoundException(`Cart with ID ${cartId} not found`);
      }
      const cartItem = await this.cartItemRepository.findOneBy({
        id: itemId,
        cart_id: cartId,
      });
      if (!cartItem) {
        throw new NotFoundException(`Cart item with ID ${itemId} not found`);
      }
      Object.assign(cartItem, itemData);
      const itemUpdated = await this.cartItemRepository.save(cartItem);
      return {
        ...cart,
        cartItems: cart.cartItems.map((item) =>
          item.id === itemUpdated.id ? itemUpdated : item,
        ),
      };
    } catch (error) {
      this.logger.error({
        className: this.className,
        method: 'updateItem',
        payload: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
