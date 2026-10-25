import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Badge, Card, EmptyState, ErrorState, Spinner } from '.';

describe('Card', () => {
  it('renders its children inside the requested landmark element', () => {
    render(
      <Card as="section" aria-label="Vehicle summary">
        <p>Honda Civic</p>
      </Card>,
    );

    const region = screen.getByRole('region', { name: 'Vehicle summary' });
    expect(region).toHaveTextContent('Honda Civic');
  });

  it('renders as a div by default and passes through attributes', () => {
    render(<Card data-testid="card">Body</Card>);

    const card = screen.getByTestId('card');
    expect(card.tagName).toBe('DIV');
    expect(card).toHaveTextContent('Body');
  });
});

describe('Badge', () => {
  it('renders its label and tone', () => {
    render(<Badge tone="danger">Out of stock</Badge>);

    expect(screen.getByText('Out of stock')).toHaveAttribute('data-tone', 'danger');
  });

  it('defaults to the neutral tone', () => {
    render(<Badge>Sedan</Badge>);

    expect(screen.getByText('Sedan')).toHaveAttribute('data-tone', 'neutral');
  });
});

describe('Spinner', () => {
  it('announces a loading status with a default label', () => {
    render(<Spinner />);

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('uses a custom label', () => {
    render(<Spinner label="Loading vehicles" />);

    expect(screen.getByRole('status', { name: 'Loading vehicles' })).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('renders a heading, description and action', () => {
    render(
      <EmptyState
        title="No vehicles found"
        description="Try a different search."
        action={<button type="button">Clear filters</button>}
      />,
    );

    expect(screen.getByRole('heading', { name: 'No vehicles found' })).toBeInTheDocument();
    expect(screen.getByText('Try a different search.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('renders an alert with the message and a retry button that calls onRetry', async () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Could not load vehicles." onRetry={onRetry} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Could not load vehicles.');
    expect(alert).toHaveTextContent('Something went wrong');

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('omits the retry button without onRetry and supports custom copy', () => {
    render(<ErrorState title="Access denied" message="Admins only." retryLabel="Reload" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Access denied');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
