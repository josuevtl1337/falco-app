# Stage 1: Build frontend
FROM node:22-slim AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY src/ src/
COPY vite.config.ts tsconfig.json tsconfig.node.json components.json index.html ./
COPY backend/models/ backend/models/
RUN npx vite build

# Stage 2: Install backend dependencies
FROM node:22-slim AS backend-deps
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
RUN npm ci --omit=dev

# Stage 3: Runtime
FROM node:22-slim
WORKDIR /app
COPY --from=frontend-build /app/dist ./dist
COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/

ENV NODE_ENV=production
ENV DB_PATH=/data/app.db
ENV PORT=3001
EXPOSE 3001

CMD ["node", "backend/node_modules/tsx/dist/cli.mjs", "backend/server.ts"]
