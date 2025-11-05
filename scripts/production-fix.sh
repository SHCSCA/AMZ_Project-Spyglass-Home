#!/usr/bin/env bash
set -euo pipefail

# 生产环境快速修复脚本
# 用于解决 Docker 部署静态资源 502 问题

echo "========================================="
echo "🚀 生产环境快速修复部署"
echo "========================================="
echo ""

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
  echo "❌ 错误：请在项目根目录运行此脚本"
  exit 1
fi

echo "📥 步骤 1/5: 拉取最新代码..."
git pull origin main || {
  echo "❌ Git 拉取失败，请检查网络连接"
  exit 1
}

echo ""
echo "🧹 步骤 2/5: 清理旧容器和镜像..."
docker rm -f spyglass-frontend 2>/dev/null || true
docker rmi -f spyglass-frontend:latest 2>/dev/null || true

echo ""
echo "🔨 步骤 3/5: 重新构建镜像（无缓存）..."
./scripts/docker-up.sh --no-cache --rebuild || {
  echo "❌ 构建失败，请检查错误信息"
  exit 1
}

echo ""
echo "⏳ 步骤 4/5: 等待容器就绪..."
sleep 5

echo ""
echo "🔍 步骤 5/5: 运行诊断检查..."
./scripts/docker-diagnose.sh || {
  echo "⚠️  诊断发现问题，但容器可能已启动"
  echo "请手动检查 http://localhost:8082"
}

echo ""
echo "========================================="
echo "✅ 修复完成！"
echo "========================================="
echo ""
echo "🌐 访问地址: http://156.238.230.229:8082/dashboard"
echo ""
echo "💡 验证清单："
echo "   1. 打开浏览器，访问上述地址"
echo "   2. 检查控制台是否有 502 错误"
echo "   3. 验证小类BSR排名趋势图是否显示"
echo "   4. 检查历史表格是否有小类排名列"
echo ""
echo "📊 性能检查："
echo "   gzip: curl -H 'Accept-Encoding: gzip' -I http://localhost:8082/assets/index-*.js | grep 'Content-Encoding'"
echo "   缓存: curl -I http://localhost:8082/assets/index-*.js | grep 'Cache-Control'"
echo ""
echo "📋 如遇问题："
echo "   查看日志: docker logs -f spyglass-frontend"
echo "   进入容器: docker exec -it spyglass-frontend sh"
echo "   重新诊断: ./scripts/docker-diagnose.sh"
echo ""
