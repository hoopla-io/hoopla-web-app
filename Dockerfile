FROM node:20

WORKDIR /app

COPY . .

RUN npm install --legacy-peer-deps
RUN npm run build

ENV NODE_ENV production

EXPOSE 3001

CMD ["npm", "run", "start"]