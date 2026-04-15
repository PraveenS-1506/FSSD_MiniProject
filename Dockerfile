FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm install -g ts-node typescript

COPY . .

CMD ["npx", "ts-node", "backend/test.ts"]