FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm install --omit=dev

# Copy server code
COPY . .

# Expose port (Cloud Run sets PORT env variable, our server/index.js uses process.env.PORT || 3001)
EXPOSE 3001

CMD ["node", "index.js"]
