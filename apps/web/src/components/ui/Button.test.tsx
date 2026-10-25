import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '.';

describe('Button', () => {
  it('renders an accessible button that defaults to type="button" and the primary variant', () => {
    render(<Button>Save</Button>);

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('data-variant', 'primary');
    expect(button).toBeEnabled();
  });

  it('exposes the ghost variant', () => {
    render(<Button variant="ghost">Cancel</Button>);

    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute('data-variant', 'ghost');
  });

  it('calls onClick when pressed', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Buy</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Buy' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled and ignores clicks when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Buy
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Buy' });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('sets disabled and aria-busy while loading, keeping its accessible name', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Purchase
      </Button>,
    );

    const button = screen.getByRole('button', { name: /purchase/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('is not busy when not loading', () => {
    render(<Button>Purchase</Button>);

    expect(screen.getByRole('button', { name: 'Purchase' })).not.toHaveAttribute('aria-busy');
  });

  it('forwards aria-pressed for toggle buttons', () => {
    render(<Button aria-pressed>Grid</Button>);

    expect(screen.getByRole('button', { name: 'Grid', pressed: true })).toBeInTheDocument();
  });
});
