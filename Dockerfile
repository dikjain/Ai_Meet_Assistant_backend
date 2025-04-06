# Use an official Node image
FROM node:20-slim

# Install Chrome dependencies
RUN apt-get update && apt-get install -y \
    wget gnupg ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 \
    libatk1.0-0 libcups2 libdbus-1-3 libgdk-pixbuf2.0-0 libnspr4 libnss3 libxcomposite1 libxdamage1 \
    libxrandr2 xdg-utils --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Chrome stable (or Chromium if using Puppeteer)
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && apt install -y ./google-chrome-stable_current_amd64.deb \
    && rm google-chrome-stable_current_amd64.deb

# Set working directory
WORKDIR /app

# Copy package files and install
COPY package*.json ./
RUN npm install

# Copy rest of the app
COPY . .

# Expose port and start app
EXPOSE 3000
CMD ["npm", "run", "start"]
