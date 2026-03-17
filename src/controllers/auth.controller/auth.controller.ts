import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthSignupDto } from 'src/dto/auth.dto';
import { AuthService } from 'src/services/auth.service/auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Signup new account' })
  @Throttle({ default: { limit: 1, ttl: 3600000 } })
  @Post()
  findListUsers(@Body() body: AuthSignupDto) {
    return this.authService.signup(body);
  }
}
