import { Prisma } from '../generated/prisma/client.js';

/** True when a Prisma write failed because of a @unique / @@unique constraint. */
export function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

/** True when a write broke a foreign key, e.g. deleting a row that other rows still point to. */
export function isForeignKeyViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2003'
  );
}

/** True when the record a write depended on no longer exists (e.g. deleted by a concurrent request). */
export function isRecordNotFound(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
  );
}
