# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Accept build arguments for environment variables
ARG VITE_BACKEND_URL
ARG VITE_ADK_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_ADK_URL=$VITE_ADK_URL

# Copy package files
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Build the Vite app
RUN npm run build

# Production serve stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy a basic nginx configuration to handle React Router if needed
RUN echo 'server { \
    listen 8080; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Cloud Run exposes PORT variable, but typically we expose 8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
