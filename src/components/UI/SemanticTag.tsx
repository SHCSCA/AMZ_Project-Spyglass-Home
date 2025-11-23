import React from 'react';
import { Tag } from 'antd';

export type SemanticTagTone = 'positive' | 'negative' | 'warning' | 'info';

const toneMap: Record<SemanticTagTone, string> = {
  positive: '#10B981',
  negative: '#EF4444',
  warning: '#F59E0B',
  info: '#6366F1',
};

interface SemanticTagProps {
  tone?: SemanticTagTone;
  children: React.ReactNode;
  icon?: React.ReactNode;
  bordered?: boolean;
}

const SemanticTag: React.FC<SemanticTagProps> = ({ tone = 'info', children, icon, bordered = false }) => {
  return (
    <Tag
      bordered={bordered}
      icon={icon}
      style={{
        background: `${toneMap[tone]}1A`,
        borderColor: bordered ? toneMap[tone] : 'transparent',
        color: toneMap[tone],
        borderRadius: 999,
        fontWeight: 500,
      }}
    >
      {children}
    </Tag>
  );
};

export default SemanticTag;
