# ============================================================
# SCHOOL ERP - MULTI-STAGE DOCKERFILE FOR PRODUCTION DEPLOYMENT
# ============================================================

# Stage 1: Build Frontend Client
FROM node:20-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# Stage 2: Production Server
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy server package and install production dependencies only
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --only=production

# Copy server code
COPY server/ ./

# Copy built frontend assets from client-builder into client/dist
COPY --from=client-builder /app/client/dist /app/client/dist

# Expose API and frontend port
EXPOSE 3001

# Start ERP Platform
CMD ["node", "index.js"]
