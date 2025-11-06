import React, { Suspense, lazy, useEffect, useState, useRef } from 'react';
import { logError } from './logger';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Spin, Button, Space, Typography } from 'antd';
import AppSidebar from './components/AppSidebar';
import LogViewer from './components/LogViewer';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AsinDetailPage = lazy(() => import('./pages/AsinDetailPage'));
const GroupsPage = lazy(() => import('./pages/GroupsPage'));

const { Sider, Content, Header, Footer } = Layout;

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logError('react_error_boundary', { error: String(error), info });
  }
  render() {
    if (this.state.error)
      return (
        <div style={{ padding: 24 }}>
          <h2>界面发生错误</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{String(this.state.error)}</pre>
        </div>
      );
    return this.props.children;
  }
}

const App: React.FC = () => {
  const [openLogs, setOpenLogs] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 静默加载版本信息（用于健康检查）
  useEffect(() => {
    fetch('/version.json').catch(() => {});
  }, []);

  useEffect(() => {
    const handlerError = (e: ErrorEvent) => {
      logError('window_error', { message: e.message, filename: e.filename, lineno: e.lineno });
    };
    const handlerRejection = (e: PromiseRejectionEvent) => {
      logError('unhandled_rejection', { reason: String(e.reason) });
    };
    window.addEventListener('error', handlerError);
    window.addEventListener('unhandledrejection', handlerRejection);
    return () => {
      window.removeEventListener('error', handlerError);
      window.removeEventListener('unhandledrejection', handlerRejection);
    };
  }, []);
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <AppSidebar />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Space>
            <Typography.Title level={4} style={{ margin: 0 }}>
              Amazon ASIN 监控系统
            </Typography.Title>
          </Space>
          <Space>
            <Button size="small" type="text" onClick={() => setOpenLogs(true)}>
              系统日志
            </Button>
          </Space>
        </Header>
        <Content style={{ padding: '16px' }}>
          <ErrorBoundary>
            <Suspense fallback={<Spin />}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/groups" element={<GroupsPage />} />
                <Route path="/asin/:asin" element={<AsinDetailPage />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </Content>
        <Footer style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
          Amazon ASIN 监控系统 © {new Date().getFullYear()}
        </Footer>
      </Layout>
      <LogViewer open={openLogs} onClose={() => setOpenLogs(false)} />
    </Layout>
  );
};

export default App;
