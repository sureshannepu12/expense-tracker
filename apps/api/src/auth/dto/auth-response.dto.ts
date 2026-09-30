import { UserDto } from './user.dto.js';

export class AuthResponseDto {
  accessToken: string;
  user: UserDto;
}
