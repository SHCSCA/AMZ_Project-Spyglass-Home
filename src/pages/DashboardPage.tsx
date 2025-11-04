import React, { useState } from 'react';
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
} from 'antd';
import { apiRequest } from '../api/client';
import { AsinItem, PageResponse, AsinResponse, AlertLogResponse, AlertItem } from '../types';
import { ensurePageResponse } from '../api/adapters';
import { mapAsin, mapAlertLog } from '../api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { useFetch } from '../hooks/useFetch';
import { useNavigate } from 'react-router-dom';

async function fetchAsins(page: number, size: number): Promise<PageResponse<AsinResponse>> {
  const raw = await apiRequest<unknown>(`/api/asin?page=${page}&size=${size}`);
  return ensurePageResponse<AsinResponse>(raw, page, size);
}
async function fetchAlerts(): Promise<PageResponse<AlertLogResponse>> {
  const raw = await apiRequest<unknown>('/api/alerts?page=0&size=200'); // 拉取较多用于红点判断
  return ensurePageResponse<AlertLogResponse>(raw, 0, 500);
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const { data, loading, error, reload } = useFetch(() => fetchAsins(page - 1, pageSize), [page]);
  const { data: alertsResp } = useFetch(fetchAlerts, []);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState<AsinItem | null>(null);
  const [form] = Form.useForm<Partial<AsinItem>>();

  const handleAdd = async () => {
    const values = await form.validateFields();
    await apiRequest('/api/asin', { method: 'POST', body: JSON.stringify(values) });
    setOpenAdd(false);
    form.resetFields();
    reload();
  };

  const handleEdit = async () => {
    if (!openEdit) return;
    const values = await form.validateFields();
    await apiRequest(`/api/asin/${openEdit.id}/config`, {
      method: 'PUT',
      body: JSON.stringify(values),
    });
    setOpenEdit(null);
    form.resetFields();
    reload();
  };

  const handleDelete = async (record: AsinItem) => {
    await apiRequest(`/api/asin/${record.id}`, { method: 'DELETE' });
    reload();
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  const asinRows: AsinItem[] = (data?.items || []).map(mapAsin);
  const alertItems: AlertItem[] = (alertsResp?.items || []).map(mapAlertLog);

  const columns = [
    {
      title: '昵称 / ASIN',
      dataIndex: 'nickname',
      render: (_: unknown, record: AsinItem) => {
        const hasNewAlert = alertItems.some((a) => a.asinId === record.id && a.status === 'NEW');
        return (
          <Badge dot={hasNewAlert} offset={[0, 0]}>
            <Button type="link" onClick={() => navigate(`/asin/${record.id}`)}>
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
        dataSource={asinRows}
        columns={columns}
        pagination={{
          current: page,
          total: data?.total || 0,
          pageSize,
          onChange: (p) => setPage(p),
        }}
      />

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
