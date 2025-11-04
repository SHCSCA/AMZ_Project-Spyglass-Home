import React, { useEffect, useState, useRef } from 'react';
import { Drawer, Table, Tag } from 'antd';
import { getLogs, LogEntry } from '../logger';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface VersionInfo {
  version: string;
  buildTime: string;
  apiBase: string;
}

const columns = [
  { title: '时间', dataIndex: 'ts', key: 'ts', width: 180 },
  {
    title: '级别',
    dataIndex: 'level',
    key: 'level',
    width: 80,
    render: (lvl: string) => (
      <Tag color={lvl === 'error' ? 'red' : lvl === 'warn' ? 'orange' : 'blue'}>{lvl}</Tag>
    ),
  },
  { title: '消息', dataIndex: 'message', key: 'message', width: 160 },
  {
    title: '上下文',
    dataIndex: 'context',
    key: 'context',
    render: (c: Record<string, unknown>) => (
      <pre style={{ whiteSpace: 'pre-wrap', maxWidth: 400 }}>
        {c ? JSON.stringify(c, null, 2) : ''}
      </pre>
    ),
  },
];

const LogViewer: React.FC<Props> = ({ open, onClose }) => {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (open) {
      setEntries(getLogs());
      fetch('/version.json')
        .then(r => r.json())
        .then(v => {
          if (mountedRef.current) setVersion(v);
        })
        .catch(() => {});
    }
  }, [open]);

  return (
    <Drawer title={<>日志 & 版本信息 {version && <span style={{ fontSize: 12, marginLeft: 8 }}>v:{version.version} build:{version.buildTime}</span>}</>} open={open} onClose={onClose} width={720}>
      <Table size="small" rowKey={(r) => r.ts + r.message} columns={columns} dataSource={entries} pagination={{ pageSize: 20 }} />
    </Drawer>
  );
};

export default LogViewer;