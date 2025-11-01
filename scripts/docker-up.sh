#!/usr/bin/env bash
set -euo pipefail

# 一键构建并启动前端容器（编排模式）
# 可用环境变量：
#   VITE_API_BASE_URL  后端 API 地址 (默认 https://shcamz.xyz:8081)
#   FRONTEND_PORT      宿主机端口 (默认 8082)
#   APP_VERSION        镜像标签后缀 (默认 latest)
#   APP_BUILD_TIME     构建时间戳 (默认 当前时间)

ROOT_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
cd "$ROOT_DIR"

: "${VITE_API_BASE_URL:=http://shcamz.xyz:8081}"
: "${FRONTEND_PORT:=8082}"
: "${APP_VERSION:=latest}"
: "${APP_BUILD_TIME:=$(date +%Y%m%d%H%M%S)}"

IMAGE_NAME="spyglass-frontend:${APP_VERSION}"

echo "[INFO] 构建镜像: $IMAGE_NAME (API_BASE=$VITE_API_BASE_URL PORT=$FRONTEND_PORT)"
DOCKER_BUILDKIT=1 docker build \
  --build-arg VITE_API_BASE_URL="$VITE_API_BASE_URL" \
  --build-arg APP_BUILD_TIME="$APP_BUILD_TIME" \
  -t "$IMAGE_NAME" .

echo "[INFO] 使用 docker compose 启动服务 (frontend port=$FRONTEND_PORT)"
FRONTEND_PORT="$FRONTEND_PORT" VITE_API_BASE_URL="$VITE_API_BASE_URL" docker compose up -d --build frontend

echo "[INFO] 服务已启动: http://localhost:$FRONTEND_PORT"
