/**
 * 历史数据表格Tab (F-WEB-4.5)
 * 复用现有historyPoints数据,提供表格视图
 * 展示全量数据并标记变化
 */

import React, { useState, useMemo } from 'react';
import { Table, Modal, Descriptions, Tag } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { AsinHistoryPoint } from '../types';
import dayjs from 'dayjs';
import DiffMatchPatch from 'diff-match-patch';

interface HistoryDataTableProps {
  data: AsinHistoryPoint[];
  loading?: boolean;
}

// 定义变化类型
type ChangeType = 'up' | 'down' | 'unchanged' | 'new';

interface ChangeIndicator {
  type: ChangeType;
  prev?: number | string;
  current?: number | string;
}

const HistoryDataTable: React.FC<HistoryDataTableProps> = ({ data, loading }) => {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AsinHistoryPoint | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const handleRowClick = (record: AsinHistoryPoint, index: number) => {
    setSelectedRecord(record);
    setSelectedIndex(index);
    setDetailModalOpen(true);
  };

  // 按时间倒序排列(最新的在前)
  const sortedData = useMemo(() => {
    return [...data].sort(
      (a, b) => new Date(b.snapshotAt).getTime() - new Date(a.snapshotAt).getTime()
    );
  }, [data]);

  // 计算每个字段相对于该ASIN的上一条数据的变化
  const dataWithChanges = useMemo(() => {
    return sortedData.map((record, index) => {
      // 上一条数据是时间上更早的(index+1,因为已按时间倒序排列)
      const prev = index < sortedData.length - 1 ? sortedData[index + 1] : null;

      const getChange = (
        current: number | string | undefined | null,
        previous: number | string | undefined | null,
        isNumeric: boolean = true
      ): ChangeIndicator => {
        if (!prev || current == null) return { type: 'new' };
        if (previous == null) return { type: 'new', current };

        if (isNumeric) {
          const curr = Number(current);
          const prevNum = Number(previous);
          if (curr > prevNum) return { type: 'up', prev: previous, current };
          if (curr < prevNum) return { type: 'down', prev: previous, current };
          return { type: 'unchanged', prev: previous, current };
        } else {
          // 字符串比较 (MD5, 文本等)
          if (current !== previous) return { type: 'up', prev: previous, current }; // 变化标红
          return { type: 'unchanged', prev: previous, current };
        }
      };

      return {
        ...record,
        prevRecord: prev, // 保存上一条记录用于diff
        changes: {
          price: getChange(record.price, prev?.price, true),
          bsr: getChange(record.bsr, prev?.bsr, true),
          inventory: getChange(record.inventory, prev?.inventory, true),
          avgRating: getChange(record.avgRating, prev?.avgRating, true),
          totalReviews: getChange(record.totalReviews, prev?.totalReviews, true),
          imageMd5: getChange(record.imageMd5, prev?.imageMd5, false),
          aplusMd5: getChange(record.aplusMd5, prev?.aplusMd5, false),
          title: getChange(record.title, prev?.title, false),
          bulletPoints: getChange(record.bulletPoints, prev?.bulletPoints, false),
        },
      };
    });
  }, [sortedData]);

  const renderChangeIndicator = (
    value: number | string | undefined | null,
    change: ChangeIndicator,
    formatter?: (v: number | string) => string
  ) => {
    if (value == null) return '-';

    const displayValue = formatter ? formatter(value) : String(value);

    if (change.type === 'up') {
      return (
        <span style={{ color: '#cf1322' }}>
          {displayValue} <ArrowUpOutlined />
        </span>
      );
    } else if (change.type === 'down') {
      return (
        <span style={{ color: '#3f8600' }}>
          {displayValue} <ArrowDownOutlined />
        </span>
      );
    }
    return displayValue;
  };

  // 文本diff渲染函数
  // 文本diff渲染函数 - 删除=红色,新增=绿色
  const renderTextDiff = (current: string | undefined, previous: string | undefined) => {
    if (!current && !previous) return <span>-</span>;
    if (!previous) return <span>{current}</span>;
    if (!current)
      return <span style={{ color: '#cf1322', textDecoration: 'line-through' }}>{previous}</span>;
    if (current === previous) return <span>{current}</span>;

    const dmp = new DiffMatchPatch();
    const diffs = dmp.diff_main(previous, current);
    dmp.diff_cleanupSemantic(diffs);

    return (
      <div style={{ lineHeight: '1.8' }}>
        {diffs.map((diff, i) => {
          const [operation, text] = diff;
          if (operation === 0) {
            // 未变化
            return <span key={i}>{text}</span>;
          } else if (operation === 1) {
            // 新增 - 绿色加粗
            return (
              <span
                key={i}
                style={{ backgroundColor: '#e6f7e6', color: '#3f8600', fontWeight: 'bold' }}
              >
                {text}
              </span>
            );
          } else {
            // 删除 - 红色加粗加删除线
            return (
              <span
                key={i}
                style={{
                  backgroundColor: '#ffe6e6',
                  color: '#cf1322',
                  fontWeight: 'bold',
                  textDecoration: 'line-through',
                }}
              >
                {text}
              </span>
            );
          }
        })}
      </div>
    );
  };

  const columns: ColumnsType<(typeof dataWithChanges)[0]> = [
    {
      title: '快照时间',
      dataIndex: 'snapshotAt',
      width: 160,
      fixed: 'left',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
      defaultSortOrder: 'ascend',
    },
    {
      title: '小类BSR排名',
      dataIndex: 'bsrSubcategoryRank',
      width: 120,
      render: (rank: number) => (rank != null ? rank.toLocaleString() : '-'),
    },
    {
      title: '价格',
      dataIndex: 'price',
      width: 120,
      render: (price: number, record) =>
        renderChangeIndicator(price, record.changes.price, (v) => `$${Number(v).toFixed(2)}`),
    },
    {
      title: 'BSR排名',
      dataIndex: 'bsr',
      width: 120,
      render: (bsr: number, record) =>
        renderChangeIndicator(bsr, record.changes.bsr, (v) => Number(v).toLocaleString()),
    },
    {
      title: '库存',
      dataIndex: 'inventory',
      width: 100,
      render: (inv: number, record) => renderChangeIndicator(inv, record.changes.inventory),
    },
    {
      title: '评分',
      dataIndex: 'avgRating',
      width: 100,
      render: (rating: number, record) =>
        renderChangeIndicator(rating, record.changes.avgRating, (v) => Number(v).toFixed(1)),
    },
    {
      title: '评论数',
      dataIndex: 'totalReviews',
      width: 100,
      render: (reviews: number, record) =>
        renderChangeIndicator(reviews, record.changes.totalReviews, (v) =>
          Number(v).toLocaleString()
        ),
    },
    {
      title: '主图',
      dataIndex: 'imageMd5',
      width: 80,
      render: (md5: string, record) =>
        record.changes.imageMd5.type === 'up' ? (
          <Tag color="red">已变更</Tag>
        ) : md5 ? (
          <Tag color="green">未变</Tag>
        ) : (
          '-'
        ),
    },
    {
      title: 'A+内容',
      dataIndex: 'aplusMd5',
      width: 80,
      render: (md5: string, record) =>
        record.changes.aplusMd5.type === 'up' ? (
          <Tag color="red">已变更</Tag>
        ) : md5 ? (
          <Tag color="green">未变</Tag>
        ) : (
          '-'
        ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      width: 80,
      render: (title: string, record) =>
        record.changes.title.type === 'up' ? (
          <Tag color="red">已变更</Tag>
        ) : title ? (
          <Tag color="green">未变</Tag>
        ) : (
          '-'
        ),
    },
    {
      title: '五点',
      dataIndex: 'bulletPoints',
      width: 80,
      render: (bp: string, record) =>
        record.changes.bulletPoints.type === 'up' ? (
          <Tag color="red">已变更</Tag>
        ) : bp ? (
          <Tag color="green">未变</Tag>
        ) : (
          '-'
        ),
    },
  ];

  // 获取选中记录和上一条记录
  const selectedRecordWithPrev = useMemo(() => {
    if (selectedIndex < 0 || selectedIndex >= dataWithChanges.length) return null;
    return dataWithChanges[selectedIndex];
  }, [selectedIndex, dataWithChanges]);

  return (
    <>
      <Table
        rowKey={(record) => record.id || record.snapshotAt}
        dataSource={dataWithChanges}
        columns={columns}
        loading={loading}
        pagination={false}
        onRow={(record, index) => ({
          onClick: () => handleRowClick(record, index!),
          style: { cursor: 'pointer' },
        })}
        size="small"
        scroll={{ x: 1200, y: 600 }}
      />

      <Modal
        title="快照详情对比"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={1000}
      >
        {selectedRecord && selectedRecordWithPrev && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="快照时间" span={2}>
                {dayjs(selectedRecord.snapshotAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="价格">
                {selectedRecord.price != null ? `$${selectedRecord.price.toFixed(2)}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="库存">{selectedRecord.inventory ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="BSR排名">
                {selectedRecord.bsr?.toLocaleString() || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="BSR分类">
                {selectedRecord.bsrCategory || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="BSR小类">
                {selectedRecord.bsrSubcategory || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="BSR小类排名">
                {selectedRecord.bsrSubcategoryRank?.toLocaleString() || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="评分">
                {selectedRecord.avgRating != null ? selectedRecord.avgRating.toFixed(2) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="评论数">
                {selectedRecord.totalReviews?.toLocaleString() || '-'}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <h4 style={{ marginBottom: 8 }}>标题变化对比:</h4>
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#fafafa',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              >
                {renderTextDiff(selectedRecord.title, selectedRecordWithPrev.prevRecord?.title)}
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <h4 style={{ marginBottom: 8 }}>五点描述变化对比:</h4>
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#fafafa',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '13px',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {renderTextDiff(
                  selectedRecord.bulletPoints,
                  selectedRecordWithPrev.prevRecord?.bulletPoints
                )}
              </div>
            </div>

            <Descriptions column={2} bordered size="small" style={{ marginTop: 16 }}>
              <Descriptions.Item label="主图MD5">
                {selectedRecord.imageMd5 || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="A+内容MD5">
                {selectedRecord.aplusMd5 || '-'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </>
  );
};

export default HistoryDataTable;
