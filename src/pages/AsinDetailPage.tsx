import React, { useState, useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { HistoryPoint, AlertItem, ReviewItem, PageResponse, AsinHistoryPoint, AlertLogResponse, ReviewAlertResponse } from '../types';
import { mapHistoryPoint, mapAlertLog, mapReview } from '../api';
import { useFetch } from '../hooks/useFetch';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import ReactECharts from './ReactEChartsLazy';
import { Radio, Tabs, Space, Select, DatePicker, Card, Statistic, Row, Col, Divider } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { diffWords } from 'jsdiff';
import type { RadioChangeEvent } from 'antd/es/radio';
import AsinAlertsList from '../components/AsinAlertsList';
import NegativeReviewsList from '../components/NegativeReviewsList';

async function fetchHistory(id: string, range: string, page: number, size: number): Promise<PageResponse<AsinHistoryPoint>> {
  return apiRequest<PageResponse<AsinHistoryPoint>>(`/api/asin/${id}/history?range=${range}&page=${page}&size=${size}`);
}
async function fetchAsinAlerts(id: string, page: number, size: number, type?: string, from?: string, to?: string): Promise<PageResponse<AlertLogResponse>> {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  if (type) q.set('type', type);
  if (from) q.set('from', from);
  if (to) q.set('to', to);
  return apiRequest<PageResponse<AlertLogResponse>>(`/api/asin/${id}/alerts?${q.toString()}`);
}
async function fetchNegativeReviews(id: string, page: number, size: number): Promise<PageResponse<ReviewAlertResponse>> {
  return apiRequest<PageResponse<ReviewAlertResponse>>(`/api/asin/${id}/reviews?rating=negative&page=${page}&size=${size}`);
}
// content-diff 尚未在后端实现，先禁用 diff tab

const ranges = [
  { label: '7天', value: '7d' },
  { label: '30天', value: '30d' },
  { label: '90天', value: '90d' }
];

const AsinDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [range, setRange] = useState('30d');
  const [historyPage, setHistoryPage] = useState(1);
  const historyPageSize = 200; // 拉较大窗口用于图表
  const { data: historyResp, loading, error } = useFetch(() => fetchHistory(id!, range, historyPage - 1, historyPageSize), [id, range, historyPage]);
  const [alertPage, setAlertPage] = useState(1);
  const alertPageSize = 20;
  const [alertType, setAlertType] = useState<string | undefined>();
  const [fromDate, setFromDate] = useState<Dayjs | null>(dayjs().subtract(30, 'day'));
  const [toDate, setToDate] = useState<Dayjs | null>(dayjs());
  const { data: alertsResp, loading: loadingAlerts, error: errorAlerts } = useFetch(
    () => fetchAsinAlerts(
      id!,
      alertPage - 1,
      alertPageSize,
      alertType,
      fromDate ? fromDate.toISOString() : undefined,
      toDate ? toDate.toISOString() : undefined
    ),
    [id, alertPage, alertType, fromDate, toDate]
  );
  const [reviewPage, setReviewPage] = useState(1);
  const reviewPageSize = 20;
  const { data: reviewsResp, loading: loadingReviews, error: errorReviews } = useFetch(() => fetchNegativeReviews(id!, reviewPage - 1, reviewPageSize), [id, reviewPage]);
  function renderDiff(oldText?: string, newText?: string) {
    if (!oldText || !newText) return <div>无差异数据</div>;
  const parts = diffWords(oldText, newText);
    return (
      <div style={{ fontFamily: 'monospace', lineHeight: '1.6' }}>
  {parts.map((p: { value: string; added?: boolean; removed?: boolean }, i: number) => {
          const style: React.CSSProperties = p.added
            ? { background: '#e6ffed', color: '#096d00' }
            : p.removed
              ? { background: '#ffecec', color: '#a8071a', textDecoration: 'line-through' }
              : {};
          return <span key={i} style={style}>{p.value}</span>;
        })}
      </div>
    );
  }

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  const historyPoints: HistoryPoint[] = (historyResp?.items || []).map(mapHistoryPoint);
  const priceSeries = historyPoints.filter(p => p.price !== undefined);
  const bsrSeries = historyPoints.filter(p => p.bsr !== undefined);
  const inventorySeries = historyPoints.filter(p => p.inventory !== undefined);

  const latest = historyPoints[historyPoints.length - 1];
  const avgPrice = useMemo(() => {
    const arr = priceSeries.map(p => p.price!); return arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(2) : '-';
  }, [priceSeries]);
  const avgBsr = useMemo(() => {
    const arr = bsrSeries.map(p => p.bsr!); return arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : '-';
  }, [bsrSeries]);
  const avgInv = useMemo(() => {
    const arr = inventorySeries.map(p => p.inventory!); return arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : '-';
  }, [inventorySeries]);

  const buildLineOption = (title: string, points: { timestamp: string; value: number | undefined }[], valueName: string): EChartsOption => {
    const data = points.map(p => (p.value == null ? null : p.value));
    const latestIndex = data.length - 1;
    const latestValue = latestIndex >= 0 ? data[latestIndex] : null;
    const latestTimestamp = latestIndex >= 0 ? points[latestIndex].timestamp : '';
    const markPointData: any[] = [
      { type: 'max', name: '最大值' },
      { type: 'min', name: '最小值' }
    ];
    if (latestValue != null) {
      markPointData.push({ name: '最新', coord: [latestTimestamp, latestValue], value: latestValue });
    }
    return {
      title: { text: title },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          // params 可能是数组（多序列），这里只取第一条
          const arr = Array.isArray(params) ? params : [params];
          return arr.map(p => `${p.marker}${p.seriesName}: ${p.value ?? '-'}`).join('<br/>');
        }
      },
      grid: { left: 50, right: 20, top: 50, bottom: 60 },
      xAxis: { type: 'category' as const, data: points.map(p => p.timestamp) },
      yAxis: { type: 'value' as const, name: valueName, scale: true },
      dataZoom: [
        { type: 'inside', throttle: 50 },
        { type: 'slider', height: 30 }
      ],
      legend: { show: true },
      series: [{
        name: valueName,
        type: 'line',
        smooth: true,
        showSymbol: false,
        areaStyle: { opacity: 0.15 },
        data,
        markPoint: data.length ? { symbol: 'circle', data: markPointData } : undefined,
        lineStyle: { width: 2 },
      }]
    };
  };

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>ASIN 详情 #{id}</h2>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="当前价格" value={latest?.price ?? '-'} /></Card></Col>
        <Col span={6}><Card><Statistic title="平均价格" value={avgPrice} /></Card></Col>
        <Col span={6}><Card><Statistic title="当前BSR" value={latest?.bsr ?? '-'} /></Card></Col>
        <Col span={6}><Card><Statistic title="平均BSR" value={avgBsr} /></Card></Col>
        <Col span={6}><Card style={{ marginTop:16 }}><Statistic title="当前库存" value={latest?.inventory ?? '-'} /></Card></Col>
        <Col span={6}><Card style={{ marginTop:16 }}><Statistic title="平均库存" value={avgInv} /></Card></Col>
      </Row>
  <Radio.Group options={ranges} value={range} onChange={(e: RadioChangeEvent) => setRange(e.target.value)} style={{ marginBottom: 16 }} />
      <div style={{ display: 'grid', gap: 24 }}>
        <ReactECharts option={buildLineOption('价格趋势', priceSeries.map(p => ({ timestamp: p.timestamp, value: p.price })), '价格')} />
        <ReactECharts option={buildLineOption('BSR趋势', bsrSeries.map(p => ({ timestamp: p.timestamp, value: p.bsr })), 'BSR')} />
        <ReactECharts option={buildLineOption('库存趋势', inventorySeries.map(p => ({ timestamp: p.timestamp, value: p.inventory })), '库存')} />
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
                      onChange={(v) => { setAlertPage(1); setAlertType(v); }}
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
                    <DatePicker value={fromDate} onChange={(d) => { setAlertPage(1); setFromDate(d); }} placeholder="起始日期" />
                    <DatePicker value={toDate} onChange={(d) => { setAlertPage(1); setToDate(d); }} placeholder="结束日期" />
                  </Space>
                  {loadingAlerts ? <Loading /> : errorAlerts ? <ErrorMessage error={errorAlerts} /> : (
                    <AsinAlertsList alerts={(alertsResp?.items || []).map(mapAlertLog)} />
                  )}
                </div>
              )
            },
            {
              key: 'reviews',
              label: '差评列表',
              children: loadingReviews ? <Loading /> : errorReviews ? <ErrorMessage error={errorReviews} /> : (
                <NegativeReviewsList
                  reviews={(reviewsResp?.items || []).map(mapReview)}
                  page={reviewPage}
                  pageSize={reviewPageSize}
                  total={reviewsResp?.total}
                  onPageChange={setReviewPage}
                />
              )
            }
          ]}
        />
      </div>
    </div>
  );
};

export default AsinDetailPage;
