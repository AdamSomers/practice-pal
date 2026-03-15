FROM node:20-slim AS base

# Stage 1: Install all dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/package-lock.json ./client/
COPY server/package.json server/package-lock.json ./server/
RUN npm ci && cd client && npm ci && cd ../server && npm ci

# Stage 2: Build client and server
FROM deps AS build
COPY . .
RUN npm run build

# Stage 3: Production image (only runtime deps)
FROM base AS production
WORKDIR /app
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/package.json ./server/
COPY --from=build /app/server/node_modules ./server/node_modules
COPY --from=build /app/client/dist ./client/dist
EXPOSE 8080
ENV PORT=8080
ENV APP_ENV=production
CMD ["node", "server/dist/index.js"]
