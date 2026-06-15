FROM node:22-alpine AS builder

LABEL authors="youssef"

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .


FROM node:22-alpine

WORKDIR /app

# Create a non-root user for security
RUN addgroup -S nodejs && adduser -S express -G nodejs

COPY --from=builder /app .

USER express

EXPOSE 8084

CMD ["node", "./bin/www"]