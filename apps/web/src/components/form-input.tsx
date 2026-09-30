import type { ComponentProps } from 'react'
import type { FieldError as RHFFieldError } from 'react-hook-form'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PasswordInput } from './password-input'

type FormInputProps = ComponentProps<typeof Input> & {
  id: string
  label: string
  error?: RHFFieldError
}

/**
 * Label + input + validation message. Spread react-hook-form's register() into it.
 * type="password" automatically gets the show/hide eye button.
 */
export function FormInput({ id, label, error, type, ...props }: FormInputProps) {
  const InputComponent = type === 'password' ? PasswordInput : Input
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputComponent id={id} type={type} aria-invalid={!!error} {...props} />
      <FieldError errors={[error]} />
    </Field>
  )
}
