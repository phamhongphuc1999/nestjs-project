import { ApiProperty } from '@nestjs/swagger';
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

  @ApiProperty({ type: Number, name: 'status' })
  status: USER_STATUS;
}

export class FindUserQueryDto extends PaginationQueryDto {
  @ApiProperty({ type: String, name: 'searchText' })
  searchText: string;
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
  data: FindUserItemDto;

  @ApiProperty({ type: PaginationResponseDto, name: 'metadata' })
  metadata: PaginationResponseDto;
}
