import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  /** @example jane@example.com */
  @IsEmail()
  email: string;

  /** @example Jane Doe */
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  /** @example password123 */
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
