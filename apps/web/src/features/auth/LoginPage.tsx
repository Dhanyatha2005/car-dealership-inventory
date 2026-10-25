import { zodResolver } from '@hookform/resolvers/zod';
import { LoginInputSchema } from '@kata/shared';
import type { LoginInput } from '@kata/shared';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { Button, FormField, Input } from '@/components/ui';
import { errorMessage } from '@/lib/api/api-error';
import { AuthLayout } from './AuthLayout';
import { useAuth } from './auth-context';

export function LoginPage(): ReactElement {
  const { login, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginInputSchema) });

  if (token) return <Navigate to="/" replace />;

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await login(values);
      const from = (location.state as { from?: string } | null)?.from ?? '/';
      await navigate(from, { replace: true });
    } catch (error) {
      setServerError(errorMessage(error));
    }
  });

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to browse and purchase vehicles.">
      <form className="flex flex-col gap-5" onSubmit={(e) => void onSubmit(e)} noValidate>
        <FormField label="Email" error={errors.email?.message}>
          {(control) => (
            <Input {...control} type="email" autoComplete="email" {...register('email')} />
          )}
        </FormField>
        <FormField label="Password" error={errors.password?.message}>
          {(control) => (
            <Input
              {...control}
              type="password"
              autoComplete="current-password"
              {...register('password')}
            />
          )}
        </FormField>
        {serverError && (
          <p role="alert" className="text-sm text-danger">
            {serverError}
          </p>
        )}
        <Button type="submit" loading={isSubmitting} className="mt-2 w-full">
          Sign in
        </Button>
        <p className="text-center text-sm text-ink-muted">
          No account?{' '}
          <Link to="/register" className="font-medium text-accent">
            Create one
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
