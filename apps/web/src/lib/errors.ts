import { isAxiosError } from 'axios'

/** Turns a NestJS error response ({ message: string | string[] }) into readable text. */
export function getErrorMessage(
  error: unknown,
  fallback = 'Something went wrong',
): string {
  if (isAxiosError<{ message?: string | string[] }>(error)) {
    if (!error.response) return 'Cannot reach the server. Is the API running?'
    const message = error.response.data?.message
    if (Array.isArray(message)) return message.join(', ')
    if (message) return message
  }
  return fallback
}
