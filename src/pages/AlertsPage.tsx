import React, { useState } from 'react';
import { List, Card, Button, Select, Space, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { AlertItem, PageResponse, AlertLogResponse } from '../types';
import { ensurePageResponse } from '../api/adapters';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { useFetch } from '../hooks/useFetch';
import { mapAlertLog } from '../api';

async function fetchAlerts(
  page: number,
  size: number,
  type?: string
): Promise<PageResponse<AlertLogResponse>> {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  if (type) q.set('type', type);
  const raw = await apiRequest<unknown>(`/api/alerts?${q.toString()}`);
  return ensurePageResponse<AlertLogResponse>(raw, page, size);
}

const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1); // UI 1-based
  const [alertType, setAlertType] = useState<string | undefined>(undefined);
  const pageSize = 20;
  const { data, loading, error, reload } = useFetch(
    () => fetchAlerts(page - 1, pageSize, alertType),
    [page, alertType]
  );

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  const items: AlertItem[] = (data?.items || []).map(mapAlertLog);

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Select
          allowClear
          placeholder="告警类型"
          style={{ width: 180 }}
          value={alertType}
          onChange={(v) => {
            setPage(1);
            setAlertType(v);
          }}
          options={[
            { value: 'PRICE_CHANGE', label: '价格变动' },
            { value: 'INVENTORY_THRESHOLD', label: '库存阈值' },
            { value: 'TITLE', label: '标题变更' },
            { value: 'MAIN_IMAGE', label: '主图变更' },
            { value: 'BULLET_POINTS', label: '五点要点变更' },
            { value: 'APLUS_CONTENT', label: 'A+内容变更' },
            { value: 'NEGATIVE_REVIEW', label: '新差评' },
          ]}
        />
        <Button onClick={() => reload()}>刷新</Button>
      </Space>
      <List
        pagination={{
          current: page,
          total: data?.total || 0,
          pageSize,
          onChange: (p) => setPage(p),
        }}
        dataSource={items}
        renderItem={(item: AlertItem) => (
          <List.Item>
            <Card size="small" hoverable onClick={() => navigate(`/asin/${item.asinId}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{item.asin}</strong> · {item.type}{' '}
                  {item.severity && (
                    <Tag
                      color={
                        item.severity === 'ERROR'
                          ? 'red'
                          : item.severity === 'WARN'
                            ? 'orange'
                            : 'blue'
                      }
                    >
                      {item.severity}
                    </Tag>
                  )}
                </div>
                <small>{new Date(item.createdAt).toLocaleString()}</small>
              </div>
              <div style={{ marginTop: 8 }}>{item.message}</div>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
};

export default AlertsPage;
