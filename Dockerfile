# ---- Build Stage ----
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# 允许在构建时注入 API 基地址，如果未提供则使用相对路径（需 Nginx 转发）
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

# ---- Runtime Stage ----
FROM nginx:1.27-alpine AS runtime
WORKDIR /usr/share/nginx/html
# 清理默认静态文件
RUN rm -rf ./*
COPY --from=build /app/dist .
# 提供一个默认的 nginx 配置以支持前端路由 fallback
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK CMD wget -q -O - http://localhost/ || exit 1

# 说明：
# 构建: docker build -t spyglass-frontend --build-arg VITE_API_BASE_URL=http://backend:8080 .
# 运行: docker run -p 8080:80 spyglass-frontend
