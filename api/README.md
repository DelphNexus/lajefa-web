# RUN, LUPITA, RUN! — Servidor de puntajes

Guarda los puntajes del juego (`juego.html`) y arma el ranking de cada mes.
Es Node puro con SQLite: no necesita `npm install` ni otra base de datos.

## Cómo instalarlo en EasyPanel (una sola vez)

1. En el mismo proyecto donde está la web, **+ Service → App**. Nombre: `juego-api`.
2. **Source → GitHub**: este mismo repositorio y la rama que se publica.
   - **Build Path:** `/api`
   - **Build:** Dockerfile (usa `api/Dockerfile`).
3. **Environment** (variables):
   ```
   SECRET=<texto largo al azar, 32+ letras>
   ADMIN_KEY=<la clave para ver el panel>
   ORIGINS=https://lajefa.delphbrothers.com
   ```
   Para inventar un SECRET: cualquier generador de contraseñas, 40 caracteres.
4. **Mounts → Add Volume**: nombre `puntajes`, mount path `/data`.
   ⚠️ Sin esto, los puntajes se borran cada vez que se actualiza el servicio.
5. **Domains**: agregar un dominio, por ejemplo `runluperun-api.delphbrothers.com`,
   puerto **3000**, con HTTPS.
   (Si el DNS es de Cloudflare, crear el registro igual que el de la web.)
6. **Deploy**. Al abrir `https://runluperun-api.delphbrothers.com/salud` debe decir `"ok": true`.
7. En `juego.js` (arriba del todo) poner la dirección:
   ```js
   const API_URL = "https://runluperun-api.delphbrothers.com";
   ```
   y volver a publicar la web. Desde ese momento se guardan los puntajes.

## Panel de La Jefa

`https://runluperun-api.delphbrothers.com/admin` → escribir la `ADMIN_KEY`.

- Muestra el top 30 del mes con el WhatsApp de cada jugador.
- Botón **💬 Avisarle por WhatsApp** al ganador, con el mensaje ya escrito.
- Botón **Descalificar** para borrar a alguien que hizo trampa.
- Se puede elegir un mes anterior para ver quién ganó.

## Qué revisa para evitar trampas

- Cada partida recibe una firma del servidor al empezar; sin esa firma no se guarda.
- Cada firma sirve una sola vez.
- El puntaje tiene que ser posible en el tiempo jugado (velocidad máxima, comida por segundo).
- Solo acepta puntajes que vienen desde la web de La Jefa (`ORIGINS`).
- Límite de intentos por IP por minuto.

Ninguna protección es perfecta en un juego de navegador: antes de entregar el premio,
conviene mirar en el panel que el puntaje del ganador tenga sentido (tiempo jugado, burgers).

## Probar en la computadora

```
SECRET=una-clave-de-prueba-larga ADMIN_KEY=prueba123 ORIGINS=http://localhost:8000 DB_PATH=./puntajes.db PORT=3100 node server.js
```
Necesita Node 22.13 o más nuevo.
