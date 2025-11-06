import React, { useState, useEffect, useRef } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  Popconfirm,
  Badge,
  Tag,
  Select,
} from 'antd';
import { AsinItem, AlertItem, PageResponse, AlertLogResponse } from '../types';
import {
  fetchAsins,
  createAsin,
  updateAsin,
  deleteAsin,
  CreateAsinDto,
  UpdateAsinDto,
  fetchLatestSnapshot,
} from '../api/asinApi';
import { fetchGroups, GroupResponse } from '../api/groupApi';
import { apiRequest } from '../api/client';
import { ensurePageResponse } from '../api/adapters';
import { mapAlertLog } from '../api/mappers';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { useFetch } from '../hooks/useFetch';
import { useNavigate } from 'react-router-dom';

// 获取告警列表
async function fetchAlertsList(): Promise<PageResponse<AlertLogResponse>> {
  const raw = await apiRequest<unknown>('/api/alerts?page=0&size=200');
  return ensurePageResponse<AlertLogResponse>(raw, 0, 200);
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(undefined);
  const pageSize = 20;
  const mountedRef = useRef(true);

  // 聚合后的行（带最新快照字段）- 移到顶部避免 Hooks 顺序问题
  const [enrichedRows, setEnrichedRows] = useState<AsinItem[]>([]);
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const { data, loading, error, reload } = useFetch(
    () => fetchAsins(page - 1, pageSize, selectedGroupId),
    [page, selectedGroupId]
  );
  const { data: alertsResp } = useFetch(fetchAlertsList, []);
  const { data: groupsResp } = useFetch(() => fetchGroups(0, 100), []);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState<AsinItem | null>(null);
  const [form] = Form.useForm<Partial<CreateAsinDto>>();

  // useEffect 处理聚合快照数据
  useEffect(() => {
    const asinRows: AsinItem[] = data?.items || [];
    let cancelled = false;
    async function enrich() {
      if (!asinRows.length) {
        if (!cancelled && mountedRef.current) setEnrichedRows([]);
        return;
      }
      if (!cancelled && mountedRef.current) setLoadingSnapshots(true);
      try {
        const results = await Promise.all(
          asinRows.map(async (row) => {
            const latest = await fetchLatestSnapshot(row.id);
            if (!latest) return row; // 无快照则保持原始行
            return {
              ...row,
              lastPrice: latest.price,
              lastBsr: latest.bsr,
              lastInventory: latest.inventory,
              totalReviews: latest.totalReviews,
              avgRating: latest.avgRating,
            };
          })
        );
        if (!cancelled && mountedRef.current) setEnrichedRows(results);
      } catch (err) {
        console.error('Enrich snapshots failed:', err);
        if (!cancelled && mountedRef.current) setEnrichedRows(asinRows); // 失败时回退原始数据
      } finally {
        if (!cancelled && mountedRef.current) setLoadingSnapshots(false);
      }
    }
    enrich();
    return () => {
      cancelled = true;
    };
  }, [data]);

  const handleAdd = async () => {
    try {
      const values = await form.validateFields();
      await createAsin(values as CreateAsinDto);
      if (!mountedRef.current) return;
      setOpenAdd(false);
      form.resetFields();
      reload();
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('Add ASIN failed:', err);
    }
  };

  const handleEdit = async () => {
    if (!openEdit) return;
    try {
      const values = await form.validateFields();
      await updateAsin(openEdit.id, values as UpdateAsinDto);
      if (!mountedRef.current) return;
      setOpenEdit(null);
      form.resetFields();
      reload();
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('Edit ASIN failed:', err);
    }
  };

  const handleDelete = async (record: AsinItem) => {
    try {
      await deleteAsin(record.id);
      if (!mountedRef.current) return;
      reload();
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('Delete ASIN failed:', err);
    }
  };

  if (loading) return <Loading />;
  if (error)
    return (
      <div>
        <ErrorMessage error={error} />
        <div style={{ marginTop: 12, fontSize: 12, color: '#999' }}>
          如果看到跨域(CORS)相关错误，请确认生产部署已使用相对路径构建（VITE_API_BASE_URL
          为空或同源），并由 nginx 反向代理 /api。
        </div>
      </div>
    );

  const asinRows: AsinItem[] = data?.items || [];
  const alertItems: AlertItem[] = (alertsResp?.items || []).map(mapAlertLog);
  const groupOptions = [
    { label: '全部分组', value: undefined },
    ...(groupsResp?.items || []).map((g: GroupResponse) => ({
      label: g.name,
      value: g.id,
    })),
  ];

  const columns = [
    {
      title: '昵称 / ASIN',
      dataIndex: 'nickname',
      render: (_: unknown, record: AsinItem) => {
        const hasNewAlert = alertItems.some((a) => a.asinId === record.id && a.status === 'NEW');
        return (
          <Badge dot={hasNewAlert} offset={[0, 0]}>
            <Button type="link" onClick={() => navigate(`/asin/${record.asin}`)}>
              {record.nickname || record.asin}
            </Button>
          </Badge>
        );
      },
    },
    { title: '站点', dataIndex: 'site' },
    { title: '品牌', dataIndex: 'brand' },
    {
      title: '分组',
      dataIndex: 'groupName',
      render: (v: string, r: AsinItem) =>
        v ? <Tag color="blue">{v}</Tag> : r.groupId ? <Tag>{r.groupId}</Tag> : '-',
    },
    { title: '最新价格', dataIndex: 'lastPrice' },
    { title: '最新BSR', dataIndex: 'lastBsr' },
    { title: '最新库存', dataIndex: 'lastInventory' },
    { title: '评论数', dataIndex: 'totalReviews' },
    { title: '评分', dataIndex: 'avgRating' },
    { title: '库存阈值', dataIndex: 'inventoryThreshold' },
    {
      title: '操作',
      render: (_: unknown, record: AsinItem) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              setOpenEdit(record);
              form.setFieldsValue(record);
            }}
          >
            编辑
          </Button>
          <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record)}>
            <Button danger type="link">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Select
          style={{ width: 200 }}
          value={selectedGroupId}
          onChange={(val) => {
            setSelectedGroupId(val);
            setPage(1); // 切换分组时重置到第一页
          }}
          options={groupOptions}
        />
        <Button
          type="primary"
          onClick={() => {
            setOpenAdd(true);
            form.resetFields();
          }}
        >
          添加ASIN
        </Button>
      </Space>
      <Table
        rowKey="id"
        dataSource={enrichedRows.length ? enrichedRows : asinRows}
        columns={columns}
        pagination={{
          current: page,
          total: data?.total || 0,
          pageSize,
          onChange: (p) => setPage(p),
        }}
      />
      {loadingSnapshots && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>正在加载最新快照数据...</div>
      )}

      <Modal title="添加ASIN" open={openAdd} onOk={handleAdd} onCancel={() => setOpenAdd(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="asin" label="ASIN" rules={[{ required: true }]}>
            {' '}
            <Input />{' '}
          </Form.Item>
          <Form.Item name="site" label="站点" rules={[{ required: true }]}>
            {' '}
            <Input />{' '}
          </Form.Item>
          <Form.Item name="nickname" label="昵称">
            {' '}
            <Input />{' '}
          </Form.Item>
          <Form.Item name="inventoryThreshold" label="库存阈值">
            {' '}
            <InputNumber style={{ width: '100%' }} />{' '}
          </Form.Item>
          <Form.Item name="brand" label="品牌">
            {' '}
            <Input />{' '}
          </Form.Item>
          <Form.Item name="groupId" label="分组ID">
            {' '}
            <InputNumber style={{ width: '100%' }} />{' '}
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑ASIN"
        open={!!openEdit}
        onOk={handleEdit}
        onCancel={() => setOpenEdit(null)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="site" label="站点" rules={[{ required: true }]}>
            {' '}
            <Input />{' '}
          </Form.Item>
          <Form.Item name="nickname" label="昵称">
            {' '}
            <Input />{' '}
          </Form.Item>
          <Form.Item name="inventoryThreshold" label="库存阈值">
            {' '}
            <InputNumber style={{ width: '100%' }} />{' '}
          </Form.Item>
          <Form.Item name="brand" label="品牌">
            {' '}
            <Input />{' '}
          </Form.Item>
          <Form.Item name="groupId" label="分组ID">
            {' '}
            <InputNumber style={{ width: '100%' }} />{' '}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DashboardPage;
