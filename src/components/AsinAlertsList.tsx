import React, { useMemo } from 'react';
import { Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AlertItem } from '../types';
import dayjs from 'dayjs';

const { Text } = Typography;

interface Props {
  alerts: AlertItem[];
}

// 按日期分组的告警数据
interface GroupedAlert {
  date: string;
  dateDisplay: string;
  changes: string[];
  items: AlertItem[];
}

const AsinAlertsList: React.FC<Props> = ({ alerts }) => {
  // 按日期分组告警
  const groupedAlerts = useMemo(() => {
    const grouped = new Map<string, AlertItem[]>();

    alerts.forEach((alert) => {
      const date = dayjs(alert.createdAt).format('YYYY-MM-DD');
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(alert);
    });

    const result: GroupedAlert[] = [];
    grouped.forEach((items, date) => {
      // 提取该日期的所有变化类型
      const changeTypes = new Set<string>();
      items.forEach((item) => {
        const typeMap: Record<string, string> = {
          PRICE_CHANGE: '价格',
          BSR_CHANGE: 'BSR',
          INVENTORY_CHANGE: '库存',
          TITLE_CHANGE: '标题',
          MAIN_IMAGE_CHANGE: '主图',
          BULLET_POINTS_CHANGE: '五点描述',
          APLUS_CONTENT_CHANGE: 'A+',
          NEGATIVE_REVIEW: '负面评论',
        };
        const typeName = typeMap[item.type] || item.type;
        changeTypes.add(typeName);
      });

      result.push({
        date,
        dateDisplay: dayjs(date).format('MM月DD日'),
        changes: Array.from(changeTypes),
        items,
      });
    });

    // 按日期倒序排列（最新的在前）
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [alerts]);

  const columns: ColumnsType<GroupedAlert> = [
    {
      title: '日期',
      dataIndex: 'dateDisplay',
      key: 'date',
      width: 120,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '变更内容',
      dataIndex: 'changes',
      key: 'changes',
      render: (changes: string[]) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {changes.map((change, idx) => (
            <Tag key={idx} color="blue">
              {change}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: '变更次数',
      key: 'count',
      width: 100,
      align: 'center',
      render: (_: unknown, record: GroupedAlert) => (
        <Text type="secondary">{record.items.length} 次</Text>
      ),
    },
  ];

  return (
    <Table
      dataSource={groupedAlerts}
      columns={columns}
      rowKey="date"
      pagination={false}
      size="small"
      expandable={{
        expandedRowRender: (record: GroupedAlert) => (
          <div style={{ paddingLeft: 24 }}>
            {record.items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: 8,
                  padding: 8,
                  background: '#fafafa',
                  borderRadius: 4,
                }}
              >
                <div style={{ marginBottom: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(item.createdAt).format('HH:mm:ss')}
                  </Text>
                  {item.severity && (
                    <Tag
                      color={
                        item.severity === 'HIGH'
                          ? 'red'
                          : item.severity === 'MEDIUM'
                            ? 'orange'
                            : 'default'
                      }
                      style={{ marginLeft: 8 }}
                    >
                      {item.severity}
                    </Tag>
                  )}
                </div>
                <div>{item.message}</div>
                {(item.oldValue || item.newValue) && (
                  <div style={{ marginTop: 4, fontSize: 12 }}>
                    {item.oldValue && <Text type="secondary">旧值: {item.oldValue}</Text>}
                    {item.oldValue && item.newValue && <Text type="secondary"> → </Text>}
                    {item.newValue && <Text type="secondary">新值: {item.newValue}</Text>}
                    {item.changePercent && (
                      <Text type="secondary" style={{ marginLeft: 8 }}>
                        ({item.changePercent})
                      </Text>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ),
        rowExpandable: (record: GroupedAlert) => record.items.length > 0,
      }}
    />
  );
};

export default AsinAlertsList;
