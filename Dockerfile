FROM node:20

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm && pnpm install

COPY . .

RUN npx tsc

EXPOSE 3000

CMD ["node", "dist/index.mjs"]