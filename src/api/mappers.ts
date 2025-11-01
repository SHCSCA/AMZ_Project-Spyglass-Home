import { AlertLogResponse, AlertItem, ReviewAlertResponse, ReviewItem, AsinResponse, AsinItem, AsinHistoryPoint, HistoryPoint } from '../types';

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
    changePercent: r.changePercent,
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
  };
}

export function mapHistoryPoint(h: AsinHistoryPoint): HistoryPoint {
  return {
    timestamp: h.snapshotAt,
    price: h.price,
    bsr: h.bsr,
    inventory: h.inventory,
  };
}
