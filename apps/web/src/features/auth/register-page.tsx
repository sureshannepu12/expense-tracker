import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useRegister } from '@/api/generated/auth/auth'
import { FormInput } from '@/components/form-input'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { useAuthStore } from '@/lib/auth-store'
import { getErrorMessage } from '@/lib/errors'
import { AuthLayout } from './auth-layout'

// Mirrors the backend RegisterDto rules so users see errors before submitting.
const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'At least 2 characters').max(50),
    email: z.email('Enter a valid email'),
    password: z.string().min(8, 'At least 8 characters').max(72),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
type RegisterValues = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  const signUp = useRegister({
    mutation: {
      onSuccess: ({ accessToken, user }) => {
        setSession(accessToken, user)
        toast.success('Account created. Add your first expense!')
        navigate('/expenses', { replace: true })
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    },
  })

  return (
    <AuthLayout
      title="Create an account"
      description="Starter categories are added for you."
      footer={
        <span>
          Already registered?{' '}
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Log in
          </Link>
        </span>
      }
    >
      <form
        onSubmit={handleSubmit(({ name, email, password }) =>
          signUp.mutate({ data: { name, email, password } }),
        )}
      >
        <FieldGroup>
          <FormInput
            id="name"
            label="Name"
            autoComplete="name"
            error={errors.name}
            {...register('name')}
          />
          <FormInput
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email}
            {...register('email')}
          />
          <FormInput
            id="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            error={errors.password}
            {...register('password')}
          />
          <FormInput
            id="confirmPassword"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword}
            {...register('confirmPassword')}
          />
          <Button type="submit" size="lg" disabled={signUp.isPending}>
            {signUp.isPending ? 'Creating account…' : 'Create account'}
          </Button>
        </FieldGroup>
      </form>
    </AuthLayout>
  )
}
