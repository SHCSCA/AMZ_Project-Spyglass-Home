import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AsinDetailPage from '../pages/AsinDetailPage';

/**
 * 模拟后端 apiRequest：根据不同 URL 返回预设数据。
 * 场景 A：历史列表逆序（最新记录在最前）且所有历史都比 snapshot 更旧。
 */
vi.mock('../api/client', () => {
	const mockData = {
		snapshotA: {
			id: 999,
			asinId: 123,
			price: 20.5,
			bsr: 5000,
			inventory: 30,
			bsrSubcategoryRank: 15,
			snapshotAt: '2024-05-10T12:00:00.000Z'
		},
		historyA: {
			items: [
				{ snapshotAt: '2024-05-10T11:00:00.000Z', price: 19.9, bsr: 5200, inventory: 28 },
				{ snapshotAt: '2024-05-09T12:00:00.000Z', price: 18.9, bsr: 5400, inventory: 25 }
			],
			total: 2,
			page: 0,
			size: 200,
			totalPages: 1,
			hasNext: false,
			hasPrevious: false
		},
		emptyPage: {
			items: [],
			total: 0,
			page: 0,
			size: 0,
			totalPages: 0,
			hasNext: false,
			hasPrevious: false
		}
	};
	return {
		apiRequest: async (url: string) => {
			if (url.startsWith('/api/asin/by-asin/')) return mockData.snapshotA;
			if (url.startsWith('/api/asin/123/history')) return mockData.historyA;
			if (url.includes('/alerts') || url.includes('/reviews')) return mockData.emptyPage;
			return null;
		}
	};
});

// adapters 只需要透传 ensurePageResponse（简化实现）
vi.mock('../api/adapters', () => ({
	ensurePageResponse: (raw: any, page: number, size: number) => raw
}));

describe('AsinDetailPage 最新快照选择逻辑', () => {
		it('场景A：历史逆序且 snapshot 更新时，显示 snapshot 价格', async () => {
		render(
			<MemoryRouter initialEntries={['/asin/TESTASIN']}>
				<Routes>
					<Route path='/asin/:asin' element={<AsinDetailPage />} />
				</Routes>
			</MemoryRouter>
		);
		// 等待“当前价格”统计出现
		await waitFor(() => {
			const priceStat = screen.getByText('当前价格');
			expect(priceStat).toBeTruthy();
		});
		// 断言包含最新 snapshot 价格 20.5（即使历史最后一条是更旧 18.9）
		const priceText = screen.getByText(/20\.5/);
		expect(priceText).toBeTruthy();
	});

		it('场景B：历史中存在比 snapshot 更新的点时采用历史最大时间戳', async () => {
			// 重新 mock 为场景 B
			const client = await import('../api/client');
			(client as any).apiRequest = async (url: string) => {
				if (url.startsWith('/api/asin/by-asin/')) {
					return {
						id: 888,
						asinId: 321,
						price: 10.5,
						bsr: 9000,
						inventory: 11,
						bsrSubcategoryRank: 40,
						snapshotAt: '2024-05-10T12:00:00.000Z'
					};
				}
				if (url.startsWith('/api/asin/321/history')) {
					return {
						items: [
							{ snapshotAt: '2024-05-10T14:00:00.000Z', price: 12.2, bsr: 8800, inventory: 12 },
							{ snapshotAt: '2024-05-10T13:00:00.000Z', price: 11.9, bsr: 8900, inventory: 12 }
						],
						total: 2,
						page: 0,
						size: 200,
						totalPages: 1,
						hasNext: false,
						hasPrevious: false
					};
				}
				if (url.includes('/alerts') || url.includes('/reviews')) {
					return {
						items: [],
						total: 0,
						page: 0,
						size: 0,
						totalPages: 0,
						hasNext: false,
						hasPrevious: false
					};
				}
				return null;
			};
			render(
				<MemoryRouter initialEntries={['/asin/ANOTHERASIN']}>
					<Routes>
						<Route path='/asin/:asin' element={<AsinDetailPage />} />
					</Routes>
				</MemoryRouter>
			);
			await waitFor(() => screen.getByText('当前价格'));
			expect(screen.getByText(/12\.2/)).toBeTruthy();
		});
});

