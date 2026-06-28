# Step 1: Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy codebase and build
COPY . .
RUN npm run build

# Step 2: Production stage (Nginx)
FROM nginx:alpine

# Copy our custom Nginx config
COPY .nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts to Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
