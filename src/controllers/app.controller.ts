import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  constructor() {}

  @ApiOperation({ summary: 'Test' })
  @Get()
  getHello() {
    return { message: 'hello!' };
  }
}
