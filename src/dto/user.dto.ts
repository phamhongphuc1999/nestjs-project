import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { USER_ROLE, USER_STATUS } from 'src/types/global';
import { PaginationQueryDto, PaginationResponseDto } from './common.dto';

export class GetUserResponseDto {
  @ApiProperty({ type: Number, name: 'id' })
  id: number;

  @ApiProperty({ type: String, name: 'name' })
  name: string;

  @ApiProperty({ type: String, name: 'email' })
  email: string;

  @ApiProperty({ type: Number, name: 'role' })
  role: USER_ROLE;

  @ApiProperty({ type: String, name: 'avatarUrl' })
  avatarUrl: string;

  @ApiProperty({ type: Number, name: 'status' })
  status: USER_STATUS;

  @ApiProperty({ type: Date, name: 'lastSeenAt' })
  lastSeenAt: Date;
}

export class FindUserQueryDto extends PaginationQueryDto {
  @ApiProperty({ type: String, name: 'searchText', required: false })
  @IsOptional()
  searchText?: string;

  @ApiProperty({ type: 'array', items: { type: 'number' }, name: 'userIds', required: false })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value.map(Number);
    if (typeof value === 'string') return value.split(',').map(Number);
    return [Number(value)];
  })
  @IsOptional()
  userIds?: Array<number>;
}

export class FindUserItemDto {
  @ApiProperty({ type: Number, name: 'id' })
  id: number;

  @ApiProperty({ type: String, name: 'name' })
  name: string;

  @ApiProperty({ type: String, name: 'email' })
  email: string;
}

export class FindUserResponseDto {
  @ApiProperty({ type: FindUserItemDto, name: 'data' })
  data: Array<FindUserItemDto>;

  @ApiProperty({ type: PaginationResponseDto, name: 'metadata' })
  metadata: PaginationResponseDto;
}
