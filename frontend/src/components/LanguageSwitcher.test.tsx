import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import LanguageSwitcher from './LanguageSwitcher';

describe('LanguageSwitcher', () => {
  it('changes the active app language', async () => {
    const user = userEvent.setup();

    render(<LanguageSwitcher />);

    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'PL' }));

    expect(screen.getByRole('group', { name: 'Język' })).toBeInTheDocument();
  });
});
