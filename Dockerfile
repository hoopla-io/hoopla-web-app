# Stage 1: Build the React app with Vite
FROM node:20 AS builder

WORKDIR /app


COPY package*.json tsconfig*.json vite*.ts ./
RUN npm install

COPY . .

RUN npm run build

# Stage 2: Serve the build using Nginx
FROM nginx:stable-alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output to Nginx's public directory
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
