import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marks a route as accessible without a JWT (the auth guard is global). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
