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
  Tooltip,
  Typography,
} from 'antd';
import { ThunderboltFilled, WarningOutlined } from '@ant-design/icons';
import { AsinItem, AlertItem, PageResponse, AlertLogResponse } from '../types';
import {
  fetchAsins,
  createAsin,
  updateAsin,
  deleteAsin,
  fetchAsinSnapshotByCode,
  CreateAsinDto,
  UpdateAsinDto,
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

  // 最新指标：后端直接在列表中返回 last* 字段（避免每行额外请求）；若后续需要更精确快照可追加单独聚合端点
  useEffect(() => {
    let isMounted = true;
    const asinRows: AsinItem[] = data?.items || [];

    const fetchMissingSnapshots = async () => {
      // 检查是否缺少关键数据（如标题），如果缺少则尝试补充
      const rowsToEnrich = asinRows.filter((r) => !r.lastTitle && !r.lastInventory);

      if (rowsToEnrich.length === 0) {
        setEnrichedRows(asinRows);
        return;
      }

      setLoadingSnapshots(true);
      try {
        const enriched = await Promise.all(
          asinRows.map(async (row) => {
            // 如果已有关键数据，直接返回
            if (row.lastTitle || row.lastInventory) return row;

            try {
              const snapshot = await fetchAsinSnapshotByCode(row.asin);
              return {
                ...row,
                lastTitle: snapshot.title,
                lastPrice: snapshot.price ?? row.lastPrice,
                lastBsr: snapshot.bsr ?? row.lastBsr,
                lastInventory: snapshot.inventory ?? row.lastInventory,
                lastBsrSubcategory: snapshot.bsrSubcategory ?? row.lastBsrSubcategory,
                lastBsrSubcategoryRank: snapshot.bsrSubcategoryRank ?? row.lastBsrSubcategoryRank,
                lastCouponValue: snapshot.couponValue ?? row.lastCouponValue,
                lastIsLightningDeal: snapshot.isLightningDeal ?? row.lastIsLightningDeal,
                lastBulletPoints: snapshot.bulletPoints ?? row.lastBulletPoints,
                lastAplusMd5: snapshot.aplusMd5 ?? row.lastAplusMd5,
              };
            } catch (e) {
              // 获取失败则保持原样
              return row;
            }
          })
        );

        if (isMounted) setEnrichedRows(enriched);
      } finally {
        if (isMounted) setLoadingSnapshots(false);
      }
    };

    fetchMissingSnapshots();

    return () => {
      isMounted = false;
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
    {
      title: '标题',
      dataIndex: 'lastTitle',
      width: 200,
      render: (v: string) => (
        <Tooltip title={v}>
          <Typography.Text ellipsis style={{ width: 180, display: 'block' }}>
            {v || '-'}
          </Typography.Text>
        </Tooltip>
      ),
    },
    {
      title: '库存',
      dataIndex: 'lastInventory',
      width: 100,
      render: (val: number | undefined, record: AsinItem) => {
        if (val === undefined || val === null) return '-';
        const isLow = record.inventoryThreshold && val < record.inventoryThreshold;
        const isLimited = record.inventoryLimited;
        
        return (
          <Space size={4}>
            <Typography.Text type={isLow ? 'danger' : undefined} strong={isLow}>
              {val > 999 ? '999+' : val}
            </Typography.Text>
            {isLimited && (
              <Tooltip title="检测到限购，库存可能不准确">
                <WarningOutlined style={{ color: '#faad14', fontSize: 12 }} />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: '价格 / BSR',
      dataIndex: 'lastPrice',
      width: 160,
      render: (price: number | undefined, record: AsinItem) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Space size={4}>
            <Typography.Text strong>{price ? `$${price}` : '-'}</Typography.Text>
            {record.lastCouponValue && (
              <Tooltip title={`Coupon: ${record.lastCouponValue}`}>
                <Tag color="green" style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>
                  券
                </Tag>
              </Tooltip>
            )}
            {record.lastIsLightningDeal && (
              <Tooltip title="秒杀进行中">
                <ThunderboltFilled style={{ color: '#faad14' }} />
              </Tooltip>
            )}
          </Space>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {record.lastBsr ? `#${record.lastBsr}` : '-'}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '小类BSR',
      dataIndex: 'lastBsrSubcategoryRank',
      width: 150,
      render: (v: number, r: AsinItem) => (
        <div>
          {v ? `#${v}` : '-'}
          {r.lastBsrSubcategory && (
            <div style={{ fontSize: 12, color: '#999', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {r.lastBsrSubcategory}
            </div>
          )}
        </div>
      ),
    },
    { title: '评论数', dataIndex: 'totalReviews', width: 80 },
    { title: '评分', dataIndex: 'avgRating', width: 80 },
    {
      title: 'A+',
      dataIndex: 'lastAplusMd5',
      width: 80,
      render: (v: string) => (v ? <Tag color="green">有</Tag> : <Tag>无</Tag>),
    },
    {
      title: '五点',
      dataIndex: 'lastBulletPoints',
      width: 100,
      render: (v: string) => (
        <Tooltip title={<div style={{ whiteSpace: 'pre-wrap' }}>{v}</div>}>
          <Typography.Text ellipsis style={{ width: 80, display: 'block', cursor: 'pointer' }}>
            {v ? '查看' : '-'}
          </Typography.Text>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right' as const,
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
        scroll={{ x: 1600 }}
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
