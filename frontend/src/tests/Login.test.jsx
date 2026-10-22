import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Login from '../pages/Login';

describe('Login Page Smoke Test', () => {
  it('renders Shree Ganesh Medical branding and login elements', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Shree Ganesh Medical/i)).toBeDefined();
    expect(screen.getByText(/Sign In to Counter/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/admin@ganeshpharmacy.com/i)).toBeDefined();
    expect(screen.getByText(/Owner \/ Admin/i)).toBeDefined();
  });
});
