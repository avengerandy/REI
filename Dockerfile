FROM node:22.15.0

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
