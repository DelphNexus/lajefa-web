FROM nginx:alpine

# Config propia (reemplaza la de fábrica): HTML fresco, fotos en caché, gzip.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# TODAS las páginas del sitio. Si se agrega una página nueva, va aquí;
# si falta, en EasyPanel da 404 (le pasaba a gracias.html y privacidad.html).
COPY index.html gracias.html privacidad.html styles.css app.js /usr/share/nginx/html/
COPY images /usr/share/nginx/html/images
COPY fonts /usr/share/nginx/html/fonts

EXPOSE 80
