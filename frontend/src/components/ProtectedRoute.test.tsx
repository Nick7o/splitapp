import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

const renderProtectedRoute = (initialPath = '/groups/abc') => {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/groups/:id"
          element={(
            <ProtectedRoute>
              <div>Private content</div>
            </ProtectedRoute>
          )}
        />
        <Route path="/" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
};

describe('ProtectedRoute', () => {
  it('redirects guests and stores intended destination', () => {
    renderProtectedRoute('/groups/abc');

    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(localStorage.getItem('redirectAfterLogin')).toBe('/groups/abc');
  });

  it('renders protected content when token exists', () => {
    localStorage.setItem('token', 'jwt');

    renderProtectedRoute('/groups/abc');

    expect(screen.getByText('Private content')).toBeInTheDocument();
  });
});
