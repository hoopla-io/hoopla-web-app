FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json ./ 

RUN npm ci --only=production

COPY --from=builder /app/.next /app/.next
COPY --from=builder /app/public /app/public

EXPOSE 3002

CMD ["npm", "start"]
