import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { FormField, Input, Select } from '.';

describe('Input', () => {
  it('renders a textbox that accepts typing', async () => {
    render(<Input aria-label="Search" placeholder="Search..." />);

    const input = screen.getByRole('textbox', { name: 'Search' });
    await userEvent.type(input, 'civic');
    expect(input).toHaveValue('civic');
  });
});

describe('FormField', () => {
  it('associates the label with the control', () => {
    render(<FormField label="Email">{(field) => <Input type="email" {...field} />}</FormField>);

    const input = screen.getByLabelText('Email');
    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('marks the control invalid and describes it with the error message', () => {
    render(
      <FormField label="Email" error="Enter a valid email">
        {(field) => <Input type="email" {...field} />}
      </FormField>,
    );

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter a valid email');
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
  });

  it('describes the control with a hint when there is no error', () => {
    render(
      <FormField label="Password" hint="At least 8 characters">
        {(field) => <Input type="password" {...field} />}
      </FormField>,
    );

    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('At least 8 characters');
  });

  it('uses an explicit id when provided', () => {
    render(
      <FormField label="Make" id="make">
        {(field) => <Input {...field} />}
      </FormField>,
    );

    expect(screen.getByLabelText('Make')).toHaveAttribute('id', 'make');
  });
});

describe('Select', () => {
  const options = [
    { value: 'SEDAN', label: 'Sedan' },
    { value: 'SUV', label: 'SUV' },
  ];

  it('renders options plus a placeholder and reports changes', async () => {
    render(
      <FormField label="Category">
        {(field) => <Select {...field} options={options} placeholder="Any category" />}
      </FormField>,
    );

    const select = screen.getByRole('combobox', { name: 'Category' });
    expect(screen.getByRole('option', { name: 'Any category' })).toHaveValue('');
    expect(screen.getAllByRole('option')).toHaveLength(3);

    await userEvent.selectOptions(select, 'SUV');
    expect(select).toHaveValue('SUV');
  });

  it('is described by the field error', () => {
    render(
      <FormField label="Category" error="Pick a category">
        {(field) => <Select {...field} options={options} />}
      </FormField>,
    );

    const select = screen.getByRole('combobox', { name: 'Category' });
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAccessibleDescription('Pick a category');
  });
});
