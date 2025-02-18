# Use a single-stage build to speed up the process
FROM node:18-alpine

WORKDIR /app

# Copy only necessary files for installing dependencies
COPY package.json package-lock.json ./

RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN npm run build

# Expose the necessary port
EXPOSE 3002

# Run the Next.js application
CMD ["npm", "run", "start"]
