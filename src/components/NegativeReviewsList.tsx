import React from 'react';
import { List, Card, Rate } from 'antd';
import { ReviewItem } from '../types';

interface Props { reviews: ReviewItem[]; page: number; total?: number; pageSize: number; onPageChange: (p: number) => void }

const NegativeReviewsList: React.FC<Props> = ({ reviews, page, total, pageSize, onPageChange }) => {
  return (
    <List
      dataSource={reviews}
      pagination={{ current: page, total: total || reviews.length, pageSize, onChange: onPageChange }}
      renderItem={(r) => (
        <List.Item>
          <Card size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Rate disabled value={r.rating} />
              <small>{new Date(r.createdAt).toLocaleDateString()}</small>
            </div>
            <div style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{r.text}</div>
          </Card>
        </List.Item>
      )}
    />
  );
};

export default NegativeReviewsList;