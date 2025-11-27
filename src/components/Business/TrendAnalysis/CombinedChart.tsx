import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { Empty, Skeleton } from 'antd';
import type { EChartsOption } from 'echarts';
import type { AsinHistoryPoint } from '../../../types';
import { parseCouponValue } from '../../../utils/coupon';
import ReactECharts from '../../../pages/ReactEChartsLazy';

interface CombinedChartProps {
  points: AsinHistoryPoint[];
  loading?: boolean;
  height?: number;
}

const CombinedChart: React.FC<CombinedChartProps> = ({ points, loading, height = 380 }) => {
  const option = useMemo<EChartsOption | null>(() => {
    if (!points.length) return null;
    const sorted = [...points].sort((a, b) => dayjs(a.snapshotAt).valueOf() - dayjs(b.snapshotAt).valueOf());
    const categories = sorted.map((item) => dayjs(item.snapshotAt).format('YYYY-MM-DD HH:mm'));
    const priceData = sorted.map((item) => item.price ?? null);
    const subRankData = sorted.map((item) => item.bsrSubcategoryRank ?? null);
    const inventoryData = sorted.map((item) => item.inventory ?? null);

    const couponMarkPoints = sorted
      .map((item) => {
        const coupon = parseCouponValue(item.couponValue);
        if (!coupon) return null;
        
        const isLong = coupon.label.length > 1; // $5 is 2 chars, 5% is 2 chars. '促' is 1.
        
        return {
          coord: [dayjs(item.snapshotAt).format('YYYY-MM-DD HH:mm'), item.price ?? 0],
          name: 'coupon',
          value: coupon.label,
          itemStyle: { color: coupon.color },
          // Use roundRect (tag style) for values, pin for generic icon
          symbol: isLong ? 'roundRect' : 'pin',
          symbolSize: isLong ? [36, 20] : 30,
          symbolOffset: isLong ? [0, -15] : [0, 0],
          label: {
            fontSize: 10,
            color: '#fff',
            padding: [0, 2]
          },
          tooltip: { formatter: () => `优惠信息: ${coupon.fullText}` },
        };
      })
      .filter((item): item is NonNullable<typeof item> => !!item);

    const dealRanges: { start: string; end: string }[] = [];
    let currentRange: { start: string; end: string } | null = null;
    sorted.forEach((item) => {
      const ts = dayjs(item.snapshotAt).format('YYYY-MM-DD HH:mm');
      if (item.isLightningDeal) {
        if (!currentRange) {
          currentRange = { start: ts, end: ts };
        } else {
          currentRange.end = ts;
        }
      } else if (currentRange) {
        dealRanges.push(currentRange);
        currentRange = null;
      }
    });
    if (currentRange) dealRanges.push(currentRange);

    const chartOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      legend: { data: ['价格', 'BSR 小类排名', '真实库存'] },
      grid: { left: 50, right: 80, top: 40, bottom: 70 },
      xAxis: { type: 'category', data: categories },
      yAxis: [
        {
          type: 'value',
          name: '价格',
          position: 'left',
          axisLabel: { formatter: (value: number) => `$${value}` },
        },
        {
          type: 'value',
          name: 'BSR 小类排名',
          position: 'right',
          inverse: true,
          min: 1,
          axisLabel: { formatter: (value: number) => `#${value}` },
        },
        {
          type: 'value',
          name: '库存',
          position: 'right',
          offset: 60,
          splitLine: { show: false },
        },
      ],
      dataZoom: [
        { type: 'inside', throttle: 60 },
        { type: 'slider', height: 30 },
      ],
      series: [
        {
          name: '价格',
          type: 'line' as const,
          data: priceData,
          smooth: true,
          showSymbol: false,
          yAxisIndex: 0,
          itemStyle: { color: '#1677ff' },
          markPoint: couponMarkPoints.length ? { data: couponMarkPoints } : undefined,
          markArea: dealRanges.length
            ? {
                itemStyle: { color: 'rgba(239, 68, 68, 0.12)' },
                data: dealRanges.map((range) => [{ xAxis: range.start }, { xAxis: range.end }]),
              }
            : undefined,
        },
        {
          name: 'BSR 小类排名',
          type: 'line' as const,
          data: subRankData,
          yAxisIndex: 1,
          smooth: true,
          showSymbol: false,
          itemStyle: { color: '#F59E0B' },
        },
        {
          name: '真实库存',
          type: 'line' as const,
          data: inventoryData,
          yAxisIndex: 2,
          step: 'end',
          showSymbol: false,
          itemStyle: { color: '#722ED1' },
        },
      ],
    } as EChartsOption;
    return chartOption;
  }, [points]);

  if (loading) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }

  if (!option) {
    return <Empty description="暂无历史数据" />;
  }

  return <ReactECharts option={option} height={height} />;
};

export default CombinedChart;
