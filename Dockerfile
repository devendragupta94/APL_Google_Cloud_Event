# Use the official Node.js image
FROM node:22-slim

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy local code to the container image
COPY . .

# Build the frontend
RUN npm run build

# Set environment to production
ENV NODE_ENV=production

# Expose the port used by the app (Cloud Run uses 8080 by default, but our code uses 3000)
# Cloud Run automatically handles mapping the PORT env var.
EXPOSE 3000

# Run the web service on container startup
CMD [ "npm", "start" ]
