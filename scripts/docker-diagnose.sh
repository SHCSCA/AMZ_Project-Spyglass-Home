#!/usr/bin/env bash
set -euo pipefail

# Docker 部署诊断脚本
# 用于检查容器状态、静态资源、nginx 配置等

echo "========================================="
echo "🔍 Spyglass Frontend 部署诊断"
echo "========================================="
echo ""

CONTAINER_NAME="spyglass-frontend"

# 1. 检查容器状态
echo "📦 检查容器状态..."
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  STATUS=$(docker inspect --format='{{.State.Status}}' "$CONTAINER_NAME")
  echo "   容器状态: $STATUS"
  
  if [ "$STATUS" != "running" ]; then
    echo "   ⚠️  容器未运行！查看日志："
    docker logs --tail 50 "$CONTAINER_NAME"
    exit 1
  fi
else
  echo "   ❌ 容器不存在！请先运行 ./scripts/docker-up.sh"
  exit 1
fi

echo ""
echo "📂 检查容器内文件结构..."
docker exec "$CONTAINER_NAME" sh -c "ls -lh /usr/share/nginx/html/" || {
  echo "   ❌ 无法访问容器文件系统"
  exit 1
}

echo ""
echo "📁 检查 assets 目录..."
ASSET_COUNT=$(docker exec "$CONTAINER_NAME" sh -c "find /usr/share/nginx/html/assets -type f 2>/dev/null | wc -l" || echo "0")
echo "   assets 文件数: $ASSET_COUNT"

if [ "$ASSET_COUNT" -eq 0 ]; then
  echo "   ❌ assets 目录为空！构建可能失败"
  echo "   检查构建日志："
  docker logs "$CONTAINER_NAME" | grep -i error || true
  exit 1
fi

echo ""
echo "🔍 列出 assets 目录内容 (前10个文件)..."
docker exec "$CONTAINER_NAME" sh -c "ls -lh /usr/share/nginx/html/assets/ | head -10"

echo ""
echo "📝 检查 version.json..."
docker exec "$CONTAINER_NAME" cat /usr/share/nginx/html/version.json 2>/dev/null || {
  echo "   ⚠️  version.json 不存在"
}

echo ""
echo "🌐 检查 nginx 配置..."
docker exec "$CONTAINER_NAME" nginx -t 2>&1 | grep -i "successful" && echo "   ✅ nginx 配置正确" || {
  echo "   ❌ nginx 配置错误"
  docker exec "$CONTAINER_NAME" nginx -t
  exit 1
}

echo ""
echo "🔗 测试容器内部访问..."
# 测试 index.html
docker exec "$CONTAINER_NAME" wget -q -O - http://localhost/index.html | head -5 && echo "   ✅ index.html 可访问" || {
  echo "   ❌ index.html 访问失败"
}

# 测试 version.json
docker exec "$CONTAINER_NAME" wget -q -O - http://localhost/version.json && echo "   ✅ version.json 可访问" || {
  echo "   ❌ version.json 访问失败"
}

echo ""
echo "🔍 检查具体的 chunk 文件..."
DASHBOARD_FILE=$(docker exec "$CONTAINER_NAME" sh -c "find /usr/share/nginx/html/assets -name 'DashboardPage-*.js' | head -1")
if [ -n "$DASHBOARD_FILE" ]; then
  echo "   找到 DashboardPage chunk: $DASHBOARD_FILE"
  SIZE=$(docker exec "$CONTAINER_NAME" stat -c%s "$DASHBOARD_FILE")
  echo "   文件大小: $SIZE bytes"
  
  # 测试访问
  FILENAME=$(basename "$DASHBOARD_FILE")
  docker exec "$CONTAINER_NAME" wget -q -O /dev/null "http://localhost/assets/$FILENAME" && echo "   ✅ 可以访问 $FILENAME" || {
    echo "   ❌ 无法访问 $FILENAME"
  }
else
  echo "   ❌ 找不到 DashboardPage chunk 文件"
fi

echo ""
echo "📊 端口映射检查..."
docker port "$CONTAINER_NAME" 2>/dev/null || {
  echo "   ⚠️  无法获取端口映射"
}

echo ""
echo "🔍 nginx 访问日志 (最近10条)..."
docker exec "$CONTAINER_NAME" sh -c "tail -10 /var/log/nginx/access.log 2>/dev/null" || {
  echo "   (访问日志为空或不存在)"
}

echo ""
echo "🔍 nginx 错误日志 (最近10条)..."
docker exec "$CONTAINER_NAME" sh -c "tail -10 /var/log/nginx/error.log 2>/dev/null" || {
  echo "   (错误日志为空)"
}

echo ""
echo "========================================="
echo "✅ 诊断完成"
echo "========================================="
echo ""
echo "💡 如果发现问题，可以尝试："
echo "   1. 重新构建: ./scripts/docker-up.sh --rebuild"
echo "   2. 清理缓存: ./scripts/docker-up.sh --no-cache"
echo "   3. 查看完整日志: docker logs -f $CONTAINER_NAME"
echo "   4. 进入容器: docker exec -it $CONTAINER_NAME sh"
echo ""
