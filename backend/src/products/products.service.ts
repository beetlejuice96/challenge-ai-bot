import { LoggerService } from '@/common/modules/logger/services/logger.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductEntity, ProductVariantEntity } from './entities';
import { Repository } from 'typeorm';
import { PaginationOptionsDto } from '@/common/dtos/pagination-options.dto';
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
    @InjectRepository(ProductVariantEntity)
    private readonly productVariantRepository: Repository<ProductVariantEntity>,
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

      const queryBuilder = this.productRepository.createQueryBuilder('product');

      queryBuilder
        .leftJoinAndSelect('product.variants', 'variant')
        .skip(skip)
        .take(take)
        .orderBy('product.createdAt', order);

      if (filters.keyword) {
        queryBuilder.andWhere(
          '(product.name LIKE :keyword OR product.description LIKE :keyword OR product.category LIKE :keyword)',
          {
            keyword: `%${filters.keyword}%`,
          },
        );
      }

      if (filters.category) {
        queryBuilder.andWhere('product.category = :category', {
          category: filters.category.toLowerCase(),
        });
      }

      if (filters.size) {
        queryBuilder.andWhere('variant.size = :size', {
          size: filters.size.toLowerCase(),
        });
      }

      if (filters.color) {
        queryBuilder.andWhere('variant.color = :color', {
          color: filters.color.toLowerCase(),
        });
      }

      if (filters.name) {
        queryBuilder.andWhere('product.name LIKE :name', {
          name: `%${filters.name.toLowerCase()}%`,
        });
      }

      const [entities, itemCount] = await queryBuilder.getManyAndCount();

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
      const entity = await this.productRepository.findOne({
        where: { id: Number(id) },
        relations: ['variants'],
      });
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
