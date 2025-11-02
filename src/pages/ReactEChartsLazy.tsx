import React from 'react';
import * as echarts from 'echarts';
import { logError, logInfo } from '../logger';

interface Props { option: echarts.EChartsOption }

const ReactEChartsLazy: React.FC<Props> = ({ option }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!ref.current) return;
    let chart: echarts.ECharts | null = null;
    try {
      chart = echarts.init(ref.current);
      chart.setOption(option);
      logInfo('echarts_option_applied', { seriesCount: (option as any)?.series?.length, hasDataZoom: !!(option as any)?.dataZoom });
    } catch (e) {
      logError('echarts_init_failed', { error: String(e) });
      return;
    }
    const resize = () => chart.resize();
    window.addEventListener('resize', resize);
    return () => { try { chart?.dispose(); } catch {} window.removeEventListener('resize', resize); };
  }, [option]);
  return <div ref={ref} style={{ width: '100%', height: 300 }} />;
};

export default ReactEChartsLazy;
