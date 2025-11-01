import React from 'react';
import { Alert } from 'antd';

const ErrorMessage: React.FC<{ error: Error }> = ({ error }) => (
  <Alert type="error" message="数据加载失败" description={error.message} showIcon />
);
export default ErrorMessage;
