import React from 'react';
import { Skeleton } from 'antd';

interface SkeletonPlaceholderProps {
  lines?: number;
  active?: boolean;
  className?: string;
}

const SkeletonPlaceholder: React.FC<SkeletonPlaceholderProps> = ({ lines = 3, active = true, className }) => {
  return <Skeleton active={active} paragraph={{ rows: lines }} className={className} />;
};

export default SkeletonPlaceholder;
