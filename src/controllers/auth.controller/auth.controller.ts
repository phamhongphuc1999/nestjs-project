import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import {
  AccessTokenResponseDto,
  AuthSignupDto,
  GoogleRecoverPasswordDto,
  GoogleSigninDto,
  PasswordLoginDto,
  RecoverTokenDto,
  VerifyTokenDto,
} from 'src/dto/auth.dto';
import { OnlyOkResponseDto } from 'src/dto/common.dto';
import { AuthService } from 'src/services/auth.service/auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Signup new account' })
  @ApiResponse({ description: 'User successfully signed up', type: OnlyOkResponseDto })
  @Throttle({ default: { limit: 1, ttl: 3600000 } })
  @Post('/signup')
  signup(@Body() body: AuthSignupDto) {
    return this.authService.signup(body);
  }

  @ApiOperation({ summary: 'Verify inactive email' })
  @ApiResponse({ type: OnlyOkResponseDto })
  @Post('/verify-email')
  verifyEmail(@Body() body: VerifyTokenDto) {
    return this.authService.verifyEmail(body);
  }

  @ApiOperation({ summary: 'Signin by using Google account' })
  @ApiResponse({ type: AccessTokenResponseDto })
  @Throttle({ default: { limit: 1, ttl: 3600000 } })
  @Post('/signin/google')
  async googleLogin(@Body() body: GoogleSigninDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.googleLogin(body);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/auth/refresh',
    });
    return { accessToken };
  }

  @ApiOperation({ summary: 'Signin with password and email' })
  @ApiResponse({ type: AccessTokenResponseDto })
  @Post('/signin/password')
  async signinWithPassword(
    @Body() body: PasswordLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.signinWithPassword(body);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/auth/refresh',
    });
    return { accessToken };
  }

  @ApiOperation({ summary: 'Send a recovery mail' })
  @ApiResponse({ type: OnlyOkResponseDto })
  @Post('/forgot-password/send-recovery')
  sendRecoverMailPassword(@Body() body: GoogleRecoverPasswordDto) {
    return this.authService.sendRecoverMailPassword(body);
  }

  @ApiOperation({ summary: 'Recover password' })
  @ApiResponse({ type: OnlyOkResponseDto })
  @Post('/forgot-password/recovery')
  recoverPassword(@Body() body: RecoverTokenDto) {
    return this.authService.recoverPassword(body);
  }
}
