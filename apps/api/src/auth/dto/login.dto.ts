import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  /** @example demo@example.com */
  @IsEmail()
  email: string;

  /** @example password123 */
  @IsString()
  @MinLength(1)
  password: string;
}
