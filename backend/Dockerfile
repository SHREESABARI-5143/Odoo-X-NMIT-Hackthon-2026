FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Build stage
FROM base AS build
RUN npm ci
COPY prisma ./prisma/
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src/
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma/
COPY package.json ./

# Create uploads directory
RUN mkdir -p uploads/profile-pictures uploads/documents uploads/logos

EXPOSE 3000
CMD ["node", "dist/server.js"]
