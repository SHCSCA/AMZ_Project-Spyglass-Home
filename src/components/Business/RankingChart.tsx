import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { Empty, Skeleton } from 'antd';
import type { EChartsOption } from 'echarts';
import type { KeywordRankPoint } from '../../types';
import ReactECharts from '../../pages/ReactEChartsLazy';

interface RankingChartProps {
  points: KeywordRankPoint[];
  loading?: boolean;
  height?: number;
}

const palette = ['#6366F1', '#22D3EE', '#F97316', '#F472B6', '#0EA5E9', '#14B8A6', '#FACC15', '#A855F7'];

const RankingChart: React.FC<RankingChartProps> = ({ points, loading, height = 360 }) => {
  const option = useMemo<EChartsOption | null>(() => {
    if (!points.length) return null;
    const sortedDates = Array.from(
      new Set(points.map((p) => dayjs(p.snapshotAt).format('YYYY-MM-DD')))
    ).sort((a, b) => dayjs(a).valueOf() - dayjs(b).valueOf());

    const seriesMap = new Map<number, { keyword: string; color: string; data: (number | null)[] }>();
    points.forEach((point) => {
      const idx = sortedDates.indexOf(dayjs(point.snapshotAt).format('YYYY-MM-DD'));
      if (idx === -1) return;
      if (!seriesMap.has(point.keywordId)) {
        const color = palette[seriesMap.size % palette.length];
        seriesMap.set(point.keywordId, { keyword: point.keyword, color, data: new Array(sortedDates.length).fill(null) });
      }
      const series = seriesMap.get(point.keywordId);
      if (!series) return;
      series.data[idx] = point.organicRank ?? point.sponsoredRank ?? null;
    });

    const series = Array.from(seriesMap.values()).map((item) => ({
      name: item.keyword,
      type: 'line' as const,
      smooth: true,
      data: item.data,
      lineStyle: { width: 2 },
      emphasis: { focus: 'series' as const },
      itemStyle: { color: item.color },
    }));

    const chartOption = {
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        type: 'scroll',
      },
      grid: { left: 40, right: 20, top: 40, bottom: 80 },
      xAxis: {
        type: 'category',
        data: sortedDates,
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        inverse: true,
        min: 1,
        axisLabel: { formatter: (value: number) => `#${value}` },
      },
      dataZoom: [
        { type: 'inside' },
        { type: 'slider', height: 30 },
      ],
      series,
    } as EChartsOption;
    return chartOption;
  }, [points]);

  if (loading) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  if (!option) {
    return <Empty description="暂未获取到关键词排名数据" />;
  }

  return <ReactECharts option={option} height={height} />;
};

export default RankingChart;
