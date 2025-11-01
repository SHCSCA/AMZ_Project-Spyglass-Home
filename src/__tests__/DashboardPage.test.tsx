import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardPage from '../pages/DashboardPage';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

(global as any).fetch = async (url: string) => {
  if (url.includes('/api/asin')) return { ok: true, json: async () => ({ items: [], total:0, page:0, size:20, totalPages:0, hasNext:false, hasPrevious:false }) } as any;
  if (url.includes('/api/alerts')) return { ok: true, json: async () => ({ items: [], total:0, page:0, size:20, totalPages:0, hasNext:false, hasPrevious:false }) } as any;
  return { ok: true, json: async () => ({}) } as any;
};

describe('DashboardPage', () => {
  it('renders table structure', async () => {
    render(<BrowserRouter><DashboardPage /></BrowserRouter>);
    const btn = await screen.findByText('添加ASIN');
    expect(btn).toBeTruthy();
  });
});
