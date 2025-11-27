import React, { useMemo } from 'react';
import { Button, Card, Col, Divider, Row, Space, Tooltip, Typography, message } from 'antd';
import { CopyOutlined, SettingOutlined } from '@ant-design/icons';
import type { AsinHistoryPoint, AsinHistorySnapshot, AsinResponse, AsinCost } from '../../types';
import { parseCouponValue } from '../../utils/coupon';
import StatCard from '../UI/StatCard';
import SemanticTag from '../UI/SemanticTag';
import SkeletonPlaceholder from '../UI/SkeletonPlaceholder';

interface ProfitHeaderProps {
  asinInfo?: AsinResponse | null;
  snapshot?: AsinHistoryPoint | AsinHistorySnapshot | null;
  cost?: AsinCost | null;
  loading?: boolean;
  onConfigureCost?: () => void;
}

function formatCurrency(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '-';
  return `$${value.toFixed(2)}`;
}

const ProfitHeader: React.FC<ProfitHeaderProps> = ({ asinInfo, snapshot, cost, loading, onConfigureCost }) => {
  const price = snapshot?.price ?? asinInfo?.lastPrice ?? null;
  const inventory = snapshot?.inventory ?? asinInfo?.lastInventory ?? null;
  const bsr = snapshot?.bsr ?? asinInfo?.lastBsr ?? null;
  const bsrSubRank = snapshot?.bsrSubcategoryRank ?? asinInfo?.lastBsrSubcategoryRank ?? null;
  const couponValue = snapshot?.couponValue ?? null;
  const isLightningDeal = snapshot?.isLightningDeal ?? false;

    const purchaseCost = cost?.purchaseCost ?? 0;
    const shippingCost = cost?.shippingCost ?? 0;
    const fbaFee = cost?.fbaFee ?? 0;
    const tariffRate = cost?.tariffRate ?? 0;
    const otherCost = cost?.otherCost ?? 0;
    const referralFee = snapshot?.referralFee ?? 0;

    const { profit, profitMargin, tariffCost } = useMemo(() => {
      if (!price) {
        return { profit: null, profitMargin: null, tariffCost: purchaseCost * tariffRate };
      }
      const tariffCostCalc = purchaseCost * tariffRate;
      const totalCost = purchaseCost + shippingCost + fbaFee + otherCost + tariffCostCalc + referralFee;
      const computedProfit = price - totalCost;
      const margin = price > 0 ? computedProfit / price : 0;
      return { profit: computedProfit, profitMargin: margin, tariffCost: tariffCostCalc };
    }, [price, purchaseCost, shippingCost, fbaFee, otherCost, tariffRate, referralFee]);

  const inventoryText = useMemo(() => {
    if (inventory === null || inventory === undefined) return '-';
    if (inventory > 999) return '999+';
    return inventory;
  }, [inventory]);

  if (loading) {
    return <SkeletonPlaceholder lines={4} />;
  }

  return (
    <Card
      bordered={false}
      style={{ borderRadius: 16, boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)' }}
      bodyStyle={{ padding: 24 }}
    >
      <Row gutter={24} wrap>
        <Col xs={24} md={12} lg={10} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Typography.Title level={4} style={{ marginBottom: 4 }}>
              {asinInfo?.nickname || '未命名 ASIN'}
            </Typography.Title>
            <Space size="small" wrap>
              <Typography.Text type="secondary">ASIN: {asinInfo?.asin || '-'}</Typography.Text>
              <Tooltip title="复制 ASIN">
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => {
                    if (!asinInfo?.asin) return;
                    if (navigator?.clipboard?.writeText) {
                      navigator.clipboard.writeText(asinInfo.asin).catch(() => {
                        message.warning('复制失败，请手动复制');
                      });
                    } else {
                      message.warning('当前环境不支持自动复制');
                    }
                  }}
                />
              </Tooltip>
              {asinInfo?.site ? (
                <SemanticTag tone="info">{asinInfo.site}</SemanticTag>
              ) : null}
              {(() => {
                const coupon = parseCouponValue(couponValue);
                if (!coupon) return null;
                const tone = coupon.label.includes('%') ? 'warning' : coupon.label.includes('$') ? 'positive' : 'info';
                return (
                  <Tooltip title={coupon.fullText}>
                    <SemanticTag tone={tone}>{coupon.label}</SemanticTag>
                  </Tooltip>
                );
              })()}
              {isLightningDeal ? <SemanticTag tone="warning">秒杀中</SemanticTag> : null}
            </Space>
          </div>
          <Typography.Paragraph type="secondary" style={{ maxWidth: 480 }}>
            使用顶部看板快速回顾价格、利润、库存与排名表现。点击“配置成本”后可即时试算毛利，帮助团队更快做出运营决策。
          </Typography.Paragraph>
          <Button icon={<SettingOutlined />} type="primary" onClick={onConfigureCost} style={{ width: 'fit-content' }}>
            配置成本
          </Button>
        </Col>
        <Col xs={24} md={12} lg={14}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <StatCard title="当前售价" value={price ?? '-'} prefix={price ? '$' : undefined} precision={price ? 2 : undefined} />
            </Col>
            <Col xs={24} sm={12}>
              <StatCard
                title="预估毛利"
                value={profit ?? '-'}
                prefix={profit !== null ? '$' : undefined}
                precision={profit !== null ? 2 : undefined}
                highlight={profit !== null ? (profit >= 0 ? 'positive' : 'negative') : undefined}
                trend={profit !== null ? (profit >= 0 ? 'up' : 'down') : undefined}
                trendText={
                  profit !== null && profitMargin !== null
                    ? `${profitMargin >= 0 ? '+' : '-'}${Math.abs(profitMargin * 100).toFixed(1)}%`
                    : undefined
                }
                tooltip="基于当前售价与成本配置实时试算"
                onClick={onConfigureCost}
              />
            </Col>
            <Col xs={24} sm={12}>
              <StatCard
                title="真实库存"
                value={inventoryText}
                highlight={inventory !== null && inventory < 20 ? 'warning' : undefined}
                extra={inventory !== null && inventory < 20 ? <SemanticTag tone="warning">库存紧张</SemanticTag> : null}
              />
            </Col>
            <Col xs={24} sm={12}>
              <StatCard
                title="BSR 排名"
                value={bsr ?? '-'}
                trend={undefined}
                extra={
                  bsrSubRank ? (
                    <Typography.Text type="secondary" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      小类 #{bsrSubRank}
                    </Typography.Text>
                  ) : undefined
                }
              />
            </Col>
          </Row>
          <Divider style={{ margin: '16px 0' }} />
          <Row gutter={[16, 16]}>
            <Col flex="auto">
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  成本拆分: 采购 {formatCurrency(purchaseCost)} · 运费 {formatCurrency(shippingCost)} · FBA {formatCurrency(fbaFee)} · 关税 {formatCurrency(tariffCost)} · 其他 {formatCurrency(otherCost)}
                  {referralFee ? ` · 佣金 ${formatCurrency(referralFee)}` : ''}
                </Typography.Text>
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>
  );
};

export default ProfitHeader;
