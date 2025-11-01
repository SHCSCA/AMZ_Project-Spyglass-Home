import React from 'react';
import * as echarts from 'echarts';

interface Props { option: echarts.EChartsOption }

const ReactEChartsLazy: React.FC<Props> = ({ option }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    chart.setOption(option);
    const resize = () => chart.resize();
    window.addEventListener('resize', resize);
    return () => { chart.dispose(); window.removeEventListener('resize', resize); };
  }, [option]);
  return <div ref={ref} style={{ width: '100%', height: 300 }} />;
};

export default ReactEChartsLazy;
