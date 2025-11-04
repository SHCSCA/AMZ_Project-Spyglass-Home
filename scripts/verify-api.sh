#!/usr/bin/env bash
set -euo pipefail

# API接口验证脚本
# 验证后端API是否正常响应

API_BASE="${VITE_API_BASE_URL:-http://shcamz.xyz:8081}"

echo "========================================="
echo "🔍 Spyglass API 验证脚本"
echo "========================================="
echo "📡 API地址: $API_BASE"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
  local method=$1
  local endpoint=$2
  local description=$3
  local expected_status=${4:-200}
  
  echo -n "Testing $method $endpoint ... "
  
  response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_BASE$endpoint" 2>/dev/null || echo "000")
  status_code=$(echo "$response" | tail -n 1)
  body=$(echo "$response" | head -n -1)
  
  if [ "$status_code" = "$expected_status" ]; then
    echo -e "${GREEN}✓ PASS${NC} ($status_code)"
    return 0
  else
    echo -e "${RED}✗ FAIL${NC} (期望: $expected_status, 实际: $status_code)"
    echo "  响应: $body" | head -n 3
    return 1
  fi
}

echo "========================================="
echo "📋 开始API接口测试"
echo "========================================="
echo ""

# 测试分组管理API
echo "🔹 分组管理 (Groups)"
test_endpoint "GET" "/api/groups?page=0&size=10" "获取分组列表"
echo ""

# 测试ASIN管理API
echo "🔹 ASIN管理"
test_endpoint "GET" "/api/asin?page=0&size=10" "获取ASIN列表"
echo ""

# 测试告警API
echo "🔹 告警管理"
test_endpoint "GET" "/api/alerts?page=0&size=10" "获取告警列表"
echo ""

# 测试Swagger文档
echo "🔹 文档接口"
test_endpoint "GET" "/v3/api-docs" "Swagger文档"
echo ""

echo "========================================="
echo "✅ API验证完成"
echo "========================================="
echo ""
echo "💡 提示:"
echo "  - 查看Swagger文档: $API_BASE/swagger-ui/index.html"
echo "  - 查看API定义: $API_BASE/v3/api-docs"
echo "========================================="
