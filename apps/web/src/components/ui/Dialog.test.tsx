import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Button, Dialog } from '.';

function Harness({ onClose = () => {} }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Restock</Button>
      <Dialog
        open={open}
        onClose={() => {
          onClose();
          setOpen(false);
        }}
        title="Restock vehicle"
        description="Add units to inventory."
        footer={<Button onClick={() => setOpen(false)}>Confirm</Button>}
      >
        <label>
          Quantity
          <input type="number" />
        </label>
      </Dialog>
    </>
  );
}

describe('Dialog', () => {
  it('renders nothing when closed', () => {
    render(<Dialog open={false} onClose={() => {}} title="Hidden" />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is a modal dialog labelled by its title and described by its description', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Restock' }));

    const dialog = screen.getByRole('dialog', { name: 'Restock vehicle' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription('Add units to inventory.');
  });

  it('moves focus inside when opened', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Restock' }));

    const dialog = screen.getByRole('dialog', { name: 'Restock vehicle' });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    const trigger = screen.getByRole('button', { name: 'Restock' });
    await userEvent.click(trigger);

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('has an accessible close button', async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Restock' }));

    await userEvent.click(screen.getByRole('button', { name: 'Close dialog' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps Tab focus inside the dialog', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Restock' }));
    const dialog = screen.getByRole('dialog');

    for (let i = 0; i < 5; i += 1) {
      await userEvent.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
    await userEvent.tab({ shift: true });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });
});
