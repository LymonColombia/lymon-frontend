# Stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY angular.json ./
COPY tsconfig.json ./
COPY tsconfig.app.json ./
COPY tsconfig.spec.json ./
COPY public ./public
COPY src ./src
RUN pnpm exec ng build --configuration production

# Stage 2: nginx
FROM nginxinc/nginx-unprivileged:alpine
COPY --chown=root:root --chmod=755 --from=builder /app/dist/lymon-frontend/browser /usr/share/nginx/html
COPY --chown=root:root --chmod=644 nginx.conf /etc/nginx/conf.d/default.conf
USER 101
EXPOSE 8080
