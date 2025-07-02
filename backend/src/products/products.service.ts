import { LoggerService } from '@/common/modules/logger/services/logger.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductEntity } from './entities';
import { FindOptionsOrder, Repository, Like } from 'typeorm';
import { PaginationOptionsDto } from '@/common/dtos/pagination-options.dto';
import { Order } from '@/common/consts/order.const';
import { PaginationResponseDto } from '@/common/dtos/pagination-response.dto';
import { ProductResponseDto } from './dtos/product-response.dto';
import { PaginationMetaDto } from '@/common/dtos/pagination-meta.dto';
import { ProductFilterOptionsDto } from './dtos/product-filter-options.dto';
import { ProductQueryParamsDto } from './dtos/product-query-params.dto';

@Injectable()
export class ProductsService {
  private className = ProductsService.name;

  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    private readonly logger: LoggerService,
  ) {}

  async search(
    queryParams: ProductQueryParamsDto,
  ): Promise<PaginationResponseDto<ProductResponseDto>> {
    try {
      this.logger.log({
        className: this.className,
        method: 'search',
        payload: queryParams,
      });
      const { order, take, page, ...others } = queryParams;
      const paginationOptions = new PaginationOptionsDto({ order, page, take });
      const filters = new ProductFilterOptionsDto(others);

      const skip = (page - 1) * take;
      const [entities, itemCount] = await this.productRepository.findAndCount({
        skip,
        take,
        order: { createdAt: order } as FindOptionsOrder<ProductEntity>,
        where: {
          ...(filters.keyword && {
            name: Like(`%${filters.keyword}%`),
          }),
        },
      });
      const paginationMeta = new PaginationMetaDto({
        paginationOptions,
        itemCount,
      });
      const paginatedResponse = new PaginationResponseDto<ProductResponseDto>(
        entities,
        paginationMeta,
      );
      return paginatedResponse;
    } catch (error) {
      this.logger.error({
        className: this.className,
        method: 'search',
        payload: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    try {
      this.logger.log({
        className: this.className,
        method: 'findOne',
        payload: { id },
      });
      const entity = await this.productRepository.findOneBy({ id: Number(id) });
      if (!entity) {
        throw new NotFoundException(`Product with id ${id} not found`);
      }
      return entity;
    } catch (error) {
      this.logger.error({
        className: this.className,
        method: 'findOne',
        payload: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
