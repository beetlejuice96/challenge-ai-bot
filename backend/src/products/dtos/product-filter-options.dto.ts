import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class ProductFilterOptionsDto {
  @ApiPropertyOptional()
  @Type(() => String)
  @IsOptional()
  readonly keyword?: string;

  constructor(params: ProductFilterOptionsDto) {
    Object.assign(this, params);
  }
}
