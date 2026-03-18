import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

export class AuthSignupDto {
  @ApiProperty({ type: String, description: 'Name' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: String, description: 'Password' })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;

  @ApiProperty({ type: String, description: 'Email' })
  @IsEmail()
  email: string;
}

export class GoogleSigninDto {
  @ApiProperty({
    type: String,
    description: 'Google ID Token',
    example: '1234567890',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

export class PasswordLoginDto {
  @ApiProperty({
    type: String,
    description: 'Email',
    example: 'example@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    type: String,
  })
  @IsStrongPassword()
  password: string;
}

export class VerifyTokenDto {
  @ApiProperty({ type: String, description: 'Token' })
  @IsNotEmpty()
  token: string;
}
