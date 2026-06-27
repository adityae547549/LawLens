FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

COPY backend/ ./backend/
COPY frontend/ ./frontend/

WORKDIR /app/backend

ENV NODE_ENV=production
ENV PORT=3000
ENV CORS_ORIGIN=http://localhost:3000
ENV DB_PATH=./database
ENV UPLOAD_DIR=./uploads
ENV VECTOR_DB_PATH=./vector/index.json

EXPOSE 3000

CMD ["node", "server.js"]
