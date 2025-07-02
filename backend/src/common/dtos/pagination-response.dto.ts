import { ApiProperty } from '@nestjs/swagger';

import { PaginationMetaDto } from './pagination-meta.dto';

export class PaginationResponseDto<Entity> {
  @ApiProperty({ isArray: true })
  readonly data: Entity[];

  @ApiProperty({ type: () => PaginationMetaDto })
  readonly meta: PaginationMetaDto;

  constructor(data: Entity[], meta: PaginationMetaDto) {
    this.data = data;
    this.meta = meta;
  }
}
