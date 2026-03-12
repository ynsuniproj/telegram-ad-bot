FROM node:18-alpine

WORKDIR /usr/src/app

# Install native dependencies required for compiling the 'canvas' package via node-gyp
RUN apk add --no-cache \
    build-base \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    python3

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN npm install typescript
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
