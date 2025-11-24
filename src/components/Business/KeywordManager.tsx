import React, { useState } from 'react';
import { Button, Card, Empty, Input, List, Popconfirm, Skeleton, Space, Switch, Tag, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { AsinKeyword } from '../../types';

interface KeywordManagerProps {
  keywords: AsinKeyword[];
  loading?: boolean;
  onAddKeyword: (keyword: string) => Promise<void> | void;
  onDeleteKeyword: (keywordId: number) => Promise<void> | void;
  onToggleTracked?: (keywordId: number, nextTracked: boolean, keyword: string) => Promise<void> | void;
  optimisticKeyword?: string | null;
}

const KeywordManager: React.FC<KeywordManagerProps> = ({
  keywords,
  loading,
  onAddKeyword,
  onDeleteKeyword,
  onToggleTracked,
  optimisticKeyword,
}) => {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [nextTracked, setNextTracked] = useState<boolean | null>(null);

  const handleSubmit = async () => {
    const keyword = value.trim();
    if (!keyword) return;
    try {
      setSubmitting(true);
      await onAddKeyword(keyword);
      setValue('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleTracked = async (item: AsinKeyword, tracked: boolean) => {
    if (!onToggleTracked) return;
    setTogglingId(item.id);
    setNextTracked(tracked);
    try {
      await onToggleTracked(item.id, tracked, item.keyword);
    } finally {
      setTogglingId(null);
      setNextTracked(null);
    }
  };

  const renderItem = (item: AsinKeyword) => (
    <List.Item>
      <Card
        size="small"
        style={{ width: '100%', borderRadius: 12 }}
        bodyStyle={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
      >
        <div>
          <Typography.Text strong style={{ fontSize: 15 }}>
            {item.keyword}
          </Typography.Text>
          <Space size="small" style={{ display: 'flex', marginTop: 8 }}>
            <Tag color="processing">
              自然排名: {item.lastOrganicRank !== null && item.lastOrganicRank !== undefined ? `#${item.lastOrganicRank}` : '—'}
            </Tag>
            <Tag color="purple">
              广告排名: {item.lastSponsoredRank !== null && item.lastSponsoredRank !== undefined ? `#${item.lastSponsoredRank}` : '—'}
            </Tag>
            <Tag color={item.isTracked ? 'success' : 'default'}>
              {item.isTracked ? '追踪中' : '已停用'}
            </Tag>
            <Typography.Text type="secondary">
              更新于 {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '未知'}
            </Typography.Text>
          </Space>
        </div>
        <Space size="middle">
          <Switch
            checked={item.id === togglingId && nextTracked !== null ? nextTracked : item.isTracked}
            onChange={(checked) => handleToggleTracked(item, checked)}
            checkedChildren="追踪"
            unCheckedChildren="停用"
            loading={togglingId === item.id}
          />
          <Popconfirm
            title="确定要删除该关键词吗？"
            placement="topRight"
            onConfirm={() => onDeleteKeyword(item.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      </Card>
    </List.Item>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Input.Search
        placeholder="输入关键词后回车或点击添加"
        enterButton={<span><PlusOutlined /> 添加</span>}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onSearch={handleSubmit}
        loading={submitting}
      />
      {optimisticKeyword ? (
        <Card
          size="small"
          style={{ borderStyle: 'dashed', borderRadius: 12, opacity: 0.6 }}
          bodyStyle={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Typography.Text>{optimisticKeyword}</Typography.Text>
          <Typography.Text type="secondary">同步中...</Typography.Text>
        </Card>
      ) : null}
      {loading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : keywords.length ? (
        <List dataSource={keywords} renderItem={renderItem} rowKey={(item) => item.id} />
      ) : (
        <Empty description="暂无监控关键词，先添加一个吧" />
      )}
    </div>
  );
};

export default KeywordManager;
