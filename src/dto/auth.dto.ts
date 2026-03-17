import { IsEmail, IsNotEmpty, IsStrongPassword } from 'class-validator';

export class AuthSignupDto {
  @IsNotEmpty()
  name: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;

  @IsEmail()
  email: string;
}
