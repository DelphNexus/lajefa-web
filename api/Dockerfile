FROM node:22-alpine

WORKDIR /app
COPY server.js admin.html ./

# La base de datos vive aquí. En EasyPanel se monta un volumen en /data
# para que los puntajes no se borren al actualizar.
ENV DB_PATH=/data/puntajes.db NODE_ENV=production PORT=3000
VOLUME /data

EXPOSE 3000
CMD ["node", "--disable-warning=ExperimentalWarning", "server.js"]
