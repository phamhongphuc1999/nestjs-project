import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

export class AccessTokenResponseDto {
  @ApiProperty({ type: String, name: 'accessToken' })
  accessToken: string;
}

export class AuthSignupDto {
  @ApiProperty({ type: String, name: 'Name' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: String, name: 'Password' })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;

  @ApiProperty({ type: String, name: 'Email' })
  @IsEmail()
  email: string;
}

export class GoogleSigninDto {
  @ApiProperty({ type: String, name: 'Google ID Token', example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

export class GoogleRecoverPasswordDto extends GoogleSigninDto {}

export class PasswordLoginDto {
  @ApiProperty({ type: String, name: 'Email', example: 'example@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ type: String, name: 'password' })
  @IsStrongPassword()
  password: string;
}

export class VerifyTokenDto {
  @ApiProperty({ type: String, name: 'Token' })
  @IsNotEmpty()
  token: string;
}

export class RecoverTokenDto extends VerifyTokenDto {
  @ApiProperty({ type: String, name: 'New password' })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  newPassword: string;
}
