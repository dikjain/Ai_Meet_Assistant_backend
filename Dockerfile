FROM ghcr.io/puppeteer/puppeteer:latest

# Set working directory
WORKDIR /app

# Copy files and fix permissions
COPY . .

# Change ownership to the Puppeteer user (pptruser)
RUN chown -R pptruser:pptruser /app

# Switch to the non-root user
USER pptruser

# Install dependencies
RUN npm install

# Start the app
CMD ["node", "app.js"]
