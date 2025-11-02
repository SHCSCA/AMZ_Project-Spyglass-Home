import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Spin, Button, Space, Typography } from 'antd';
import AppSidebar from './components/AppSidebar';
import LogViewer from './components/LogViewer';

const AlertsPage = lazy(() => import('./pages/AlertsPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AsinDetailPage = lazy(() => import('./pages/AsinDetailPage'));

const { Sider, Content, Header, Footer } = Layout;

const App: React.FC = () => {
  const [openLogs, setOpenLogs] = useState(false);
  const [version, setVersion] = useState<any>(null);
  useEffect(() => { fetch('/version.json').then(r => r.json()).then(setVersion).catch(() => {}); }, []);
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <AppSidebar />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            <Typography.Title level={4} style={{ margin: 0 }}>Spyglass 情报系统</Typography.Title>
            {version && <Typography.Text type="secondary">commit:{version.version} build:{version.buildTime}</Typography.Text>}
          </Space>
          <Space>
            <Button onClick={() => setOpenLogs(true)}>查看日志</Button>
          </Space>
        </Header>
        <Content style={{ padding: '16px' }}>
          <Suspense fallback={<Spin />}>
            <Routes>
              <Route path="/" element={<Navigate to="/alerts" replace />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/asin/:id" element={<AsinDetailPage />} />
            </Routes>
          </Suspense>
        </Content>
        <Footer style={{ textAlign: 'center' }}>© {new Date().getFullYear()} Spyglass 前端 · 数据来源后端 API</Footer>
      </Layout>
      <LogViewer open={openLogs} onClose={() => setOpenLogs(false)} />
    </Layout>
  );
};

export default App;
