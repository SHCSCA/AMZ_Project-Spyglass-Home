import React from 'react';
import { List, Card } from 'antd';
import { AlertItem } from '../types';

interface Props { alerts: AlertItem[] }

const AsinAlertsList: React.FC<Props> = ({ alerts }) => {
  return (
    <List
      dataSource={alerts}
      renderItem={(item) => (
        <List.Item>
          <Card size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div><strong>{item.type}</strong></div>
              <small>{new Date(item.createdAt).toLocaleString()}</small>
            </div>
            <div style={{ marginTop: 4 }}>{item.message}</div>
          </Card>
        </List.Item>
      )}
    />
  );
};

export default AsinAlertsList;