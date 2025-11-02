#!/usr/bin/env bash
# 简单后端 API 健康检查脚本
# 使用方式： ./scripts/check-api.sh http://shcamz.xyz:8081/api
# 未传参数则默认使用 VITE_API_BASE_URL 或 /api

set -euo pipefail
BASE="${1:-${VITE_API_BASE_URL:-/api}}"

endpoints=(
  "/asin?page=0&size=1"
  "/alerts?page=0&size=1"
)

printf "Checking backend API base: %s\n" "$BASE"
fail=0
for ep in "${endpoints[@]}"; do
  url="$BASE$ep"
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || true)
  if [[ "$code" == "200" || "$code" == "404" ]]; then
    printf "[OK] %s -> %s\n" "$ep" "$code"
  else
    printf "[FAIL] %s -> %s\n" "$ep" "$code"
    fail=1
  fi
  sleep 0.2
done

if [[ $fail -eq 1 ]]; then
  echo "部分接口检查失败，请确认后端服务与反代配置。" >&2
  exit 1
fi

echo "全部接口检查完成。"
