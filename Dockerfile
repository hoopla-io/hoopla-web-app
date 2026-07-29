FROM node:20 AS builder
WORKDIR /app
COPY package*.json tsconfig*.json vite*.ts ./
RUN npm install
COPY . .
# "anor" builds the Eight miniapp bundle for anor.hoopla.uz (loads .env.anor).
ARG BUILD_MODE=production
RUN npm run build -- --mode ${BUILD_MODE}

FROM node:20-slim AS production
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-p", "3000"]