import React from 'react';
import { List, Card, Rate, Tag, Typography } from 'antd';
import { ReviewItem } from '../types';

interface Props {
  reviews: ReviewItem[];
  page: number;
  total?: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}

const NEGATIVE_KEYWORDS = ['broken', 'stopped', 'bad', 'poor', 'refund', 'return', 'defect', 'issue', 'damaged'];

const highlightText = (text: string) => {
  if (!text) return null;
  const regex = new RegExp(`(${NEGATIVE_KEYWORDS.join('|')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, index) => {
    const lowered = part.toLowerCase();
    const shouldHighlight = NEGATIVE_KEYWORDS.some((keyword) => lowered === keyword);
    return shouldHighlight ? (
      <span key={`${part}-${index}`} style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', fontWeight: 600 }}>
        {part}
      </span>
    ) : (
      <span key={index}>{part}</span>
    );
  });
};

const NegativeReviewsList: React.FC<Props> = ({ reviews, page, total, pageSize, onPageChange }) => {
  return (
    <List
      dataSource={reviews}
      pagination={{ current: page, total: total || reviews.length, pageSize, onChange: onPageChange }}
      renderItem={(r) => (
        <List.Item>
          <Card size="small" bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Rate disabled value={r.rating} />
              <Tag color="red">{new Date(r.createdAt).toLocaleDateString()}</Tag>
            </div>
            <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {highlightText(r.text)}
            </Typography.Paragraph>
          </Card>
        </List.Item>
      )}
    />
  );
};

export default NegativeReviewsList;