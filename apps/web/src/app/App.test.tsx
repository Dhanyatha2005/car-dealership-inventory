import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { tokenStorage } from '@/lib/auth/token-storage';
import { App } from './App';

describe('App routing', () => {
  afterEach(() => tokenStorage.clear());

  it('redirects anonymous users to the login page', async () => {
    render(<App initialPath="/" />);

    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders the register page', async () => {
    render(<App initialPath="/register" />);

    expect(
      await screen.findByRole('heading', { name: /create your account/i }),
    ).toBeInTheDocument();
  });
});
