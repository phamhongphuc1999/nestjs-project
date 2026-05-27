import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsStrongPassword } from 'class-validator';

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
  @ApiProperty({
    type: String,
    name: 'email',
    example: '',
    nullable: true,
    required: false,
  })
  @IsOptional()
  email?: string;

  @ApiProperty({ type: String, name: 'name', example: 'peter1', nullable: true, required: false })
  @IsOptional()
  name?: string;

  @ApiProperty({ type: String, name: 'password', example: 'July@321' })
  @IsString()
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
