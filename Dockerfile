# Stage 1: install dependencies and compile native modules
FROM node:20-bullseye-slim AS builder

# Install g++ for C++ compilation and other build utilities
RUN apt-get update \
  && apt-get install -y --no-install-recommends g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/server

# Copy server package metadata and install production dependencies only
COPY server/package*.json ./
RUN npm ci --production

# Copy server source code
COPY server ./

# Stage 2: runtime image
FROM node:20-bullseye-slim AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/server

# Copy only production node_modules and server source from builder stage
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server .

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "server.js"]
