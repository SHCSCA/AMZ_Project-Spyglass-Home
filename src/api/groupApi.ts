/**
 * 分组管理相关API
 */

import { apiRequest } from './client';
import { PageResponse } from '../types';

export interface GroupResponse {
  id: number;
  name: string;
  description?: string; // 后端返回description字段
  createdAt?: string;
  updatedAt?: string;
  asinCount?: number; // 后端聚合返回
}

export interface CreateGroupDto {
  name: string;
  description?: string;
}

export interface UpdateGroupDto {
  name: string;
  description?: string;
}

/**
 * 获取所有分组列表
 */
export async function fetchGroups(
  page: number = 0,
  size: number = 100
): Promise<PageResponse<GroupResponse>> {
  return apiRequest<PageResponse<GroupResponse>>(`/api/groups?page=${page}&size=${size}`);
}

/**
 * 创建新分组
 */
export async function createGroup(data: CreateGroupDto): Promise<GroupResponse> {
  return apiRequest<GroupResponse>('/api/groups', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * 更新分组信息
 */
export async function updateGroup(id: number, data: UpdateGroupDto): Promise<GroupResponse> {
  return apiRequest<GroupResponse>(`/api/groups/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * 删除分组
 */
export async function deleteGroup(id: number): Promise<void> {
  await apiRequest(`/api/groups/${id}`, {
    method: 'DELETE',
  });
}
