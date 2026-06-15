FROM node:22-alpine AS builder

LABEL authors="youssef"

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist/trading-ui/browser /usr/share/nginx/html

EXPOSE 8085

CMD ["nginx", "-g", "daemon off;"]
