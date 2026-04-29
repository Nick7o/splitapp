import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BalancePill from './BalancePill';

describe('BalancePill', () => {
  it('renders explicit neutral labels', () => {
    render(<BalancePill label="Settled" />);

    expect(screen.getByText('Settled')).toBeInTheDocument();
    expect(screen.getByText('Settled')).toHaveClass('bg-surface-container');
  });

  it('uses positive and negative visual states for money amounts', () => {
    const { rerender } = render(<BalancePill amount={42} currency="EUR" />);

    expect(screen.getByText(/€42/)).toHaveClass('text-primary-fixed');

    rerender(<BalancePill amount={-10} currency="PLN" />);
    expect(screen.getByText(/PLN/)).toHaveClass('text-error');
  });
});
