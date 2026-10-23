import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import POSBilling from '../pages/POSBilling';

describe('POS Billing Component Test', () => {
  it('renders POS billing and toggles Home Delivery without crashing', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <POSBilling />
        </AuthProvider>
      </BrowserRouter>
    );

    // Verify POS rendered
    expect(screen.getByText(/Retail Counter Checkout/i)).toBeDefined();

    // Find Home Delivery toggle button
    const deliveryButton = screen.getByText(/Home Delivery/i);
    expect(deliveryButton).toBeDefined();

    // Click Home Delivery
    fireEvent.click(deliveryButton);

    // Verify delivery address section appears and NO crash
    expect(screen.getByText(/Patient Delivery Address/i)).toBeDefined();
    expect(screen.getByText(/Vishrambag/i)).toBeDefined();
  });
});
