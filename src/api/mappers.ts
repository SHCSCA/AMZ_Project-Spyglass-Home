import {
  AlertLogResponse,
  AlertItem,
  ReviewAlertResponse,
  ReviewItem,
  AsinResponse,
  AsinItem,
  AsinHistoryPoint,
  HistoryPoint,
} from '../types';
import { formatPercent } from './adapters';

export function mapAlertLog(r: AlertLogResponse): AlertItem {
  return {
    id: r.id,
    asinId: r.asinId,
    asin: r.asinCode,
    type: r.alertType,
    createdAt: r.alertAt,
    message: r.message || r.alertType,
    oldValue: r.oldValue,
    newValue: r.newValue,
    // change_percent 可能后端输出数值或字符串，统一格式为带符号百分比字符串
    changePercent: formatPercent(r.changePercent as string | number | undefined),
    severity: r.severity,
    // status: 后端暂未实现，保持 undefined
  };
}

export function mapReview(r: ReviewAlertResponse): ReviewItem {
  return {
    id: r.id,
    asinId: r.asinId,
    rating: r.rating,
    createdAt: r.reviewDate, // 采用 reviewDate
    text: r.reviewText,
  };
}

export function mapAsin(a: AsinResponse): AsinItem {
  return {
    ...a,
    // 可在此聚合最新快照字段（后端未来若直接提供可删除）
  };
}

export function mapHistoryPoint(h: AsinHistoryPoint): HistoryPoint {
  return {
    timestamp: h.snapshotAt,
    price: h.price,
    bsr: h.bsr,
    inventory: h.inventory,
    // 其他扩展字段（如分类、评分等）保留在原始 AsinHistoryPoint，不进入精简点位结构
  };
}
