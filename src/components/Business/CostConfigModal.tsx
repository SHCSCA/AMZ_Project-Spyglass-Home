import React, { useMemo } from 'react';
import { Form, InputNumber, Modal, Space, Statistic, Typography } from 'antd';
import type { AsinCost } from '../../types';

export interface CostConfigFormValues {
  fobCost: number;
  shippingCost: number;
  referralFee?: number;
  fbaFeeOverride?: number;
}

interface CostConfigModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: CostConfigFormValues) => Promise<void> | void;
  loading?: boolean;
  price?: number | null;
  initialCost?: AsinCost | null;
}

const CostConfigModal: React.FC<CostConfigModalProps> = ({
  open,
  onCancel,
  onSubmit,
  loading,
  price,
  initialCost,
}) => {
  const [form] = Form.useForm<CostConfigFormValues>();
  const watchedValues = (Form.useWatch([], form) ?? {}) as Partial<CostConfigFormValues>;

  const defaults = useMemo(
    () => ({
      fobCost: initialCost?.fobCost ?? 0,
      shippingCost: initialCost?.shippingCost ?? 0,
      referralFee: initialCost?.referralFee,
      fbaFeeOverride: initialCost?.fbaFeeOverride,
    }),
    [initialCost]
  );

  const mergedValues = {
    ...defaults,
    ...watchedValues,
  } as CostConfigFormValues;

  const { totalCost, estimatedProfit, profitMargin } = useMemo(() => {
    const fob = Number(mergedValues.fobCost || 0);
    const shipping = Number(mergedValues.shippingCost || 0);
    const referral = Number(mergedValues.referralFee || 0);
    const fba = Number(mergedValues.fbaFeeOverride || 0);
    const total = fob + shipping + referral + fba;
    if (!price) {
      return { totalCost: total, estimatedProfit: null, profitMargin: null };
    }
    const profit = price - total;
    const margin = price > 0 ? profit / price : null;
    return { totalCost: total, estimatedProfit: profit, profitMargin: margin };
  }, [mergedValues, price]);

  return (
    <Modal
      title="配置成本"
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      destroyOnClose
      maskClosable={false}
    >
      <Typography.Paragraph>
        在此维护 FOB、运费、推荐佣金与 FBA 费用。数值变化将实时刷新毛利试算，保存后会立即同步至利润看板。
      </Typography.Paragraph>
      <Form<CostConfigFormValues>
        form={form}
        layout="vertical"
        initialValues={{
          fobCost: initialCost?.fobCost ?? 0,
          shippingCost: initialCost?.shippingCost ?? 0,
          referralFee: initialCost?.referralFee ?? 0,
          fbaFeeOverride: initialCost?.fbaFeeOverride ?? 0,
        }}
        onFinish={onSubmit}
      >
        <Form.Item
          label="FOB 采购成本"
          name="fobCost"
          rules={[{ required: true, message: '请输入 FOB 成本' }]}
        >
          <InputNumber prefix="$" style={{ width: '100%' }} min={0} step={0.01} controls={false} />
        </Form.Item>
        <Form.Item
          label="头程运费"
          name="shippingCost"
          rules={[{ required: true, message: '请输入头程运费' }]}
        >
          <InputNumber prefix="$" style={{ width: '100%' }} min={0} step={0.01} controls={false} />
        </Form.Item>
        <Form.Item label="推荐佣金" name="referralFee">
          <InputNumber prefix="$" style={{ width: '100%' }} min={0} step={0.01} controls={false} />
        </Form.Item>
        <Form.Item label="FBA 配送费" name="fbaFeeOverride">
          <InputNumber prefix="$" style={{ width: '100%' }} min={0} step={0.01} controls={false} />
        </Form.Item>
      </Form>
      <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
        <Statistic title="成本合计" prefix="$" value={totalCost} precision={2} />
        <Statistic
          title="预估毛利"
          prefix="$"
          value={estimatedProfit ?? 0}
          precision={2}
          valueStyle={{
            color: estimatedProfit !== null ? (estimatedProfit >= 0 ? '#10B981' : '#EF4444') : undefined,
          }}
        />
        <Statistic
          title="毛利率"
          value={profitMargin !== null && profitMargin !== undefined ? profitMargin * 100 : 0}
          suffix="%"
          precision={1}
          valueStyle={{
            color: profitMargin !== null ? (profitMargin >= 0 ? '#10B981' : '#EF4444') : undefined,
          }}
        />
        {price ? (
          <Typography.Text type="secondary">
            当前售价 {price ? `$${price.toFixed(2)}` : '-'} - 成本 {totalCost.toFixed(2)} = 预估毛利 {estimatedProfit !== null ? `$${estimatedProfit.toFixed(2)}` : '-'}
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary">
            暂未获取到当前售价，毛利率会在价格数据返回后自动计算。
          </Typography.Text>
        )}
      </Space>
    </Modal>
  );
};

export default CostConfigModal;
