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
  message,
  Empty,
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
              lastBsrSubcategoryRank: latest.bsrSubcategoryRank,
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
      message.success('添加 ASIN 成功');
      setOpenAdd(false);
      form.resetFields();
      reload();
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('Add ASIN failed:', err);
      message.error('添加失败，请检查输入或稍后重试');
    }
  };

  const handleEdit = async () => {
    if (!openEdit) return;
    try {
      const values = await form.validateFields();
      await updateAsin(openEdit.id, values as UpdateAsinDto);
      if (!mountedRef.current) return;
      message.success('更新 ASIN 成功');
      setOpenEdit(null);
      form.resetFields();
      reload();
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('Edit ASIN failed:', err);
      message.error('更新失败，请稍后重试');
    }
  };

  const handleDelete = async (record: AsinItem) => {
    try {
      await deleteAsin(record.id);
      if (!mountedRef.current) return;
      message.success('删除 ASIN 成功');
      reload();
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('Delete ASIN failed:', err);
      message.error('删除失败，请稍后重试');
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

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
    { title: '小类BSR', dataIndex: 'lastBsrSubcategoryRank', render: (v: number) => v ?? '-' },
    { title: '评论数', dataIndex: 'totalReviews' },
    { title: '评分', dataIndex: 'avgRating' },
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
        loading={loadingSnapshots}
        locale={{
          emptyText: (
            <Empty
              description={selectedGroupId ? '该分组暂无 ASIN 数据' : '暂无 ASIN 数据'}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" onClick={() => setOpenAdd(true)}>
                添加第一个 ASIN
              </Button>
            </Empty>
          ),
        }}
        pagination={{
          current: page,
          total: data?.total || 0,
          pageSize,
          onChange: (p) => setPage(p),
          showSizeChanger: false,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
      />

      <Modal
        title="添加ASIN"
        open={openAdd}
        onOk={handleAdd}
        onCancel={() => {
          setOpenAdd(false);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="asin"
            label="ASIN 码"
            rules={[
              { required: true, message: '请输入 ASIN 码' },
              { pattern: /^[A-Z0-9]{10}$/, message: 'ASIN 码必须是10位字母数字组合' },
            ]}
          >
            <Input placeholder="例如：B08N5WRWNW" />
          </Form.Item>
          <Form.Item name="site" label="站点" rules={[{ required: true, message: '请输入站点' }]}>
            <Input placeholder="例如：US, UK, DE, JP" />
          </Form.Item>
          <Form.Item name="nickname" label="昵称（可选）">
            <Input placeholder="为该 ASIN 设置一个易记的名称" />
          </Form.Item>
          <Form.Item name="brand" label="品牌（可选）">
            <Input placeholder="品牌名称" />
          </Form.Item>
          <Form.Item name="groupId" label="所属分组（可选）">
            <Select
              placeholder="选择分组"
              allowClear
              options={groupOptions.filter((g) => g.value !== undefined)}
            />
          </Form.Item>
          <Form.Item name="inventoryThreshold" label="库存阈值（可选）">
            <InputNumber style={{ width: '100%' }} min={0} placeholder="低于此值将触发告警" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑ASIN"
        open={!!openEdit}
        onOk={handleEdit}
        onCancel={() => {
          setOpenEdit(null);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="nickname" label="昵称（可选）">
            <Input placeholder="为该 ASIN 设置一个易记的名称" />
          </Form.Item>
          <Form.Item name="brand" label="品牌（可选）">
            <Input placeholder="品牌名称" />
          </Form.Item>
          <Form.Item name="groupId" label="所属分组（可选）">
            <Select
              placeholder="选择分组"
              allowClear
              options={groupOptions.filter((g) => g.value !== undefined)}
            />
          </Form.Item>
          <Form.Item name="inventoryThreshold" label="库存阈值（可选）">
            <InputNumber style={{ width: '100%' }} min={0} placeholder="低于此值将触发告警" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DashboardPage;
