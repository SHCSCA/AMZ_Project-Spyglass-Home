import React from 'react';
import { Card, Statistic, Tooltip, Typography } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';

interface StatCardProps {
  title: string;
  value: number | string | React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  precision?: number;
  tooltip?: string;
  trend?: 'up' | 'down';
  trendText?: string;
  valueStyle?: React.CSSProperties;
  onClick?: () => void;
  highlight?: 'positive' | 'negative' | 'warning';
  extra?: React.ReactNode;
  loading?: boolean;
}

const trendIconMap = {
  up: <ArrowUpOutlined style={{ color: '#10B981' }} />,
  down: <ArrowDownOutlined style={{ color: '#EF4444' }} />,
};

const highlightColorMap: Record<NonNullable<StatCardProps['highlight']>, string> = {
  positive: '#10B981',
  negative: '#EF4444',
  warning: '#F59E0B',
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  prefix,
  suffix,
  precision,
  tooltip,
  trend,
  trendText,
  valueStyle,
  onClick,
  highlight,
  extra,
  loading,
}) => {
  const cardContent = (
    <Card
      size="small"
      hoverable={Boolean(onClick)}
      onClick={onClick}
      style={{
        borderRadius: 12,
        backdropFilter: 'blur(12px)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 120ms ease, box-shadow 120ms ease',
      }}
      bodyStyle={{ padding: 16 }}
      loading={loading}
      title={<Typography.Text strong>{title}</Typography.Text>}
      extra={extra}
    >
      <Statistic
        prefix={prefix}
        suffix={suffix}
        precision={precision}
        value={value}
        valueStyle={{
          fontVariantNumeric: 'tabular-nums',
          color: highlight ? highlightColorMap[highlight] : undefined,
          ...valueStyle,
        }}
      />
      {trend && trendText ? (
        <Typography.Text style={{ color: trend === 'up' ? '#10B981' : '#EF4444' }}>
          {trendIconMap[trend]} {trendText}
        </Typography.Text>
      ) : null}
    </Card>
  );

  if (!tooltip) {
    return cardContent;
  }

  return <Tooltip title={tooltip}>{cardContent}</Tooltip>;
};

export default StatCard;
