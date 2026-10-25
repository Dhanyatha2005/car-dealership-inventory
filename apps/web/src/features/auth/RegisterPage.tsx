import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterInputSchema } from '@kata/shared';
import type { RegisterInput } from '@kata/shared';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router';
import { Button, FormField, Input } from '@/components/ui';
import { errorMessage } from '@/lib/api/api-error';
import { AuthLayout } from './AuthLayout';
import { useAuth } from './auth-context';

export function RegisterPage(): ReactElement {
  const { register: signUp, token } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(RegisterInputSchema) });

  if (token) return <Navigate to="/" replace />;

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await signUp(values);
      await navigate('/', { replace: true });
    } catch (error) {
      setServerError(errorMessage(error));
    }
  });

  return (
    <AuthLayout title="Create your account" subtitle="Join AutoVault to start shopping.">
      <form className="flex flex-col gap-5" onSubmit={(e) => void onSubmit(e)} noValidate>
        <FormField label="Name" error={errors.name?.message}>
          {(control) => <Input {...control} autoComplete="name" {...register('name')} />}
        </FormField>
        <FormField label="Email" error={errors.email?.message}>
          {(control) => (
            <Input {...control} type="email" autoComplete="email" {...register('email')} />
          )}
        </FormField>
        <FormField label="Password" error={errors.password?.message} hint="At least 8 characters">
          {(control) => (
            <Input
              {...control}
              type="password"
              autoComplete="new-password"
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
          Create account
        </Button>
        <p className="text-center text-sm text-ink-muted">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-accent">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
