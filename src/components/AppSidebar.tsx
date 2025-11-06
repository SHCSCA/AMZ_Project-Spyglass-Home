import React from 'react';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppstoreOutlined, FolderOutlined } from '@ant-design/icons';

const items = [
  { key: '/dashboard', label: 'ASIN 列表', icon: <AppstoreOutlined /> },
  { key: '/groups', label: '分组管理', icon: <FolderOutlined /> },
];

const AppSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[
        location.pathname.startsWith('/asin/')
          ? '/dashboard'
          : location.pathname.startsWith('/groups')
            ? '/groups'
            : location.pathname,
      ]}
      onClick={(e) => navigate(e.key)}
      items={items}
    />
  );
};

export default AppSidebar;
