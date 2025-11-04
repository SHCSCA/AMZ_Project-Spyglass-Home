/**
 * 历史数据表格Tab (F-WEB-4.5)
 * 复用现有historyPoints数据,提供表格视图
 */

import React, { useState } from 'react';
import { Table, Modal, Descriptions, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AsinHistoryPoint } from '../types';
import dayjs from 'dayjs';

const { Paragraph } = Typography;

interface HistoryDataTableProps {
  data: AsinHistoryPoint[];
  loading?: boolean;
}

const HistoryDataTable: React.FC<HistoryDataTableProps> = ({ data, loading }) => {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AsinHistoryPoint | null>(null);

  const handleRowClick = (record: AsinHistoryPoint) => {
    setSelectedRecord(record);
    setDetailModalOpen(true);
  };

  const columns: ColumnsType<AsinHistoryPoint> = [
    {
      title: '快照时间',
      dataIndex: 'snapshotAt',
      width: 160,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => new Date(a.snapshotAt).getTime() - new Date(b.snapshotAt).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: '价格',
      dataIndex: 'price',
      width: 100,
      render: (price: number) => (price !== undefined ? `$${price.toFixed(2)}` : '-'),
    },
    {
      title: 'BSR排名',
      dataIndex: 'bsr',
      width: 100,
      render: (bsr: number) => bsr?.toLocaleString() || '-',
    },
    {
      title: 'BSR分类',
      dataIndex: 'bsrCategory',
      width: 150,
      ellipsis: true,
    },
    {
      title: '库存',
      dataIndex: 'inventory',
      width: 80,
      render: (inv: number) => inv ?? '-',
    },
    {
      title: '评分',
      dataIndex: 'avgRating',
      width: 80,
      render: (rating: number) => rating?.toFixed(1) || '-',
    },
    {
      title: '评论数',
      dataIndex: 'totalReviews',
      width: 100,
      render: (reviews: number) => reviews?.toLocaleString() || '-',
    },
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
      render: (title: string) => <span title={title}>{title || '-'}</span>,
    },
  ];

  return (
    <>
      <Table
        rowKey={(record) => record.id || record.snapshotAt}
        dataSource={data}
        columns={columns}
        loading={loading}
        pagination={{
          pageSize: 20,
          showTotal: (total) => `共 ${total} 条历史记录`,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
        }}
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
          style: { cursor: 'pointer' },
        })}
        size="small"
        scroll={{ x: 1000 }}
      />

      {/* 详情Modal */}
      <Modal
        title="快照详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={800}
      >
        {selectedRecord && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="快照时间" span={2}>
              {dayjs(selectedRecord.snapshotAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="价格">
              {selectedRecord.price !== undefined ? `$${selectedRecord.price.toFixed(2)}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="库存">{selectedRecord.inventory ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="BSR排名">
              {selectedRecord.bsr?.toLocaleString() || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="BSR分类">
              {selectedRecord.bsrCategory || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="评分">
              {selectedRecord.avgRating?.toFixed(2) || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="评论数">
              {selectedRecord.totalReviews?.toLocaleString() || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="完整标题" span={2}>
              <Paragraph
                copyable
                ellipsis={{ rows: 3, expandable: true }}
                style={{ marginBottom: 0 }}
              >
                {selectedRecord.title || '-'}
              </Paragraph>
            </Descriptions.Item>
            <Descriptions.Item label="五点描述" span={2}>
              <Paragraph
                copyable
                ellipsis={{ rows: 5, expandable: true }}
                style={{ marginBottom: 0, whiteSpace: 'pre-line' }}
              >
                {selectedRecord.bulletPoints || '-'}
              </Paragraph>
            </Descriptions.Item>
            <Descriptions.Item label="主图MD5">{selectedRecord.imageMd5 || '-'}</Descriptions.Item>
            <Descriptions.Item label="A+内容MD5">
              {selectedRecord.aplusMd5 || '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
};

export default HistoryDataTable;
