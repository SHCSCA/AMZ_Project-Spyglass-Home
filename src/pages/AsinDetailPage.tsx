import React, { useState, useMemo } from 'react';
import { logInfo, logError } from '../logger';
import type { EChartsOption } from 'echarts';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { fetchAsinDetail } from '../api/asinApi';
import {
  HistoryPoint,
  PageResponse,
  AsinHistoryPoint,
  AlertLogResponse,
  ReviewAlertResponse,
  AsinResponse,
  AsinHistorySnapshot,
} from '../types';
import { ensurePageResponse } from '../api/adapters';
import { mapHistoryPoint, mapAlertLog, mapReview } from '../api';
import { useFetch } from '../hooks/useFetch';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import ReactECharts from './ReactEChartsLazy';
import { Radio, Tabs, Space, Select, DatePicker, Card, Statistic, Row, Col } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { DEFAULT_ALERT_RANGE_DAYS } from '../constants/config';
// 已在上方 import 列表中加载 HistoryPoint / AsinHistoryPoint, 这里无需重复导入
import type { RadioChangeEvent } from 'antd/es/radio';
import AsinAlertsList from '../components/AsinAlertsList';
import NegativeReviewsList from '../components/NegativeReviewsList';
import HistoryDataTable from '../components/HistoryDataTable';

// /api/asin/by-asin/{asin} 返回最新一次历史快照 (AsinHistorySnapshot 类型来自 types)
async function fetchAsinSnapshotByCode(asinCode: string): Promise<AsinHistorySnapshot> {
  const raw = await apiRequest<AsinHistorySnapshot>(`/api/asin/by-asin/${encodeURIComponent(asinCode)}`);
  if (!raw) throw new Error(`ASIN ${asinCode} 未找到或无历史快照`);
  return raw;
}

async function fetchHistory(
  id: number,
  range: string,
  page: number,
  size: number
): Promise<PageResponse<AsinHistoryPoint>> {
  const raw = await apiRequest<unknown>(
    `/api/asin/${id}/history?range=${range}&page=${page}&size=${size}`
  );
  return ensurePageResponse<AsinHistoryPoint>(raw, page, size);
}
async function fetchAsinAlerts(
  asinId: number,
  page: number,
  size: number,
  type?: string,
  from?: string,
  to?: string
): Promise<PageResponse<AlertLogResponse>> {
  // Swagger: /api/asin/{id}/alerts (page,size,type,from,to)
  const fromTs = from ?? dayjs().subtract(DEFAULT_ALERT_RANGE_DAYS, 'day').toISOString();
  const toTs = to ?? dayjs().toISOString();
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  if (type) q.set('type', type);
  if (fromTs) q.set('from', fromTs);
  if (toTs) q.set('to', toTs);
  const raw = await apiRequest<unknown>(`/api/asin/${asinId}/alerts?${q.toString()}`);
  return ensurePageResponse<AlertLogResponse>(raw, page, size);
}
async function fetchNegativeReviews(
  id: number,
  page: number,
  size: number
): Promise<PageResponse<ReviewAlertResponse>> {
  const raw = await apiRequest<unknown>(
    `/api/asin/${id}/reviews?rating=negative&page=${page}&size=${size}`
  );
  return ensurePageResponse<ReviewAlertResponse>(raw, page, size);
}
// content-diff 尚未在后端实现，先禁用 diff tab

const ranges = [
  { label: '7天', value: '7d' },
  { label: '30天', value: '30d' },
  { label: '90天', value: '90d' },
];

const AsinDetailPage: React.FC = () => {
  const { asin } = useParams<{ asin: string }>();
  const navigate = useNavigate();
  const [range, setRange] = useState('30d');
  const [historyPage] = useState(1); // 当前未实现翻页，保留值以兼容未来扩展
  const historyPageSize = 200; // 拉较大窗口用于图表

  // 获取ASIN基本信息：支持传入 numeric id 或 asin code
  const {
    data: asinInfoOrSnapshot,
    loading: loadingInfo,
    error: errorInfo,
  } = useFetch<AsinResponse | AsinHistorySnapshot>(() => {
    if (!asin) return Promise.resolve(null as any);
    if (/^\d+$/.test(asin)) {
      return fetchAsinDetail(Number(asin));
    }
    return fetchAsinSnapshotByCode(asin);
  }, [asin]);

  // 统一真实 ASIN 主键（快照对象含 asinId，基础对象含 id）
  const asinId = asinInfoOrSnapshot && typeof asinInfoOrSnapshot === 'object' && 'asinId' in (asinInfoOrSnapshot as any)
    ? (asinInfoOrSnapshot as any).asinId
    : (asinInfoOrSnapshot as AsinResponse | undefined)?.id;

  // 如果是通过 asin code 获取的快照，提取出来参与最新点计算
  const snapshot = useMemo(
    () =>
      asinInfoOrSnapshot && 'snapshotAt' in (asinInfoOrSnapshot as any)
        ? (asinInfoOrSnapshot as AsinHistorySnapshot)
        : null,
    [asinInfoOrSnapshot]
  );

  // 第二步: 使用ID获取历史数据
  const {
    data: historyResp,
    loading: loadingHistory,
    error: errorHistory,
  } = useFetch(
    () =>
      asinId
        ? fetchHistory(asinId, range, historyPage - 1, historyPageSize)
        : Promise.resolve({
            items: [],
            total: 0,
            page: 0,
            size: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false,
          }),
    [asinId, range, historyPage]
  );

  const [alertPage, setAlertPage] = useState(1);
  const alertPageSize = 20;
  const [alertType, setAlertType] = useState<string | undefined>();
  const [fromDate, setFromDate] = useState<Dayjs | null>(dayjs().subtract(DEFAULT_ALERT_RANGE_DAYS, 'day'));
  const [toDate, setToDate] = useState<Dayjs | null>(dayjs());
  const {
    data: alertsResp,
    loading: loadingAlerts,
    error: errorAlerts,
  } = useFetch(
    () =>
      asinId
        ? fetchAsinAlerts(
            asinId,
            alertPage - 1,
            alertPageSize,
            alertType,
            fromDate ? fromDate.toISOString() : undefined,
            toDate ? toDate.toISOString() : undefined
          )
        : Promise.resolve({
            items: [],
            total: 0,
            page: 0,
            size: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false,
          }),
    [asinId, alertPage, alertType, fromDate, toDate]
  );

  const [reviewPage, setReviewPage] = useState(1);
  const reviewPageSize = 20;
  const {
    data: reviewsResp,
    loading: loadingReviews,
    error: errorReviews,
  } = useFetch(
    () =>
      // 仅在我们已知 asinId 时请求差评（后端支持 /api/asin/{id}/reviews）
      asinId
        ? fetchNegativeReviews(asinId, reviewPage - 1, reviewPageSize)
        : Promise.resolve({
            items: [],
            total: 0,
            page: 0,
            size: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false,
          }),
    [asinId, reviewPage]
  );

  // 合并loading和error状态
  const loading = loadingInfo || loadingHistory;
  const error = errorInfo || errorHistory;

  // ⚠️ 所有 Hooks (useMemo) 必须在条件返回之前调用
  // 否则会违反 React Hooks 规则导致 #310 错误
  const sortedHistoryItems: AsinHistoryPoint[] = useMemo(() => {
    const arr = (historyResp?.items as AsinHistoryPoint[] | undefined) || [];
    return [...arr].sort(
      (a, b) => dayjs(a.snapshotAt).valueOf() - dayjs(b.snapshotAt).valueOf()
    );
  }, [historyResp]);

  const historyPoints: HistoryPoint[] = useMemo(() => {
    try {
      const pts = sortedHistoryItems.map(mapHistoryPoint);
      logInfo('asin_detail_history_loaded', { asin, count: pts.length, range });
      return pts;
    } catch (e) {
      logError('asin_detail_history_map_failed', { asin, error: String(e) });
      return [];
    }
  }, [sortedHistoryItems, asin, range]);

  const priceSeries = useMemo(
    () => historyPoints.filter((p: HistoryPoint) => p.price !== undefined),
    [historyPoints]
  );
  const bsrSeries = useMemo(
    () => historyPoints.filter((p: HistoryPoint) => p.bsr !== undefined),
    [historyPoints]
  );
  // 新增: 小类BSR排名趋势
  const bsrSubcategorySeries = useMemo(
    () =>
      sortedHistoryItems
        .filter((p) => p.bsrSubcategoryRank !== undefined && p.bsrSubcategoryRank !== null)
        .map((p) => ({ timestamp: p.snapshotAt, value: p.bsrSubcategoryRank })),
    [sortedHistoryItems]
  );

  // 最新点：合并排序后的历史与 snapshot，取最大 snapshotAt
  const latest = useMemo(() => {
    const candidates: AsinHistoryPoint[] = [];
    if (sortedHistoryItems.length) candidates.push(...sortedHistoryItems);
    if (snapshot) candidates.push(snapshot as AsinHistoryPoint);
    if (!candidates.length) return null;
    return candidates.reduce((max, cur) =>
      dayjs(cur.snapshotAt).isAfter(dayjs(max.snapshotAt)) ? cur : max
    );
  }, [sortedHistoryItems, snapshot]);

  const debugDisableCharts =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debugCharts');
  const buildLineOption = (
    title: string,
    points: { timestamp: string; value: number | undefined }[],
    valueName: string
  ): EChartsOption => {
    const data = points.map((p) => (p.value == null ? null : p.value));
    const latestIndex = data.length - 1;
    const latestValue = latestIndex >= 0 ? data[latestIndex] : null;
    const latestTimestamp = latestIndex >= 0 ? points[latestIndex].timestamp : '';
    const markPointData: {
      name: string;
      type?: 'min' | 'max';
      coord?: [string, number];
      value?: number;
    }[] = [
      { type: 'max', name: '最大值' },
      { type: 'min', name: '最小值' },
    ];
    if (latestValue != null) {
      markPointData.push({
        name: '最新',
        coord: [latestTimestamp, latestValue],
        value: latestValue,
      });
    }
    try {
      const option: EChartsOption = {
        title: { text: title },
        tooltip: {
          trigger: 'axis',
          formatter: (params: unknown) => {
            // params 可能是数组（多序列），这里只取第一条
            const arr = Array.isArray(params) ? params : [params];
            return arr
              .map(
                (p: { marker?: string; seriesName?: string; value?: unknown }) =>
                  `${p.marker ?? ''}${p.seriesName ?? ''}: ${p.value ?? '-'}`
              )
              .join('<br/>');
          },
        },
        grid: { left: 50, right: 20, top: 50, bottom: 60 },
        xAxis: {
          type: 'category' as const,
          data: points.map((p) => dayjs(p.timestamp).format('YYYY-MM-DD HH:mm')),
        },
        yAxis: { type: 'value' as const, name: valueName, scale: true },
        dataZoom: [
          { type: 'inside', throttle: 50 },
          { type: 'slider', height: 30 },
        ],
        legend: { show: true },
        series: [
          {
            name: valueName,
            type: 'line',
            smooth: true,
            showSymbol: false,
            areaStyle: { opacity: 0.15 },
            data,
            markPoint: data.length ? { symbol: 'circle', data: markPointData } : undefined,
            lineStyle: { width: 2 },
          },
        ],
      };
      logInfo('chart_option_built', {
        title,
        points: points.length,
        latestValue,
        debugDisableCharts,
      });
      return option;
    } catch (e) {
      logError('asin_detail_chart_option_failed', { title, error: String(e) });
      return { title: { text: title } } as EChartsOption;
    }
  };

  // 条件返回必须在所有 Hooks 之后（React Hooks 规则）
  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div style={{ fontSize: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 12 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            border: '1px solid #d9d9d9',
            background: '#fff',
            padding: '4px 12px',
            cursor: 'pointer',
            borderRadius: 4,
            fontSize: 12,
          }}
          aria-label="返回上一页"
        >
          ← 返回
        </button>
        <h2 style={{ margin: 0, fontSize: '20px' }}>ASIN 详情: {asin}</h2>
      </div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="当前价格"
              value={latest?.price ?? '-'}
              prefix="$"
              valueStyle={{ fontSize: '20px' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="当前BSR"
              value={latest?.bsr ?? '-'}
              valueStyle={{ fontSize: '20px' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="当前库存"
              value={latest?.inventory ?? '-'}
              valueStyle={{ fontSize: '20px' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="BSR小类排名"
              value={latest?.bsrSubcategoryRank ?? '-'}
              valueStyle={{ fontSize: '20px' }}
            />
          </Card>
        </Col>
        <Col span={24}>
          <Card size="small">
            <div style={{ fontSize: '13px', color: '#666' }}>
              <strong>BSR小类分类:</strong> {latest?.bsrSubcategory || '-'}
            </div>
          </Card>
        </Col>
      </Row>
      <Radio.Group
        options={ranges}
        value={range}
        onChange={(e: RadioChangeEvent) => setRange(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      <div style={{ display: 'grid', gap: 24 }}>
        {debugDisableCharts ? (
          <div>图表已禁用 (debugCharts)</div>
        ) : (
          <ReactECharts
            option={buildLineOption(
              '价格趋势',
              priceSeries.map((p: HistoryPoint) => ({ timestamp: p.timestamp, value: p.price })),
              '价格'
            )}
          />
        )}
        {debugDisableCharts ? (
          <div>图表已禁用 (debugCharts)</div>
        ) : (
          <ReactECharts
            option={buildLineOption(
              'BSR趋势',
              bsrSeries.map((p: HistoryPoint) => ({ timestamp: p.timestamp, value: p.bsr })),
              'BSR'
            )}
          />
        )}
        {debugDisableCharts ? (
          <div>图表已禁用 (debugCharts)</div>
        ) : (
          <ReactECharts
            option={buildLineOption('小类BSR排名趋势', bsrSubcategorySeries, '小类BSR排名')}
          />
        )}
      </div>
      <div style={{ marginTop: 32 }}>
        <Tabs
          items={[
            {
              key: 'alerts',
              label: '告警记录',
              children: (
                <div>
                  <Space style={{ marginBottom: 12 }} wrap>
                    <Select
                      allowClear
                      placeholder="类型"
                      style={{ width: 160 }}
                      value={alertType}
                      onChange={(v) => {
                        setAlertPage(1);
                        setAlertType(v);
                      }}
                      options={[
                        { value: 'PRICE_CHANGE', label: '价格变动' },
                        { value: 'INVENTORY_THRESHOLD', label: '库存阈值' },
                        { value: 'TITLE', label: '标题变更' },
                        { value: 'MAIN_IMAGE', label: '主图变更' },
                        { value: 'BULLET_POINTS', label: '五点变更' },
                        { value: 'APLUS_CONTENT', label: 'A+变更' },
                        { value: 'NEGATIVE_REVIEW', label: '新差评' },
                      ]}
                    />
                    <DatePicker
                      value={fromDate}
                      onChange={(d) => {
                        setAlertPage(1);
                        setFromDate(d);
                      }}
                      placeholder="起始日期"
                    />
                    <DatePicker
                      value={toDate}
                      onChange={(d) => {
                        setAlertPage(1);
                        setToDate(d);
                      }}
                      placeholder="结束日期"
                    />
                  </Space>
                  {loadingAlerts ? (
                    <Loading />
                  ) : errorAlerts ? (
                    <ErrorMessage error={errorAlerts} />
                  ) : (
                    <AsinAlertsList alerts={(alertsResp?.items || []).map(mapAlertLog)} />
                  )}
                </div>
              ),
            },
            {
              key: 'reviews',
              label: '差评列表',
              children: loadingReviews ? (
                <Loading />
              ) : errorReviews ? (
                <ErrorMessage error={errorReviews} />
              ) : (
                <NegativeReviewsList
                  reviews={(reviewsResp?.items || []).map(mapReview)}
                  page={reviewPage}
                  pageSize={reviewPageSize}
                  total={reviewsResp?.total}
                  onPageChange={setReviewPage}
                />
              ),
            },
            {
              key: 'historyTable',
              label: '历史数据表格',
              children: <HistoryDataTable data={historyResp?.items || []} loading={loading} />,
            },
          ]}
        />
      </div>
    </div>
  );
};

export default AsinDetailPage;
