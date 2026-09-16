FROM node:22-slim

# Install build dependencies required by native C++ modules (better-sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies and build native modules from source
RUN npm install
RUN npm rebuild better-sqlite3 --build-from-source

# Copy backend source code
COPY backend/ ./

# Expose port (5000)
ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]
