FROM node:20-alpine

WORKDIR /app

# Install openssl for Prisma engine compatibility
RUN apk add --no-cache openssl

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Copy application source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 5000

# Push Prisma schema to Postgres on startup and launch server
CMD ["sh", "-c", "npx prisma db push && node server.js"]
