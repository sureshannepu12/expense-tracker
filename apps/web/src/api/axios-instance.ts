import Axios, { type AxiosError, type AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/lib/auth-store'
import { queryClient } from '@/lib/query-client'

export const AXIOS_INSTANCE = Axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
})

// Attach the JWT to every request.
AXIOS_INSTANCE.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// An expired or invalid token logs the user out; ProtectedRoute then redirects to /login.
AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && useAuthStore.getState().token) {
      useAuthStore.getState().clearSession()
      // Same as a manual logout: never let the next user see this user's cached data.
      queryClient.clear()
    }
    return Promise.reject(error)
  },
)

/** Orval calls this for every generated request (see orval.config.ts). */
export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> =>
  AXIOS_INSTANCE({ ...config, ...options }).then(({ data }) => data)

// Orval uses these to type errors and request bodies in the generated hooks.
export type ErrorType<Error> = AxiosError<Error>
export type BodyType<BodyData> = BodyData
