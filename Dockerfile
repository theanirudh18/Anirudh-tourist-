FROM nginx:alpine

# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy website files to Nginx web root
COPY index.html /usr/share/nginx/html/index.html
COPY project.html /usr/share/nginx/html/project.html
COPY login.html /usr/share/nginx/html/login.html
COPY project.css /usr/share/nginx/html/project.css
COPY project.js /usr/share/nginx/html/project.js

# Expose HTTP port
EXPOSE 80

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
