import { ProductEntity, ProductVariantEntity } from '../entities';

export class ProductVariantResponseDto extends ProductVariantEntity {}

export class ProductResponseDto extends ProductEntity {
  declare variants: ProductVariantResponseDto[];
}
