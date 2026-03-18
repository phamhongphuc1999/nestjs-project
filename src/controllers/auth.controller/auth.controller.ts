import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  AuthSignupDto,
  GoogleRecoverPasswordDto,
  GoogleSigninDto,
  PasswordLoginDto,
  RecoverTokenDto,
  VerifyTokenDto,
} from 'src/dto/auth.dto';
import { AuthService } from 'src/services/auth.service/auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Signup new account' })
  @Throttle({ default: { limit: 1, ttl: 3600000 } })
  @Post('/signup')
  signup(@Body() body: AuthSignupDto) {
    return this.authService.signup(body);
  }

  @ApiOperation({ summary: 'Verify inactive email' })
  @Post('/verify-email')
  verifyEmail(@Body() body: VerifyTokenDto) {
    return this.authService.verifyEmail(body);
  }

  @ApiOperation({ summary: 'Signin by using Google account' })
  @Throttle({ default: { limit: 1, ttl: 3600000 } })
  @Post('/signin/google')
  googleLogin(@Body() body: GoogleSigninDto) {
    return this.authService.googleLogin(body);
  }

  @ApiOperation({ summary: 'Signin with password and email' })
  @Post('/signin/password')
  signinWithPassword(@Body() body: PasswordLoginDto) {
    return this.authService.signinWithPassword(body);
  }

  @ApiOperation({ summary: 'Send a recovery mail' })
  @Post('/forgot-password/send-recovery')
  sendRecoverMailPassword(@Body() body: GoogleRecoverPasswordDto) {
    return this.authService.sendRecoverMailPassword(body);
  }

  @ApiOperation({ summary: 'Recover password' })
  @Post('/forgot-password/recovery')
  recoverPassword(@Body() body: RecoverTokenDto) {
    return this.authService.recoverPassword(body);
  }
}
