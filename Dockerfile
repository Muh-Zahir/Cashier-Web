FROM node:20

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm install --production

# Copy backend source code
COPY backend/ ./

# Expose port (Back4App will use process.env.PORT or 5000)
ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]
