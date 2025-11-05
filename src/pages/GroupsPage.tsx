/**
 * 分组管理页面 (替代原先在 Dashboard 中的 Modal 入口)
 * 功能: 分组列表 + 分页 + 新增/编辑/删除
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Table,
  Space,
  Popconfirm,
  message,
  Typography,
  Divider,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useFetch } from '../hooks/useFetch';
import { fetchGroups, createGroup, updateGroup, deleteGroup, GroupResponse } from '../api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

const { Title, Text } = Typography;

const GroupsPage: React.FC = () => {
  const [form] = Form.useForm<{ name: string; description?: string }>();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const { data, loading, error, reload } = useFetch(() => fetchGroups(page - 1, pageSize), [page]);

  const handleAdd = async () => {
    try {
      const values = await form.validateFields();
      await createGroup(values);
      if (!mountedRef.current) return;
      message.success('分组创建成功');
      form.resetFields();
      reload();
    } catch (err) {
      if (!mountedRef.current) return;
      message.error(`创建失败: ${err}`);
    }
  };

  const startEdit = (record: GroupResponse) => {
    setEditingId(record.id);
    form.setFieldsValue({ name: record.name, description: record.description });
  };

  const cancelEdit = () => {
    setEditingId(null);
    form.resetFields();
  };

  const saveEdit = async (id: number) => {
    try {
      const values = await form.validateFields();
      await updateGroup(id, values);
      if (!mountedRef.current) return;
      message.success('分组更新成功');
      setEditingId(null);
      form.resetFields();
      reload();
    } catch (err) {
      if (!mountedRef.current) return;
      message.error(`更新失败: ${err}`);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteGroup(id);
      if (!mountedRef.current) return;
      message.success('分组已删除');
      reload();
    } catch (err) {
      if (!mountedRef.current) return;
      message.error(`删除失败: ${err}`);
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    {
      title: '分组名称',
      dataIndex: 'name',
      render: (name: string, record: GroupResponse) =>
        editingId === record.id ? (
          <Input defaultValue={name} onChange={(e) => form.setFieldValue('name', e.target.value)} />
        ) : (
          name
        ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      render: (desc: string | undefined, record: GroupResponse) =>
        editingId === record.id ? (
          <Input
            defaultValue={desc}
            placeholder="描述"
            onChange={(e) => form.setFieldValue('description', e.target.value)}
          />
        ) : (
          desc || '-'
        ),
    },
    {
      title: 'ASIN数量',
      dataIndex: 'asinCount',
      width: 100,
      render: (count: number) => count || 0,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (time: string) => time?.slice(0, 16) || '-',
    },
    {
      title: '操作',
      width: 220,
      render: (_: unknown, record: GroupResponse) =>
        editingId === record.id ? (
          <Space>
            <Button type="link" size="small" onClick={() => saveEdit(record.id)}>
              保存
            </Button>
            <Button type="link" size="small" onClick={cancelEdit}>
              取消
            </Button>
          </Space>
        ) : (
          <Space>
            <Button type="link" size="small" onClick={() => startEdit(record)}>
              编辑
            </Button>
            <Popconfirm
              title="确认删除该分组?"
              description="删除后该分组下的ASIN将变为未分组状态"
              onConfirm={() => handleDelete(record.id)}
              okText="确认"
              cancelText="取消"
            >
              <Button danger type="link" size="small">
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
    },
  ];

  return (
    <Card>
      <Title level={3} style={{ marginTop: 0 }}>
        分组管理
      </Title>
      <Text type="secondary">查看与维护 ASIN 分组，用于在仪表盘按分组筛选。</Text>

      <Divider style={{ margin: '12px 0' }} />

      {/* 新增/编辑公用表单 */}
      <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item
          name="name"
          label="分组名称"
          rules={[
            { required: true, message: '请输入分组名称' },
            { max: 50, message: '名称不超过50字符' },
          ]}
        >
          <Input placeholder="输入分组名称" style={{ width: 200 }} />
        </Form.Item>
        <Form.Item
          name="description"
          label="描述"
          rules={[{ max: 200, message: '描述不超过200字符' }]}
        >
          <Input placeholder="可选描述" style={{ width: 240 }} />
        </Form.Item>
        {editingId === null ? (
          <Form.Item>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增分组
            </Button>
          </Form.Item>
        ) : (
          <Form.Item>
            <Space>
              <Button type="primary" onClick={() => saveEdit(editingId!)}>
                保存修改
              </Button>
              <Button onClick={cancelEdit}>取消编辑</Button>
            </Space>
          </Form.Item>
        )}
      </Form>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMessage error={error} />
      ) : (
        <Table
          rowKey="id"
          dataSource={data?.items || []}
          columns={columns}
          pagination={{
            current: page,
            total: data?.total || 0,
            pageSize,
            onChange: (p) => setPage(p),
            showTotal: (total) => `共 ${total} 个分组`,
          }}
          size="small"
        />
      )}
    </Card>
  );
};

export default GroupsPage;
