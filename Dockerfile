FROM ghcr.io/puppeteer/puppeteer:latest

# Become root temporarily
USER root

# Create the app directory and set permissions for the puppeteer user
RUN mkdir -p /app && chown -R pptruser:pptruser /app

# Set the working directory
WORKDIR /app

# Copy your app files (done as root)
COPY . .

# Switch to puppeteer user (non-root)
USER pptruser

# Install dependencies with permission
RUN npm install --unsafe-perm=true

CMD ["node", "app.js"]
