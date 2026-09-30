import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Shape of `request.user`, set by JwtStrategy.validate(). */
export interface AuthUser {
  id: string;
  email: string;
}

/** Injects the logged-in user into a controller method: `@CurrentUser() user: AuthUser`. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser =>
    ctx.switchToHttp().getRequest().user,
);
