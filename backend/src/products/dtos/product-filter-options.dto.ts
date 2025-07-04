import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class ProductFilterOptionsDto {
  @ApiPropertyOptional()
  @Type(() => String)
  @IsOptional()
  @IsString()
  readonly keyword?: string;

  @ApiPropertyOptional()
  @Type(() => String)
  @IsOptional()
  @IsString()
  readonly category?: string;

  @ApiPropertyOptional()
  @Type(() => String)
  @IsOptional()
  @IsString()
  readonly size?: string;

  @ApiPropertyOptional()
  @Type(() => String)
  @IsOptional()
  @IsString()
  readonly color?: string;

  constructor(params: ProductFilterOptionsDto) {
    Object.assign(this, params);
  }
}
