import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Spin } from 'antd';
import AppSidebar from './components/AppSidebar';

const AlertsPage = lazy(() => import('./pages/AlertsPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AsinDetailPage = lazy(() => import('./pages/AsinDetailPage'));

const { Sider, Content } = Layout;

const App: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <AppSidebar />
      </Sider>
      <Layout>
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
      </Layout>
    </Layout>
  );
};

export default App;
