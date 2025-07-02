import { PaginationOptionsDto } from '@/common/dtos/pagination-options.dto';
import { IntersectionType } from '@nestjs/swagger';
import { ProductFilterOptionsDto } from './product-filter-options.dto';

export class ProductQueryParamsDto extends IntersectionType(
  PaginationOptionsDto,
  ProductFilterOptionsDto,
) {}
