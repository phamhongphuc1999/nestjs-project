import { ApiProperty } from '@nestjs/swagger';
import { USER_ROLE, USER_STATUS } from 'src/types/global';

export class GetUserResponseDto {
  @ApiProperty({ type: Number, description: 'id' })
  id: number;

  @ApiProperty({ type: String, description: 'name' })
  name: string;

  @ApiProperty({ type: String, description: 'email' })
  email: string;

  @ApiProperty({ type: Number, description: 'role' })
  role: USER_ROLE;

  @ApiProperty({ type: Number, description: 'status' })
  status: USER_STATUS;
}
