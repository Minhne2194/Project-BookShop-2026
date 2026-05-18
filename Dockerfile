# -----------------------------------
# 1. Build Backend
# -----------------------------------
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend

# Install dependencies first for better caching
COPY backend-bookstore/package*.json ./
RUN npm install

# Copy source and build
COPY backend-bookstore/ ./
RUN npx prisma generate
RUN npm run build

# -----------------------------------
# 2. Build Frontend
# -----------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Install dependencies first for better caching
COPY frontend-bookstore/package*.json ./
RUN npm install

# Copy source and build
COPY frontend-bookstore/ ./
RUN npm run build

# -----------------------------------
# 3. Production Environment
# -----------------------------------
FROM node:20-alpine
WORKDIR /app

# Install simple HTTP server to serve static frontend, and pm2 for process management
RUN npm install -g serve pm2

# Copy Backend artifacts
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/package.json ./backend/
COPY --from=backend-builder /app/backend/prisma ./backend/prisma

# Copy Frontend artifacts
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose backend port (3000) and frontend port (5173)
EXPOSE 10000
EXPOSE 3000
EXPOSE 5173

# Create a start script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'cd /app/backend' >> /app/start.sh && \
    echo 'npx prisma migrate deploy' >> /app/start.sh && \
    echo 'pm2 start dist/main.js --name "backend"' >> /app/start.sh && \
    echo 'pm2 start "serve -s /app/frontend/dist -l 5173" --name "frontend"' >> /app/start.sh && \
    echo 'pm2 logs' >> /app/start.sh && \
    chmod +x /app/start.sh

# Start the application
CMD ["/app/start.sh"]
