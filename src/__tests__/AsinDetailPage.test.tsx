import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AsinDetailPage from '../pages/AsinDetailPage';

// 轻量模拟 apiRequest，依据 URL 返回不同数据
vi.mock('../api/client', () => {
	return {
		apiRequest: async (url: string) => {
			// 模拟 by-asin 快照
			if (url.startsWith('/api/asin/by-asin/')) {
				return {
					id: 999,
						asinId: 123,
						price: 20.5,
						bsr: 5000,
						inventory: 30,
						bsrSubcategoryRank: 15,
						snapshotAt: '2024-05-10T12:00:00.000Z'
				};
			}
			// 模拟历史逆序 (最新在最前) — 场景一: 历史都比 snapshot 旧
			if (url.startsWith('/api/asin/123/history')) {
				const params = new URL(url, 'http://x').searchParams;
				const page = Number(params.get('page')) || 0;
				if (page === 0) {
					return {
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
					};
				}
			}
			// 告警 / 评论 返回空
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
		}
	};
});

// adapters 只需要透传 ensurePageResponse（简化实现）
vi.mock('../api/adapters', () => ({
	ensurePageResponse: (raw: any, page: number, size: number) => raw
}));

describe('AsinDetailPage 最新快照选择逻辑', () => {
	it('当历史逆序且 snapshot 更新时，显示 snapshot 价格', async () => {
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

	it('当历史中存在比 snapshot 更新的点时，采用历史最新点', async () => {
		// 修改 mock: 返回一个比 snapshot 更新的历史点
		const apiClient = await import('../api/client');
		(apiClient as any).apiRequest = async (url: string) => {
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
						{ snapshotAt: '2024-05-10T14:00:00.000Z', price: 12.2, bsr: 8800, inventory: 12 }, // 更新的
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
			<MemoryRouter initialEntries={['/asin/TESTASIN2']}>
				<Routes>
					<Route path='/asin/:asin' element={<AsinDetailPage />} />
				</Routes>
			</MemoryRouter>
		);

		await waitFor(() => {
			const priceStat = screen.getByText('当前价格');
			expect(priceStat).toBeTruthy();
		});
		// 期望显示最新历史点的价格 12.2 而不是 snapshot 的 10.5
		const priceText = screen.getByText(/12\.2/);
		expect(priceText).toBeTruthy();
	});
});

