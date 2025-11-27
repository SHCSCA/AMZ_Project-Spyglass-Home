
export interface CouponDisplay {
  label: string;
  color: string;
  isAmountOrPercent: boolean;
  fullText: string;
}

export function parseCouponValue(value: string | null | undefined): CouponDisplay | null {
  if (!value) return null;
  
  const val = value.trim();
  if (!val) return null;

  // 1. Check for Percentage (e.g. 5%, 10% off)
  // 优先匹配百分比
  const percentMatch = val.match(/(\d+(\.\d+)?%)/);
  if (percentMatch) {
    return {
      label: percentMatch[1],
      color: '#F59E0B', // Orange/Gold
      isAmountOrPercent: true,
      fullText: val
    };
  }

  // 2. Check for Money (e.g. $2.00, $5, $10.50)
  const moneyMatch = val.match(/(\$\d+(\.\d+)?)/);
  if (moneyMatch) {
    let label = moneyMatch[1];
    // Remove .00 to save space, but keep .50
    if (label.endsWith('.00')) {
      label = label.slice(0, -3);
    }
    return {
      label,
      color: '#10B981', // Green
      isAmountOrPercent: true,
      fullText: val
    };
  }

  // 3. Fallback for generic description
  // 如果没有数字金额或百分比，视为普通描述/促销
  return {
    label: '促', // Promotion
    color: '#3B82F6', // Blue
    isAmountOrPercent: false,
    fullText: val
  };
}
