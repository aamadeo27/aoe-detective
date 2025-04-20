FROM node:18-alpine AS builder

WORKDIR /usr/app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

RUN npm prune --production

FROM node:18-alpine

WORKDIR /usr/app

COPY --from=builder /usr/app/package*.json ./
COPY --from=builder /usr/app/node_modules ./node_modules
COPY --from=builder /usr/app/dist ./dist

RUN mkdir -p data && chown node:node data

USER node

# For Healthcheck
EXPOSE 3000

CMD [ "node", "dist/main.js" ]