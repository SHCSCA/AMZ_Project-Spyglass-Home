#!/usr/bin/env bash
set -euo pipefail

# 一键构建并启动前端容器（编排模式）
# 可用环境变量：
#   VITE_API_BASE_URL  后端 API 地址 (默认 http://shcamz.xyz:8081)
#   FRONTEND_PORT      宿主机端口 (默认 8082)
#   APP_VERSION        镜像标签后缀 (默认 latest)
#   APP_BUILD_TIME     构建时间戳 (默认 当前时间)
#   GIT_COMMIT         Git 短提交号 (默认自动获取, 失败则 unknown)
#
# 依赖：Docker / docker compose；镜像构建基于 Node 20 (见 Dockerfile)。

set -o pipefail

if [[ "${1:-}" == "--help" ]]; then
  cat <<'USAGE'
用法: ./scripts/docker-up.sh [--no-cache]

可选参数:
  --no-cache   构建镜像时禁用缓存

可用环境变量:
  VITE_API_BASE_URL   后端 API 地址 (默认 http://shcamz.xyz:8081)
  FRONTEND_PORT       宿主机端口 (默认 8082)
  APP_VERSION         镜像标签 (默认 latest)
  APP_BUILD_TIME      构建时间戳 (默认 当前时间)
  GIT_COMMIT          Git 提交号 (默认自动获取)
USAGE
  exit 0
fi

ROOT_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
cd "$ROOT_DIR"

: "${VITE_API_BASE_URL:=http://shcamz.xyz:8081}"
: "${FRONTEND_PORT:=8082}"
: "${APP_VERSION:=latest}"
: "${APP_BUILD_TIME:=$(date +%Y%m%d%H%M%S)}"
GIT_COMMIT=${GIT_COMMIT:-$(git rev-parse --short HEAD 2>/dev/null || echo unknown)}

IMAGE_NAME="spyglass-frontend:${APP_VERSION}"

echo "[INFO] 构建镜像: $IMAGE_NAME (API_BASE=$VITE_API_BASE_URL PORT=$FRONTEND_PORT)"
BUILD_ARGS=(--build-arg VITE_API_BASE_URL="$VITE_API_BASE_URL" --build-arg APP_BUILD_TIME="$APP_BUILD_TIME" --build-arg GIT_COMMIT="$GIT_COMMIT")
[[ "${1:-}" == "--no-cache" ]] && BUILD_ARGS+=(--no-cache)
DOCKER_BUILDKIT=1 docker build "${BUILD_ARGS[@]}" -t "$IMAGE_NAME" .

echo "[INFO] 使用 docker compose 启动服务 (frontend port=$FRONTEND_PORT)"
FRONTEND_PORT="$FRONTEND_PORT" VITE_API_BASE_URL="$VITE_API_BASE_URL" docker compose up -d --build frontend

echo "[INFO] 服务已启动: http://localhost:$FRONTEND_PORT"
echo "[INFO] 镜像标签: $IMAGE_NAME (commit=$GIT_COMMIT buildTime=$APP_BUILD_TIME)"
echo "[INFO] 可查看 dist/version.json 以获取构建元数据"
