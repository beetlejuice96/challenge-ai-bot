import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PaginationResponseDto } from '../dtos/pagination-response.dto';

export const ApiPaginatedResponse = <Entity extends Type<any>>(
  entity: Entity,
) => {
  return applyDecorators(
    ApiExtraModels(PaginationResponseDto, entity),
    ApiOkResponse({
      description: 'Successfully received entity list',
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginationResponseDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(entity) },
              },
            },
          },
        ],
      },
    }),
  );
};
