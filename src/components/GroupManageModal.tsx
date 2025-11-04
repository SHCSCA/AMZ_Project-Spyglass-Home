/**
 * 分组管理Modal
 * F-WEB-2: 支持分组的增删改查
 */

import React, { useState, useEffect, useRef } from 'react';
import { Modal, Table, Button, Form, Input, Space, Popconfirm, message, Divider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useFetch } from '../hooks/useFetch';
import { fetchGroups, createGroup, updateGroup, deleteGroup, GroupResponse } from '../api';
import Loading from './Loading';
import ErrorMessage from './ErrorMessage';

interface GroupManageModalProps {
  open: boolean;
  onClose: () => void;
  onGroupChange?: () => void; // 分组变更后回调,用于刷新父组件
}

const GroupManageModal: React.FC<GroupManageModalProps> = ({ open, onClose, onGroupChange }) => {
  const [form] = Form.useForm<{ name: string }>();
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

  const { data, loading, error, reload } = useFetch(
    () => fetchGroups(page - 1, pageSize),
    [page, open] // open变化时重新加载
  );

  const handleAdd = async () => {
    try {
      const values = await form.validateFields();
      await createGroup(values);
      if (!mountedRef.current) return;
      message.success('分组创建成功');
      form.resetFields();
      reload();
      onGroupChange?.();
    } catch (err) {
      if (!mountedRef.current) return;
      message.error(`创建失败: ${err}`);
    }
  };

  const handleEdit = async (record: GroupResponse) => {
    setEditingId(record.id);
    form.setFieldsValue({ name: record.name });
  };

  const handleSaveEdit = async (id: number) => {
    try {
      const values = await form.validateFields();
      await updateGroup(id, values);
      if (!mountedRef.current) return;
      message.success('分组更新成功');
      setEditingId(null);
      form.resetFields();
      reload();
      onGroupChange?.();
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
      onGroupChange?.();
    } catch (err) {
      if (!mountedRef.current) return;
      message.error(`删除失败: ${err}`);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
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
      width: 200,
      render: (_: unknown, record: GroupResponse) =>
        editingId === record.id ? (
          <Space>
            <Button type="link" size="small" onClick={() => handleSaveEdit(record.id)}>
              保存
            </Button>
            <Button
              type="link"
              size="small"
              onClick={() => {
                setEditingId(null);
                form.resetFields();
              }}
            >
              取消
            </Button>
          </Space>
        ) : (
          <Space>
            <Button type="link" size="small" onClick={() => handleEdit(record)}>
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
    <Modal
      title="分组管理"
      open={open}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
      ]}
    >
      {/* 新增分组表单 */}
      <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item
          name="name"
          label="分组名称"
          rules={[
            { required: true, message: '请输入分组名称' },
            { max: 50, message: '名称不超过50字符' },
          ]}
        >
          <Input placeholder="输入新分组名称" style={{ width: 200 }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增分组
          </Button>
        </Form.Item>
      </Form>

      <Divider style={{ margin: '12px 0' }} />

      {/* 分组列表 */}
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
    </Modal>
  );
};

export default GroupManageModal;
