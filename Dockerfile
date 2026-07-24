FROM nginx:alpine
COPY index.html styles.css app.js /usr/share/nginx/html/
COPY images /usr/share/nginx/html/images
COPY fonts /usr/share/nginx/html/fonts
EXPOSE 80
