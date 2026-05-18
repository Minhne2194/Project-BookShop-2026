# -----------------------------------
# 1. Build Backend
# -----------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npx prisma generate
RUN npm run build

# -----------------------------------
# 2. Production Environment
# -----------------------------------
FROM node:20-alpine
WORKDIR /app

# Copy built app and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Expose backend ports (NestJS runs on 3000 by default, Render on PORT environment variable e.g. 10000)
EXPOSE 3000
EXPOSE 10000

# Start the application with prisma migration
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
