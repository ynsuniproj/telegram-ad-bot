FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --production

COPY tsconfig.json ./
COPY src ./src

RUN npm install typescript
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
