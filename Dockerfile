FROM node:20-alpine

WORKDIR /app

COPY backend/ ./backend/
COPY frontend/ ./frontend/

WORKDIR /app/backend
RUN npm ci --omit=dev --ignore-scripts

ENV NODE_ENV=production
ENV PORT=3000
ENV CORS_ORIGIN=https://lawlens.web.app
ENV DB_PATH=./database
ENV UPLOAD_DIR=./uploads
ENV VECTOR_DB_PATH=./vector/index.json

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
