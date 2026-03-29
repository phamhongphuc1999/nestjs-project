import { ApiProperty } from '@nestjs/swagger';
import { USER_ROLE, USER_STATUS } from 'src/types/global';

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
