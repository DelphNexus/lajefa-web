/* ===== RUN, LUPITA, RUN! — Servidor de puntajes =====
   Node puro + SQLite que ya viene con Node (sin npm install).
   Guarda los puntajes del juego y arma el ranking de cada mes.

   Variables de entorno (se ponen en EasyPanel):
     SECRET     → texto largo al azar. Firma las partidas para que no las inventen.
     ADMIN_KEY  → clave para ver el panel /admin con los números de WhatsApp.
     ORIGINS    → dominios que pueden guardar puntajes, separados por coma.
     DB_PATH    → dónde vive la base de datos (por defecto /data/puntajes.db).
     PORT       → puerto (por defecto 3000). */

const http = require("node:http");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const PORT = Number(process.env.PORT) || 3000;
const SECRET = process.env.SECRET || "";
const ADMIN_KEY = process.env.ADMIN_KEY || "";
const DB_PATH = process.env.DB_PATH || "/data/puntajes.db";
const ORIGINS = (process.env.ORIGINS || "https://lajefa.delphbrothers.com")
  .split(",").map((s) => s.trim()).filter(Boolean);

if (SECRET.length < 16 || ADMIN_KEY.length < 8) {
  console.error("Falta SECRET (16+ letras) o ADMIN_KEY (8+ letras) en las variables de entorno.");
  process.exit(1);
}

/* ---------- Reglas del juego (iguales a juego.js) ----------
   Sirven para rechazar puntajes imposibles. Si se cambia la velocidad o los
   puntos en juego.js, hay que cambiarlos aquí también. */
const REGLAS = {
  velMax: 800,        // px por segundo, la más rápida que corre Lupita
  pxPorPunto: 25,     // cada 25 px recorridos = 1 punto
  burger: 10, papas: 5, sticker: 50,
  itemsPorSeg: 5,     // tope generoso de cosas que se pueden recoger por segundo
  partidaMaxMin: 60,  // una partida de hace más de 1 hora ya no se acepta
};

/* ---------- Base de datos ---------- */
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS puntajes (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    partida   TEXT NOT NULL UNIQUE,
    mes       TEXT NOT NULL,
    nombre    TEXT NOT NULL,
    telefono  TEXT NOT NULL,
    puntaje   INTEGER NOT NULL,
    burgers   INTEGER NOT NULL,
    duracion  INTEGER NOT NULL,
    ip        TEXT,
    creado    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE INDEX IF NOT EXISTS idx_mes ON puntajes (mes, puntaje DESC);
  CREATE TABLE IF NOT EXISTS sorteos (
    mes       TEXT NOT NULL,
    telefono  TEXT NOT NULL,
    nombre    TEXT NOT NULL,
    orden     INTEGER NOT NULL,
    creado    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    PRIMARY KEY (mes, telefono)
  );
`);

/* ---------- Premios del mes ----------
   El 1.er lugar gana por puntaje. Con más jugadores se desbloquean premios
   que se sortean entre todos los demás que guardaron su puntaje. */
const NIVELES = [
  { desde: 0, premios: 1 },    // hasta 50 jugadores: 1 premio (1.er lugar)
  { desde: 51, premios: 2 },   // 51 a 150: 1.er lugar + 1 sorteo
  { desde: 151, premios: 3 },  // más de 150: 1.er lugar + 2 sorteos
];
function premiosPara(jugadores) {
  return NIVELES.filter((n) => jugadores >= n.desde).pop().premios;
}
function siguienteNivel(jugadores) {
  const n = NIVELES.find((x) => x.desde > jugadores);
  return n ? { faltan: n.desde - jugadores, premios: n.premios } : null;
}

/* El mejor puntaje de cada persona en el mes. Empate: gana quien llegó primero. */
const MEJORES = `
  SELECT * FROM (
    SELECT *, ROW_NUMBER() OVER (
      PARTITION BY telefono ORDER BY puntaje DESC, creado ASC) AS n
    FROM puntajes WHERE mes = ?
  ) WHERE n = 1
  ORDER BY puntaje DESC, creado ASC`;

const qRanking = db.prepare(`${MEJORES} LIMIT ?`);
const qMeses = db.prepare(`SELECT DISTINCT mes FROM puntajes WHERE mes < ? ORDER BY mes DESC LIMIT 12`);
const qInsertar = db.prepare(`
  INSERT INTO puntajes (partida, mes, nombre, telefono, puntaje, burgers, duracion, ip)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
const qPosicion = db.prepare(`SELECT telefono FROM (${MEJORES})`);
const qBorrar = db.prepare(`DELETE FROM puntajes WHERE mes = ? AND telefono = ?`);
const qViejos = db.prepare(`DELETE FROM puntajes WHERE mes < ?`);
const qViejosSorteos = db.prepare(`DELETE FROM sorteos WHERE mes < ?`);
const qJugadores = db.prepare(`SELECT COUNT(DISTINCT telefono) AS n FROM puntajes WHERE mes = ?`);
const qSorteados = db.prepare(`SELECT nombre, telefono, orden FROM sorteos WHERE mes = ? ORDER BY orden`);
const qSortear = db.prepare(`INSERT INTO sorteos (mes, telefono, nombre, orden) VALUES (?, ?, ?, ?)`);

/* ---------- Utilidades ---------- */

/* Los meses se cuentan con la hora de Ecuador (UTC-5, sin horario de verano). */
function mesActual() {
  return new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 7);
}

function firmar(texto) {
  return crypto.createHmac("sha256", SECRET).update(texto).digest("base64url");
}

function iguales(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/* Celular de Ecuador: acepta 0991234567, 991234567 o +593 99 123 4567. */
function limpiarTelefono(txt) {
  let d = String(txt || "").replace(/\D/g, "");
  if (d.startsWith("593")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  return /^9\d{8}$/.test(d) ? "593" + d : null;
}

function limpiarNombre(txt) {
  const n = String(txt || "").replace(/\s+/g, " ").trim();
  if (n.length < 2 || n.length > 16) return null;
  if (!/^[\p{L}\p{N} ._'!¡-]+$/u.test(n)) return null;
  return n;
}

function ipDe(req) {
  const fwd = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return fwd || req.socket.remoteAddress || "";
}

/* Límite de intentos por IP, en memoria (se reinicia si se reinicia el servidor). */
const visitas = new Map();
function demasiados(clave, max, ventanaMs) {
  const ahora = Date.now();
  const lista = (visitas.get(clave) || []).filter((t) => ahora - t < ventanaMs);
  lista.push(ahora);
  visitas.set(clave, lista);
  return lista.length > max;
}
setInterval(() => {
  const ahora = Date.now();
  for (const [k, lista] of visitas) {
    if (lista.every((t) => ahora - t > 10 * 60e3)) visitas.delete(k);
  }
}, 10 * 60e3).unref();

function responder(res, estado, datos, extra = {}) {
  const cuerpo = JSON.stringify(datos);
  res.writeHead(estado, { "Content-Type": "application/json; charset=utf-8", ...extra });
  res.end(cuerpo);
}

function leerJSON(req) {
  return new Promise((ok, mal) => {
    let txt = "";
    req.on("data", (c) => {
      txt += c;
      if (txt.length > 4096) { mal(new Error("muy grande")); req.destroy(); }
    });
    req.on("end", () => {
      try { ok(JSON.parse(txt || "{}")); } catch (e) { mal(e); }
    });
    req.on("error", mal);
  });
}

/* Privacidad: los datos se guardan hasta 12 meses. Se limpia al arrancar y cada día. */
function borrarViejos() {
  const d = new Date(Date.now() - 5 * 3600e3);
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - 12);
  const r = qViejos.run(d.toISOString().slice(0, 7));
  qViejosSorteos.run(d.toISOString().slice(0, 7));
  if (r.changes) console.log(`Se borraron ${r.changes} puntajes de hace más de 12 meses`);
}
borrarViejos();
setInterval(borrarViejos, 24 * 3600e3).unref();

/* ---------- Rutas ---------- */

/* Al empezar a jugar: el servidor anota la hora y la firma. Así nadie puede
   decir que jugó 10 minutos si recién abrió la página. */
function nuevaPartida(req, res) {
  if (demasiados("p:" + ipDe(req), 40, 60e3)) return responder(res, 429, { error: "Espera un momento 🐶" });
  const id = crypto.randomBytes(12).toString("base64url");
  const inicio = Date.now();
  responder(res, 200, { partida: `${id}.${inicio}.${firmar(`${id}.${inicio}`)}` });
}

async function guardarPuntaje(req, res) {
  const ip = ipDe(req);
  if (demasiados("g:" + ip, 12, 60e3)) return responder(res, 429, { error: "Muchos intentos. Espera un minuto 🐶" });

  let b;
  try { b = await leerJSON(req); } catch { return responder(res, 400, { error: "Datos inválidos" }); }

  const [id, inicioTxt, firma] = String(b.partida || "").split(".");
  const inicio = Number(inicioTxt);
  if (!id || !inicio || !firma || !iguales(firma, firmar(`${id}.${inicio}`))) {
    return responder(res, 400, { error: "Partida no válida" });
  }
  const transcurrido = Date.now() - inicio;
  if (transcurrido > REGLAS.partidaMaxMin * 60e3) {
    return responder(res, 400, { error: "La partida expiró. Juega otra vez 🐶" });
  }

  if (b.acepta !== true) return responder(res, 400, { error: "Debes aceptar las bases del concurso" });
  const nombre = limpiarNombre(b.nombre);
  if (!nombre) return responder(res, 400, { error: "Escribe un nombre de 2 a 16 letras" });
  const telefono = limpiarTelefono(b.telefono);
  if (!telefono) return responder(res, 400, { error: "Escribe un celular de Ecuador (09…)" });

  const puntaje = Math.floor(Number(b.puntaje));
  const duracion = Math.floor(Number(b.duracion));
  const burgers = Math.floor(Number(b.burgers)) || 0;
  const papas = Math.floor(Number(b.papas)) || 0;
  const stickers = Math.floor(Number(b.stickers)) || 0;
  const distancia = Math.floor(Number(b.distancia)) || 0;

  /* ¿Es posible ese puntaje en ese tiempo? */
  const seg = duracion / 1000;
  const cuentas = [puntaje, duracion, burgers, papas, stickers, distancia];
  const posible =
    cuentas.every((n) => Number.isInteger(n) && n >= 0) &&
    puntaje > 0 &&
    duracion <= transcurrido + 3000 &&
    distancia <= REGLAS.velMax * seg + 200 &&
    burgers + papas + stickers <= REGLAS.itemsPorSeg * seg + 2 &&
    puntaje === Math.floor(distancia / REGLAS.pxPorPunto) +
      burgers * REGLAS.burger + papas * REGLAS.papas + stickers * REGLAS.sticker;
  if (!posible) {
    console.warn("Puntaje rechazado", { ip, puntaje, duracion, transcurrido, distancia, burgers, papas, stickers });
    return responder(res, 400, { error: "Ese puntaje no cuadra 🤔" });
  }

  const mes = mesActual();
  try {
    qInsertar.run(`${id}`, mes, nombre, telefono, puntaje, burgers, duracion, ip);
  } catch (e) {
    if (String(e.message).includes("UNIQUE")) return responder(res, 409, { error: "Esta partida ya se guardó" });
    throw e;
  }

  const filas = qPosicion.all(mes);
  const posicion = filas.findIndex((f) => f.telefono === telefono) + 1;
  responder(res, 200, { ok: true, posicion, jugadores: filas.length });
}

function ranking(req, res) {
  const mes = mesActual();
  const top = qRanking.all(mes, 10).map((f) => ({ nombre: f.nombre, puntaje: f.puntaje }));
  const jugadores = qJugadores.get(mes).n;
  const ganadores = qMeses.all(mes).map(({ mes: m }) => {
    const [g] = qRanking.all(m, 1);
    return { mes: m, nombre: g.nombre, puntaje: g.puntaje, sorteo: qSorteados.all(m).map((s) => s.nombre) };
  });
  responder(res, 200, {
    mes, top, ganadores, jugadores,
    premios: premiosPara(jugadores), siguiente: siguienteNivel(jugadores),
  }, { "Cache-Control": "no-store" });
}

/* ---------- Panel de La Jefa ---------- */

function esAdmin(req) {
  return ADMIN_KEY && iguales(req.headers["x-admin-key"] || "", ADMIN_KEY);
}

function adminDatos(req, res, url) {
  if (demasiados("a:" + ipDe(req), 20, 60e3)) return responder(res, 429, { error: "Espera un minuto" });
  if (!esAdmin(req)) return responder(res, 401, { error: "Clave incorrecta" });
  const mes = /^\d{4}-\d{2}$/.test(url.searchParams.get("mes") || "") ? url.searchParams.get("mes") : mesActual();
  const top = qRanking.all(mes, 30).map((f) => ({
    nombre: f.nombre, telefono: f.telefono, puntaje: f.puntaje,
    burgers: f.burgers, duracion: f.duracion, creado: f.creado,
  }));
  const jugadores = qJugadores.get(mes).n;
  const premios = premiosPara(jugadores);
  const sorteados = qSorteados.all(mes);
  responder(res, 200, {
    mes, top, jugadores, premios, sorteados,
    cerrado: mes < mesActual(),
    puedeSortear: mes < mesActual() && premios > 1 && sorteados.length === 0,
  }, { "Cache-Control": "no-store" });
}

/* Sorteo de los premios extra de un mes ya cerrado. Participan todos los que
   guardaron su puntaje, menos el 1.er lugar (que ya ganó por puntaje).
   Se hace una sola vez por mes y queda guardado. */
async function adminSortear(req, res) {
  if (!esAdmin(req)) return responder(res, 401, { error: "Clave incorrecta" });
  let b;
  try { b = await leerJSON(req); } catch { return responder(res, 400, { error: "Datos inválidos" }); }
  const mes = b.mes;
  if (!/^\d{4}-\d{2}$/.test(mes || "")) return responder(res, 400, { error: "Mes inválido" });
  if (mes >= mesActual()) return responder(res, 400, { error: "El sorteo se hace cuando el mes ya cerró" });
  if (qSorteados.all(mes).length) return responder(res, 409, { error: "Ese mes ya se sorteó" });

  const todos = qPosicion.all(mes).map((f) => f.telefono);
  const premiosExtra = premiosPara(todos.length) - 1;
  if (premiosExtra < 1) return responder(res, 400, { error: "Ese mes no tuvo jugadores suficientes para sorteo" });

  const nombres = new Map(qRanking.all(mes, 100000).map((f) => [f.telefono, f.nombre]));
  const bolsa = todos.slice(1);
  const elegidos = [];
  while (elegidos.length < premiosExtra && bolsa.length) {
    elegidos.push(bolsa.splice(crypto.randomInt(bolsa.length), 1)[0]);
  }
  elegidos.forEach((tel, i) => qSortear.run(mes, tel, nombres.get(tel), i + 1));
  console.log(`Sorteo ${mes}: ${elegidos.length} ganadores entre ${bolsa.length + elegidos.length} jugadores`);
  responder(res, 200, { ok: true, sorteados: qSorteados.all(mes) });
}

/* Descalificar: borra todos los puntajes de ese número en ese mes. */
async function adminBorrar(req, res) {
  if (!esAdmin(req)) return responder(res, 401, { error: "Clave incorrecta" });
  let b;
  try { b = await leerJSON(req); } catch { return responder(res, 400, { error: "Datos inválidos" }); }
  if (!/^\d{4}-\d{2}$/.test(b.mes || "") || !/^\d{12}$/.test(b.telefono || "")) {
    return responder(res, 400, { error: "Datos inválidos" });
  }
  const r = qBorrar.run(b.mes, b.telefono);
  responder(res, 200, { ok: true, borrados: r.changes });
}

const PANEL = fs.readFileSync(path.join(__dirname, "admin.html"));

/* ---------- Servidor ---------- */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const origen = req.headers.origin;

  res.setHeader("X-Content-Type-Options", "nosniff");
  if (origen && ORIGINS.includes(origen)) {
    res.setHeader("Access-Control-Allow-Origin", origen);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "86400");
  }

  try {
    if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

    const ruta = `${req.method} ${url.pathname}`;
    /* Guardar solo desde la web de La Jefa (el navegador siempre manda Origin en un POST). */
    if (req.method === "POST" && url.pathname.startsWith("/api/") && !url.pathname.startsWith("/api/admin")
        && !(origen && ORIGINS.includes(origen))) {
      return responder(res, 403, { error: "Origen no permitido" });
    }

    switch (ruta) {
      case "GET /":
      case "GET /salud": return responder(res, 200, { ok: true, juego: "RUN, LUPITA, RUN!" });
      case "POST /api/partida": return nuevaPartida(req, res);
      case "POST /api/puntaje": return await guardarPuntaje(req, res);
      case "GET /api/ranking": return ranking(req, res);
      case "GET /api/admin": return adminDatos(req, res, url);
      case "POST /api/admin/descalificar": return await adminBorrar(req, res);
      case "POST /api/admin/sortear": return await adminSortear(req, res);
      case "GET /admin":
        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Frame-Options": "DENY",
          "Referrer-Policy": "no-referrer",
        });
        return res.end(PANEL);
      default: return responder(res, 404, { error: "No existe" });
    }
  } catch (e) {
    console.error(e);
    if (!res.headersSent) responder(res, 500, { error: "Algo falló. Intenta otra vez." });
  }
});

server.listen(PORT, () => console.log(`RUN, LUPITA, RUN! puntajes en el puerto ${PORT} · base ${DB_PATH}`));
