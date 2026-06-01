# Multi-stage Dockerfile for Railway deployment
# Builds backend and frontend, serves frontend with backend API

# Stage 1: Build Backend
FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/src ./src
COPY backend/tsconfig.json .
RUN npm run build

# Stage 2: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN echo "Installing frontend dependencies..." && npm ci --verbose
COPY frontend/src ./src
COPY frontend/index.html ./
COPY frontend/public ./public
COPY frontend/vite.config.ts ./
COPY frontend/vitest.config.ts ./
COPY frontend/tsconfig.json ./
COPY frontend/tsconfig.node.json ./
COPY frontend/postcss.config.js ./
COPY frontend/tailwind.config.js ./
RUN echo "Building frontend..." && npm run build && echo "Build complete, checking files..."
RUN echo "Verifying build output..." && ls -la dist/ && echo "Files in dist:" && find dist/ -type f | wc -l && test -f dist/index.html && echo "✓ Frontend build successful - index.html exists" || echo "ERROR: index.html not found in dist!"

# Stage 3: Runtime - Backend
FROM node:20-alpine AS runtime
WORKDIR /app

# Install dumb-init for signal handling
RUN apk add --no-cache dumb-init

# Copy backend production dependencies
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy built backend
COPY --from=backend-builder /app/dist ./dist

# Copy database files (schema and migrations)
COPY backend/database ./database

# Copy built frontend - always run this fresh, never cache
RUN echo "================================================"
RUN echo "Stage 3 Runtime: Copying frontend from builder..."
RUN echo "================================================"
COPY --from=frontend-builder /app/dist ./public
RUN echo "Verifying public directory exists..." && \
    ls -lah public/ || (echo "ERROR: /public directory missing!" && exit 1) && \
    test -f public/index.html || (echo "ERROR: index.html not found in /public!" && exit 1) && \
    echo "✓ index.html verified at /public/index.html" && \
    echo "Total files copied: $(find public/ -type f | wc -l)"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]

EXPOSE 8080
