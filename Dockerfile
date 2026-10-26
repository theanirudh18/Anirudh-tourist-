FROM nginx:alpine

COPY project.html /usr/share/nginx/html/index.html
COPY login.html /usr/share/nginx/html/login.html
COPY project.css /usr/share/nginx/html/project.css
COPY project.js /usr/share/nginx/html/project.js
