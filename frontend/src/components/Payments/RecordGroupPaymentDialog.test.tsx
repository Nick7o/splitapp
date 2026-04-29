import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../../api';
import RecordGroupPaymentDialog from './RecordGroupPaymentDialog';

vi.mock('../../api', () => ({
  default: {
    post: vi.fn(),
  },
}));

const members = [
  { id: 'user-a', name: 'Ada', email: 'ada@example.com' },
  { id: 'user-b', name: 'Ben', email: 'ben@example.com' },
  { id: 'user-c', name: 'Cora', email: 'cora@example.com' },
];

describe('RecordGroupPaymentDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.post).mockResolvedValue({ data: {} });
  });

  it('records payment with trimmed note and closes after success', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onRecorded = vi.fn();
    render(
      <RecordGroupPaymentDialog
        groupId="group-1"
        members={members}
        initialFromUserId="user-a"
        initialToUserId="user-b"
        initialAmount={50}
        initialCurrency="PLN"
        onClose={onClose}
        onRecorded={onRecorded}
      />,
    );

    await user.clear(screen.getByRole('spinbutton'));
    await user.type(screen.getByRole('spinbutton'), '35.25');
    await user.type(screen.getByPlaceholderText('Optional note'), '  paid in cash  ');
    await user.click(screen.getByRole('button', { name: 'Record payment' }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/groups/group-1/payments', {
      fromUserId: 'user-a',
      toUserId: 'user-b',
      amount: 35.25,
      currency: 'PLN',
      note: 'paid in cash',
    }));
    expect(onRecorded).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('blocks amounts above suggested maximum', async () => {
    const user = userEvent.setup();
    render(
      <RecordGroupPaymentDialog
        groupId="group-1"
        members={members}
        initialFromUserId="user-a"
        initialToUserId="user-b"
        initialAmount={50}
        initialCurrency="PLN"
        maxAmount={50}
        onClose={vi.fn()}
        onRecorded={vi.fn()}
      />,
    );

    await user.clear(screen.getByRole('spinbutton'));
    await user.type(screen.getByRole('spinbutton'), '99');

    expect(screen.getByRole('button', { name: 'Record payment' })).toBeDisabled();
    expect(api.post).not.toHaveBeenCalled();
  });
});
