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

// 告警类型中文映射与消息模板
const ALERT_TYPE_LABEL: Record<string, string> = {
  PRICE_CHANGE: '价格变动',
  INVENTORY_THRESHOLD: '库存低于阈值',
  TITLE: '标题变更',
  MAIN_IMAGE: '主图变更',
  BULLET_POINTS: '五点要点变更',
  APLUS_CONTENT: 'A+内容变更',
  NEGATIVE_REVIEW: '新增差评',
};

function buildAlertMessage(r: AlertLogResponse): string {
  const base = ALERT_TYPE_LABEL[r.alertType] || r.alertType;
  // 若后端已有自定义 message，优先使用后端内容但仍可补充差异值
  if (r.message) return r.message;
  // 根据类型定制简单的差异描述
  switch (r.alertType) {
    case 'PRICE_CHANGE': {
      if (r.oldValue && r.newValue) return `价格从 ${r.oldValue} 变为 ${r.newValue}`;
      if (r.newValue) return `价格更新为 ${r.newValue}`;
      return base;
    }
    case 'INVENTORY_THRESHOLD': {
      if (r.newValue) return `库存 ${r.newValue} 低于阈值${r.oldValue ?? ''}`.trim();
      return base;
    }
    case 'NEGATIVE_REVIEW': {
      return '收到新的低评分评论';
    }
    case 'TITLE': {
      return '商品标题发生变化';
    }
    case 'MAIN_IMAGE': {
      return '主图发生变化';
    }
    case 'BULLET_POINTS': {
      return '五点描述发生变化';
    }
    case 'APLUS_CONTENT': {
      return 'A+ 内容发生变化';
    }
    default: {
      if (r.oldValue && r.newValue) return `${base}: ${r.oldValue} → ${r.newValue}`;
      return base;
    }
  }
}

export function mapAlertLog(r: AlertLogResponse): AlertItem {
  return {
    id: r.id,
    asinId: r.asinId,
    asin: r.asinCode,
    type: r.alertType,
    createdAt: r.alertAt,
    message: buildAlertMessage(r),
    oldValue: r.oldValue,
    newValue: r.newValue,
    changePercent: formatPercent(r.changePercent as string | number | undefined),
    severity: r.severity,
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
