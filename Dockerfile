# ============================================================
# DEPENDENCIES STAGE
# ============================================================
FROM node:20-alpine AS deps

RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# ============================================================
# DEVELOPMENT STAGE
# ============================================================
FROM node:20-alpine AS development

RUN apk add --no-cache openssl

WORKDIR /app

# Copy dependencies from deps stage (not from host)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copy source code
COPY src ./src
COPY tsconfig.json ./

EXPOSE 5000

CMD ["npm", "run", "dev"]
# ============================================================
# STAGE 3: Builder Stage
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# ============================================================
# STAGE 4: Production Stage
# ============================================================
FROM node:20-alpine AS production

# Install dumb-init and openssl
RUN apk add --no-cache dumb-init openssl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy production dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nodejs:nodejs /app/prisma ./prisma

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]