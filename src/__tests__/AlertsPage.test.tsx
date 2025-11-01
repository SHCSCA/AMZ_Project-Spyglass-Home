import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import AlertsPage from '../pages/AlertsPage';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

(global as any).fetch = async () => ({ ok: true, json: async () => ({ items: [], total:0, page:0, size:20, totalPages:0, hasNext:false, hasPrevious:false }) });

describe('AlertsPage', () => {
  it('renders without crash', () => {
    const { container } = render(<BrowserRouter><AlertsPage /></BrowserRouter>);
    expect(container).toBeTruthy();
  });
});
