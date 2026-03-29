import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class OnlyOkResponseDto {
  @ApiProperty({ type: Boolean, name: 'isOk', example: true })
  isOk: boolean;
}

export class PaginationQueryDto {
  @ApiProperty({ type: Number, name: 'page', nullable: true, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ type: Number, name: 'limit', nullable: true, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class PaginationResponseDto {
  @ApiProperty({ type: Number, name: 'totalItems' })
  totalItems: number;

  @ApiProperty({ type: Number, name: 'itemCount' })
  itemCount: number;

  @ApiProperty({ type: Number, name: 'itemsPerPage' })
  itemsPerPage: number;

  @ApiProperty({ type: Number, name: 'totalPages' })
  totalPages: number;

  @ApiProperty({ type: Number, name: 'currentPage' })
  currentPage: number;
}
