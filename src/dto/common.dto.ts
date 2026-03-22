import { ApiProperty } from '@nestjs/swagger';

export class OnlyOkResponseDto {
  @ApiProperty({ type: Boolean, example: true })
  isOk: boolean;
}
