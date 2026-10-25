import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from '.';

describe('Pagination', () => {
  it('is a labelled navigation landmark showing the current page', () => {
    render(<Pagination page={2} totalPages={5} onPageChange={() => {}} />);

    const nav = screen.getByRole('navigation', { name: 'Pagination' });
    expect(nav).toHaveTextContent('Page 2 of 5');
  });

  it('disables Previous on the first page', () => {
    render(<Pagination page={1} totalPages={3} onPageChange={() => {}} />);

    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();
  });

  it('disables Next on the last page', () => {
    render(<Pagination page={3} totalPages={3} onPageChange={() => {}} />);

    expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('disables both when there is a single (or no) page', () => {
    render(<Pagination page={1} totalPages={0} onPageChange={() => {}} />);

    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('calls onPageChange with the neighbouring page', async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} totalPages={4} onPageChange={onPageChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await userEvent.click(screen.getByRole('button', { name: 'Previous page' }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 3);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 1);
  });
});
