import { Controller, Get, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { LoggerService } from '@/common/modules/logger/services/logger.service';
import { ApiPaginatedResponse } from '@/common/decorators/api-paginated-response.decorator';
import { ProductQueryParamsDto } from './dtos/product-query-params.dto';
import { PaginationResponseDto } from '@/common/dtos/pagination-response.dto';
import { ProductResponseDto } from './dtos/product-response.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  private className = ProductsController.name;

  constructor(
    private readonly productsService: ProductsService,
    private readonly logger: LoggerService,
  ) {}

  @Get('/search')
  @ApiPaginatedResponse(ProductQueryParamsDto)
  async findAll(
    @Query() queryParams: ProductQueryParamsDto,
  ): Promise<PaginationResponseDto<ProductResponseDto>> {
    try {
      this.logger.log({
        className: this.className,
        method: 'findAll',
        payload: queryParams,
      });
      return await this.productsService.search(queryParams);
    } catch (error) {
      this.logger.error({
        className: this.className,
        method: 'findAll',
        payload: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  @ApiOperation({ summary: 'Get product by ID' })
  @Get(':id')
  async findOne(@Query('id') id: string): Promise<ProductResponseDto> {
    try {
      this.logger.log({
        className: this.className,
        method: 'findOne',
        payload: { id },
      });
      return await this.productsService.findOne(id);
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
