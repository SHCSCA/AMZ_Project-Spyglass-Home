import React from 'react';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';

const items = [{ key: '/dashboard', label: 'ASIN 仪表盘' }];

const AppSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[location.pathname.startsWith('/asin/') ? '/dashboard' : location.pathname]}
      onClick={(e) => navigate(e.key)}
      items={items}
    />
  );
};

export default AppSidebar;
