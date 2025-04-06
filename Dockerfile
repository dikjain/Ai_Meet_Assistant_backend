FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app

COPY . .

# Run as root, but allow install scripts
RUN npm install --unsafe-perm=true

CMD ["node", "app.js"]
