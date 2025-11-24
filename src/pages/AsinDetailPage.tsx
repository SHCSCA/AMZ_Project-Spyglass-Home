import React, { useCallback, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import { ArrowLeftOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  DatePicker,
  message,
  Radio,
  Row,
  Col,
  Select,
  Space,
  Tabs,
  Typography,
} from 'antd';
import type { RadioChangeEvent } from 'antd/es/radio';
import { DEFAULT_ALERT_RANGE_DAYS } from '../constants/config';
import { apiRequest } from '../api/client';
import { fetchAsinDetail } from '../api/asinApi';
import { ensurePageResponse } from '../api/adapters';
import { mapAlertLog, mapReview } from '../api';
import { useFetch } from '../hooks/useFetch';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import ProfitHeader from '../components/Business/ProfitHeader';
import CombinedChart from '../components/Business/TrendAnalysis/CombinedChart';
import KeywordManager from '../components/Business/KeywordManager';
import RankingChart from '../components/Business/RankingChart';
import CostConfigModal, { CostConfigFormValues } from '../components/Business/CostConfigModal';
import AsinAlertsList from '../components/AsinAlertsList';
import NegativeReviewsList from '../components/NegativeReviewsList';
import HistoryDataTable from '../components/HistoryDataTable';
import { fetchAsinCost, upsertAsinCost } from '../api/asinCostApi';
import {
  createAsinKeyword,
  deleteAsinKeyword,
  fetchAsinKeywords,
  fetchKeywordRankTrend,
} from '../api/keywordApi';
import type {
  AlertLogResponse,
  AsinCost,
  AsinHistoryPoint,
  AsinHistorySnapshot,
  AsinKeyword,
  AsinResponse,
  KeywordRankPoint,
  PageResponse,
  ReviewAlertResponse,
} from '../types';

const ranges = [
  { label: '7天', value: '7d' },
  { label: '30天', value: '30d' },
  { label: '90天', value: '90d' },
];

const emptyPage = {
  items: [] as unknown[],
  total: 0,
  page: 0,
  size: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

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

const AsinDetailPage: React.FC = () => {
  const { asin } = useParams<{ asin: string }>();
  const navigate = useNavigate();
  const [historyRange, setHistoryRange] = useState('30d');
  const [keywordRange, setKeywordRange] = useState('30d');
  const [costModalOpen, setCostModalOpen] = useState(false);
  const [savingCost, setSavingCost] = useState(false);
  const [optimisticKeyword, setOptimisticKeyword] = useState<string | null>(null);
  const [alertPage, setAlertPage] = useState(1);
  const [alertType, setAlertType] = useState<string | undefined>();
  const [fromDate, setFromDate] = useState<Dayjs | null>(dayjs().subtract(DEFAULT_ALERT_RANGE_DAYS, 'day'));
  const [toDate, setToDate] = useState<Dayjs | null>(dayjs());
  const [reviewPage, setReviewPage] = useState(1);
  const historyPageSize = 200;
  const alertPageSize = 20;
  const reviewPageSize = 20;

  const {
    data: asinInfoOrSnapshot,
    loading: loadingInfo,
    error: errorInfo,
  } = useFetch<AsinResponse | AsinHistorySnapshot | null>(() => {
    if (!asin) return Promise.resolve(null);
    return /^\d+$/.test(asin) ? fetchAsinDetail(Number(asin)) : fetchAsinSnapshotByCode(asin);
  }, [asin]);

  const asinId = useMemo(() => {
    if (!asinInfoOrSnapshot) return undefined;
    if ('asinId' in (asinInfoOrSnapshot as AsinHistorySnapshot)) {
      return (asinInfoOrSnapshot as AsinHistorySnapshot).asinId;
    }
    return (asinInfoOrSnapshot as AsinResponse).id;
  }, [asinInfoOrSnapshot]);


  const snapshot = useMemo(
    () =>
      asinInfoOrSnapshot && 'snapshotAt' in (asinInfoOrSnapshot as AsinHistorySnapshot)
        ? (asinInfoOrSnapshot as AsinHistorySnapshot)
        : null,
    [asinInfoOrSnapshot]
  );

  const shouldFetchDetailById = useMemo(() => {
    if (!asinId) return false;
    if (!asinInfoOrSnapshot) return true;
    return !('asin' in (asinInfoOrSnapshot as AsinResponse));
  }, [asinId, asinInfoOrSnapshot]);

  const {
    data: asinDetailById,
    loading: loadingDetailById,
  } = useFetch<AsinResponse | null>(
    () => (shouldFetchDetailById && asinId ? fetchAsinDetail(asinId) : Promise.resolve(null)),
    [asinId, shouldFetchDetailById]
  );

  const asinInfo = useMemo<AsinResponse | null>(() => {
    if (asinInfoOrSnapshot && 'asin' in (asinInfoOrSnapshot as AsinResponse)) {
      return asinInfoOrSnapshot as AsinResponse;
    }
    return asinDetailById ?? null;
  }, [asinInfoOrSnapshot, asinDetailById]);

  const asinCode = useMemo(() => {
    if (asinInfo?.asin) return asinInfo.asin;
    if (asinInfoOrSnapshot && 'asin' in (asinInfoOrSnapshot as AsinResponse)) {
      return (asinInfoOrSnapshot as AsinResponse).asin;
    }
    if (asin && !/^\d+$/.test(asin)) return asin;
    return undefined;
  }, [asinInfo, asinInfoOrSnapshot, asin]);

  const {
    data: historyResp,
    loading: loadingHistory,
    error: errorHistory,
  } = useFetch<PageResponse<AsinHistoryPoint>>(
    () =>
      asinId
        ? fetchHistory(asinId, historyRange, 0, historyPageSize)
        : Promise.resolve(emptyPage as PageResponse<AsinHistoryPoint>),
    [asinId, historyRange]
  );

  const {
    data: alertsResp,
    loading: loadingAlerts,
    error: errorAlerts,
  } = useFetch<PageResponse<AlertLogResponse>>(
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
        : Promise.resolve(emptyPage as PageResponse<AlertLogResponse>),
    [asinId, alertPage, alertType, fromDate, toDate]
  );

  const {
    data: reviewsResp,
    loading: loadingReviews,
    error: errorReviews,
  } = useFetch<PageResponse<ReviewAlertResponse>>(
    () =>
      asinId
        ? fetchNegativeReviews(asinId, reviewPage - 1, reviewPageSize)
        : Promise.resolve(emptyPage as PageResponse<ReviewAlertResponse>),
    [asinId, reviewPage]
  );

  const {
    data: costData,
    loading: loadingCost,
    reload: reloadCost,
  } = useFetch<AsinCost | null>(() => (asinCode ? fetchAsinCost(asinCode) : Promise.resolve(null)), [asinCode]);

  const {
    data: keywordListResp,
    loading: loadingKeywords,
    reload: reloadKeywords,
  } = useFetch<AsinKeyword[]>(
    () => (asinCode ? fetchAsinKeywords(asinCode) : Promise.resolve([])),
    [asinCode]
  );

  const {
    data: keywordTrendResp,
    loading: loadingKeywordTrend,
    reload: reloadKeywordTrend,
  } = useFetch<KeywordRankPoint[]>(
    () => (asinCode ? fetchKeywordRankTrend(asinCode, keywordRange) : Promise.resolve([])),
    [asinCode, keywordRange]
  );

  const loadingInitial = loadingInfo || loadingHistory || loadingDetailById;
  const error = errorInfo || errorHistory;

  const historyItems = useMemo(
    () => (historyResp?.items as AsinHistoryPoint[] | undefined) ?? [],
    [historyResp]
  );

  const sortedHistoryItems = useMemo(
    () =>
      [...historyItems].sort(
        (a, b) => dayjs(a.snapshotAt).valueOf() - dayjs(b.snapshotAt).valueOf()
      ),
    [historyItems]
  );

  const latestSnapshot = useMemo(() => {
    if (!sortedHistoryItems.length && !snapshot) return null;
    const merged: AsinHistoryPoint[] = [];
    if (sortedHistoryItems.length) merged.push(...sortedHistoryItems);
    if (snapshot) merged.push(snapshot);
    return merged
      .sort((a, b) => dayjs(b.snapshotAt).valueOf() - dayjs(a.snapshotAt).valueOf())
      .shift() ?? null;
  }, [sortedHistoryItems, snapshot]);

  const keywords = useMemo(() => keywordListResp ?? [], [keywordListResp]);
  const keywordTrend = useMemo(() => keywordTrendResp ?? [], [keywordTrendResp]);
  const alerts = useMemo(() => (alertsResp?.items ?? []).map(mapAlertLog), [alertsResp]);
  const reviews = useMemo(() => (reviewsResp?.items ?? []).map(mapReview), [reviewsResp]);
  const totalAlerts = alertsResp?.total ?? alerts.length;
  const totalReviews = reviewsResp?.total ?? reviews.length;

  const handleCostSubmit = useCallback(
    async (values: CostConfigFormValues) => {
      if (!asinCode) {
        message.warning('暂未获取到 ASIN 编码，稍后再试');
        return;
      }
      try {
        setSavingCost(true);
        await upsertAsinCost(asinCode, {
          purchaseCost: Number(values.purchaseCost ?? 0),
          shippingCost: values.shippingCost ?? 0,
          fbaFee: values.fbaFee ?? 0,
          tariffRate: values.tariffRate ?? 0,
          otherCost: values.otherCost ?? 0,
        });
        message.success('成本配置已保存');
        setCostModalOpen(false);
        await reloadCost();
      } catch (err) {
        message.error('成本配置保存失败');
      } finally {
        setSavingCost(false);
      }
    },
    [asinCode, reloadCost]
  );

  const handleAddKeyword = useCallback(
    async (keyword: string) => {
      if (!asinCode) {
        message.warning('暂未获取到 ASIN 编码，暂无法添加关键词');
        return;
      }
      setOptimisticKeyword(keyword);
      try {
        await createAsinKeyword(asinCode, { keyword });
        message.success('关键词已添加');
        await Promise.all([reloadKeywords(), reloadKeywordTrend()]);
      } catch (err) {
        message.error('添加关键词失败');
      } finally {
        setOptimisticKeyword(null);
      }
    },
    [asinCode, reloadKeywords, reloadKeywordTrend]
  );

  const handleDeleteKeyword = useCallback(
    async (keywordId: number) => {
      if (!asinCode) {
        message.warning('暂未获取到 ASIN 编码，暂无法删除关键词');
        return;
      }
      try {
        await deleteAsinKeyword(asinCode, keywordId);
        message.success('关键词已删除');
        await Promise.all([reloadKeywords(), reloadKeywordTrend()]);
      } catch (err) {
        message.error('删除关键词失败');
      }
    },
    [asinCode, reloadKeywords, reloadKeywordTrend]
  );

  const handleHistoryRangeChange = useCallback((event: RadioChangeEvent) => {
    setHistoryRange(event.target.value);
  }, []);

  const handleKeywordRangeChange = useCallback((event: RadioChangeEvent) => {
    setKeywordRange(event.target.value);
  }, []);

  if (loadingInitial) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  const trendTab = (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card
        bodyStyle={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Space align="center" wrap>
          <Typography.Text type="secondary">时间范围</Typography.Text>
          <Radio.Group
            options={ranges}
            value={historyRange}
            onChange={handleHistoryRangeChange}
            optionType="button"
            buttonStyle="solid"
          />
        </Space>
        <Typography.Text type="secondary">
          最新快照：{latestSnapshot ? dayjs(latestSnapshot.snapshotAt).format('YYYY-MM-DD HH:mm') : '暂无数据'}
        </Typography.Text>
      </Card>
      <CombinedChart points={sortedHistoryItems} loading={loadingHistory} />
      <Card title="历史数据表格" bodyStyle={{ padding: 0 }}>
        <HistoryDataTable data={historyItems} loading={loadingHistory} />
      </Card>
      <Card
        title={`告警记录 (${totalAlerts})`}
        extra={
          <Typography.Link
            onClick={() => {
              setAlertType(undefined);
              setFromDate(dayjs().subtract(DEFAULT_ALERT_RANGE_DAYS, 'day'));
              setToDate(dayjs());
              setAlertPage(1);
            }}
          >
            重置筛选
          </Typography.Link>
        }
      >
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            allowClear
            placeholder="类型"
            style={{ width: 180 }}
            value={alertType}
            onChange={(value) => {
              setAlertPage(1);
              setAlertType(value);
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
            onChange={(value) => {
              setAlertPage(1);
              setFromDate(value);
            }}
            placeholder="起始日期"
          />
          <DatePicker
            value={toDate}
            onChange={(value) => {
              setAlertPage(1);
              setToDate(value);
            }}
            placeholder="结束日期"
          />
        </Space>
        {loadingAlerts ? (
          <Loading />
        ) : errorAlerts ? (
          <ErrorMessage error={errorAlerts} />
        ) : (
          <AsinAlertsList alerts={alerts} />
        )}
      </Card>
    </Space>
  );

  const keywordsTab = (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={10}>
        <KeywordManager
          keywords={keywords}
          loading={loadingKeywords}
          onAddKeyword={handleAddKeyword}
          onDeleteKeyword={handleDeleteKeyword}
          optimisticKeyword={optimisticKeyword}
        />
      </Col>
      <Col xs={24} lg={14}>
        <Card
          title="关键词排名趋势"
          extra={
            <Radio.Group
              options={ranges}
              value={keywordRange}
              onChange={handleKeywordRangeChange}
              optionType="button"
              buttonStyle="solid"
            />
          }
          bodyStyle={{ padding: 0, minHeight: 360 }}
        >
          <div style={{ padding: 24 }}>
            <RankingChart points={keywordTrend} loading={loadingKeywordTrend} height={360} />
          </div>
        </Card>
      </Col>
    </Row>
  );

  const reviewTab = (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Space align="center" size="middle">
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#6366F1' }} />
          <Typography.Text strong>AI 分析中...</Typography.Text>
          <Typography.Text type="secondary">评论语义洞察即将上线，敬请期待。</Typography.Text>
        </Space>
      </Card>
      {loadingReviews ? (
        <Loading />
      ) : errorReviews ? (
        <ErrorMessage error={errorReviews} />
      ) : (
        <NegativeReviewsList
          reviews={reviews}
          page={reviewPage}
          pageSize={reviewPageSize}
          total={totalReviews}
          onPageChange={setReviewPage}
        />
      )}
    </Space>
  );

  const tabItems = [
    { key: 'trend', label: '趋势监控', children: trendTab },
    { key: 'keywords', label: '流量与排名', children: keywordsTab },
    { key: 'reviews', label: '评论洞察', children: reviewTab },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', paddingBottom: 48 }}>
      <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ paddingLeft: 0 }}>
        返回
      </Button>
      <div>
        <Typography.Title level={3} style={{ marginBottom: 0 }}>
          ASIN 详情驾驶舱
        </Typography.Title>
        <Typography.Text type="secondary">
          {(asinInfo?.asin ?? asin) || '未命名'} · {asinInfo?.site ?? '未知站点'}
        </Typography.Text>
      </div>
      <ProfitHeader
        asinInfo={asinInfo ?? undefined}
        snapshot={latestSnapshot}
        cost={costData ?? undefined}
        loading={loadingCost}
        onConfigureCost={() => setCostModalOpen(true)}
      />
      <Tabs items={tabItems} defaultActiveKey="trend" destroyInactiveTabPane animated />
      <CostConfigModal
        open={costModalOpen}
        onCancel={() => setCostModalOpen(false)}
        onSubmit={handleCostSubmit}
        loading={savingCost}
        price={latestSnapshot?.price ?? asinInfo?.lastPrice ?? null}
        initialCost={costData ?? null}
      />
    </Space>
  );
};

export default AsinDetailPage;
