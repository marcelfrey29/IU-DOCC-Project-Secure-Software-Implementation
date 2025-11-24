# Builder Image
FROM node:25.2.1-bookworm AS builder
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm ci
COPY . /app/
RUN npm run build:prod

# Container
FROM nginx:1.29-bookworm
COPY --from=builder /app/dist /usr/share/nginx/html
