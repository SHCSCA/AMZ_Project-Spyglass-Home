import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AlertsPage from '../pages/AlertsPage';

(global as any).fetch = async () => ({ ok: true, json: async () => ({ items: [], total:0, page:0, size:20, totalPages:0, hasNext:false, hasPrevious:false }) });

describe('AlertsPage filters', () => {
  it('renders type Select', async () => {
    render(<BrowserRouter><AlertsPage /></BrowserRouter>);
    // placeholder text may not render as element text; query by role combobox
    const selects = await screen.findAllByRole('combobox');
    expect(selects.length).toBeGreaterThan(0);
  });
});