#!/usr/bin/env bash
set -euo pipefail

# 一键构建并启动前端容器（编排模式）
# 可用环境变量：
#   VITE_API_BASE_URL  后端 API 地址 (默认 /api - 通过nginx反向代理)
#   FRONTEND_PORT      宿主机端口 (默认 8082)
#   APP_VERSION        镜像标签后缀 (默认 latest)
#   APP_BUILD_TIME     构建时间戳 (默认 当前时间)
#   GIT_COMMIT         Git 短提交号 (默认自动获取, 失败则 unknown)
#
# 依赖：Docker / docker compose；镜像构建基于 Node 20 (见 Dockerfile)。

if [[ "${1:-}" == "--help" ]]; then
  cat <<'USAGE'
用法: ./scripts/docker-up.sh [--no-cache] [--rebuild]

可选参数:
  --no-cache   构建镜像时禁用缓存
  --rebuild    强制重新构建镜像

可用环境变量:
  VITE_API_BASE_URL   后端 API 地址 (默认 /api)
  FRONTEND_PORT       宿主机端口 (默认 8082)
  APP_VERSION         镜像标签 (默认 latest)
  APP_BUILD_TIME      构建时间戳 (默认 当前时间)
  GIT_COMMIT          Git 提交号 (默认自动获取)

示例:
  # 使用默认配置启动
  ./scripts/docker-up.sh

  # 使用外部后端地址
  VITE_API_BASE_URL=http://shcamz.xyz:8081 ./scripts/docker-up.sh

  # 修改前端端口
  FRONTEND_PORT=9090 ./scripts/docker-up.sh

  # 禁用缓存重新构建
  ./scripts/docker-up.sh --no-cache
USAGE
  exit 0
fi

ROOT_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
cd "$ROOT_DIR"

: "${VITE_API_BASE_URL:=/api}"
: "${FRONTEND_PORT:=8082}"
: "${APP_VERSION:=latest}"
: "${APP_BUILD_TIME:=$(date +%Y%m%d%H%M%S)}"
GIT_COMMIT=${GIT_COMMIT:-$(git rev-parse --short HEAD 2>/dev/null || echo unknown)}

IMAGE_NAME="spyglass-frontend:${APP_VERSION}"

echo "========================================="
echo "🚀 Spyglass Frontend Docker 启动脚本"
echo "========================================="
echo "📦 镜像名称: $IMAGE_NAME"
echo "🌐 API地址:  $VITE_API_BASE_URL"
echo "🔌 前端端口: $FRONTEND_PORT"
echo "📝 Git提交:  $GIT_COMMIT"
echo "⏰ 构建时间: $APP_BUILD_TIME"
echo "========================================="

BUILD_ARGS=(
  --build-arg VITE_API_BASE_URL="$VITE_API_BASE_URL"
  --build-arg APP_BUILD_TIME="$APP_BUILD_TIME"
  --build-arg GIT_COMMIT="$GIT_COMMIT"
)

# 处理命令行参数
for arg in "$@"; do
  case "$arg" in
    --no-cache)
      BUILD_ARGS+=(--no-cache)
      echo "⚠️  已启用 --no-cache，将禁用构建缓存"
      ;;
    --rebuild)
      echo "🔄 强制重新构建镜像..."
      docker rmi -f "$IMAGE_NAME" 2>/dev/null || true
      ;;
  esac
done

echo ""
echo "🔨 开始构建镜像..."
DOCKER_BUILDKIT=1 docker build "${BUILD_ARGS[@]}" -t "$IMAGE_NAME" .

if [ $? -ne 0 ]; then
  echo "❌ 镜像构建失败！"
  exit 1
fi

echo ""
echo "✅ 镜像构建成功！"
echo ""
echo "🚀 启动容器服务..."
FRONTEND_PORT="$FRONTEND_PORT" VITE_API_BASE_URL="$VITE_API_BASE_URL" docker compose up -d --build frontend

if [ $? -ne 0 ]; then
  echo "❌ 容器启动失败！"
  exit 1
fi

echo ""
echo "========================================="
echo "✅ 部署完成！"
echo "========================================="
echo "🌐 访问地址: http://localhost:$FRONTEND_PORT"
echo ""
echo "📋 常用命令:"
echo "  查看日志: docker compose logs -f frontend"
echo "  停止服务: docker compose down"
echo "  重启服务: docker compose restart frontend"
echo "========================================="

echo "[INFO] 服务已启动: http://localhost:$FRONTEND_PORT"
echo "[INFO] 镜像标签: $IMAGE_NAME (commit=$GIT_COMMIT buildTime=$APP_BUILD_TIME)"
echo "[INFO] 可查看 dist/version.json 以获取构建元数据"
