import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@cedi/shared';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Alert } from '../../components/atoms/Alert';
import { Button } from '../../components/atoms/Button';
import { Input } from '../../components/atoms/Input';
import { FormField } from '../../components/molecules/FormField';
import { useLogin } from './use-session';

type LoginFormValues = z.input<typeof loginSchema>;

export function LoginForm() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues, unknown, z.output<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit((values) => login.mutate(values))}
    >
      {login.error && <Alert>{login.error.message}</Alert>}
      <FormField label="Correo" error={errors.email?.message}>
        <Input type="email" autoComplete="username" autoFocus {...register('email')} />
      </FormField>
      <FormField label="Contraseña" error={errors.password?.message}>
        <Input type="password" autoComplete="current-password" {...register('password')} />
      </FormField>
      <Button type="submit" className="w-full" disabled={login.isPending}>
        {login.isPending ? 'Ingresando…' : 'Iniciar sesión'}
      </Button>
    </form>
  );
}
