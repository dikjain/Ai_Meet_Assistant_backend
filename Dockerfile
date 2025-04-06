FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app
COPY . .

RUN npm install

CMD ["node", "app.js"]
