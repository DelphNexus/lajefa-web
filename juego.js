/* ===== RUN, LUPITA, RUN! — el juego de La Jefa =====
   Lupita corre sola: se toca la pantalla (o espacio) para saltar obstáculos
   y comer burgers. Al perder se puede guardar el puntaje en el ranking del mes. */

(() => {
  "use strict";

  /* ⚠️ Dirección del servidor de puntajes (el servicio "api" en EasyPanel),
     sin "/" al final. Ej: "https://juego-api.delphbrothers.com".
     Vacío = ranking apagado: se juega igual, pero no se guardan puntajes. */
  const API_URL = "";

  /* ---------- Reglas ----------
     ⚠️ Si se cambian VEL_MAX, PX_POR_PUNTO o PUNTOS, cambiar también
     REGLAS en api/server.js (ahí se revisa que el puntaje sea posible). */
  const W = 480, H = 300, SUELO = 258;
  const VEL_INICIO = 300, VEL_MAX = 800, ACELERA = 6;   // px/s, px/s por segundo
  const PASO_VEL = 22;                                  // empujón extra cada 100 puntos
  const PX_POR_PUNTO = 25;
  const PUNTOS = { burger: 10, papas: 5, sticker: 50 };
  const GRAVEDAD = 2800, SALTO = -820;
  const GRAV_SOSTENIDO = 0.55, SOSTENER_MAX = 0.18;     // mantener presionado = salto más alto
  const INVENCIBLE = 4;                                 // segundos con el sticker

  const LUPI = { x: 64, w: 50, h: 72 };                 // caja donde se dibuja Lupita (en dos patas)

  /* ---------- Arte ----------
     Dibujos finales (images/juego/). Si alguno no carga, el juego usa el
     arte provisional dibujado por código. [nombre, cuadros de animación] */
  const ARTE_FINAL = [
    ["lupita-base", 1], ["lupita-correr", 4], ["lupita-salto", 1], ["lupita-choque", 1],
    ["obs-salsa", 1], ["obs-cono", 1], ["obs-caja", 1], ["obs-aceite", 1], ["obs-paloma", 2],
    ["item-burger", 1], ["item-papas", 1], ["item-sticker", 1],
    ["fondo-lejos", 1, "jpg"], ["fondo-calle", 1], ["fondo-piso", 1],
  ];
  const ARTE = {};
  for (const [nombre, cuadros, ext = "png"] of [["lupita-cabeza", 1], ...ARTE_FINAL]) {
    const img = new Image();
    ARTE[nombre] = { img, cuadros, listo: false };
    img.onload = () => { ARTE[nombre].listo = true; };
    img.src = `images/juego/${nombre}.${ext}`;
  }

  /* Dibuja un cuadro del arte final ajustado a la caja (pies abajo, centrado).
     Devuelve false si esa imagen todavía no existe. */
  function sprite(nombre, cuadro, x, y, w, h) {
    const a = ARTE[nombre];
    if (!a || !a.listo) return false;
    const cw = a.img.naturalWidth / a.cuadros, ch = a.img.naturalHeight;
    const k = Math.min(w / cw, h / ch);
    const dw = cw * k, dh = ch * k;
    ctx.drawImage(a.img, (cuadro % a.cuadros) * cw, 0, cw, ch, x + (w - dw) / 2, y + h - dh, dw, dh);
    return true;
  }

  /* ---------- Colores de la marca ---------- */
  const C = {
    morado: "#4b2178", moradoOsc: "#331460", tinta: "#2b1152",
    coral: "#f2917c", coralHot: "#ee7a60", coralClaro: "#f7b3a4", coralSuave: "#fce4dd",
    crema: "#fdf6f0", blanco: "#ffffff", lila: "#b9a2d4", lilaClaro: "#d9cbe8",
  };
  const FUENTE = "'Lilita One', 'Arial Black', sans-serif";

  /* ---------- Guardado en este teléfono ---------- */
  const local = {
    leer(k, def) { try { const v = localStorage.getItem(k); return v === null ? def : JSON.parse(v); } catch (e) { return def; } },
    poner(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };

  /* ---------- Elementos de la página ---------- */
  const $ = (id) => document.getElementById(id);
  const canvas = $("game"), ctx = canvas.getContext("2d");
  /* Teléfonos viejos sin roundRect: esquinas rectas y listo. */
  if (!ctx.roundRect) ctx.roundRect = function (x, y, w, h) { this.rect(x, y, w, h); };
  const stage = $("stage");
  const startScreen = $("startScreen"), pauseScreen = $("pauseScreen"), overScreen = $("overScreen");
  const saveForm = $("saveForm"), saveMsg = $("saveMsg"), saveBtn = $("saveBtn");

  /* Canvas nítido en cualquier pantalla: el juego siempre mide 480×300 "por dentro". */
  let escala = 1;
  function ajustarTamano() {
    const r = stage.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    escala = canvas.width / W;
  }
  window.addEventListener("resize", ajustarTamano);
  ajustarTamano();

  /* ---------- Sonidos (sin archivos: se generan en el momento) ---------- */
  let mudo = local.leer("lupita-mudo", false);
  let audio = null;
  const muteBtn = $("muteBtn");
  function pintarMudo() {
    muteBtn.textContent = mudo ? "🔇" : "🔊";
    muteBtn.setAttribute("aria-label", mudo ? "Encender sonido" : "Apagar sonido");
  }
  pintarMudo();
  muteBtn.addEventListener("click", () => { mudo = !mudo; local.poner("lupita-mudo", mudo); pintarMudo(); });

  function tono(frec, frecFin, dur, tipo = "square", vol = 0.08, retraso = 0) {
    if (mudo) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
      const t = audio.currentTime + retraso;
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = tipo;
      o.frequency.setValueAtTime(frec, t);
      o.frequency.exponentialRampToValueAtTime(frecFin, t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(audio.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    } catch (e) {}
  }
  const SON = {
    salto: () => tono(380, 720, 0.12),
    burger: () => { tono(660, 660, 0.07, "triangle", 0.12); tono(990, 990, 0.1, "triangle", 0.12, 0.07); },
    papas: () => tono(520, 820, 0.1, "triangle", 0.12),
    sticker: () => [523, 659, 784, 1047].forEach((f, i) => tono(f, f, 0.1, "square", 0.07, i * 0.07)),
    hito: () => { tono(880, 880, 0.06, "square", 0.05); tono(1320, 1320, 0.08, "square", 0.05, 0.07); },
    choque: () => { tono(240, 60, 0.35, "sawtooth", 0.12); tono(120, 40, 0.4, "square", 0.08); },
  };

  /* ---------- Estado de la partida ---------- */
  let estado = "inicio";          // inicio · jugando · pausa · fin
  let p;                          // datos de la partida actual
  let record = local.leer("lupita-record", 0);
  let finEn = 0;                  // cuándo perdió (para no reiniciar sin querer)
  let partidaToken = null;        // firma del servidor para guardar el puntaje

  function nuevaPartida() {
    p = {
      vel: VEL_INICIO, distancia: 0, tiempo: 0,
      burgers: 0, papas: 0, stickers: 0,
      y: SUELO - LUPI.h, vy: 0, enPiso: true, sosteniendo: false, tSostenido: 0, pedidoSalto: -1,
      invencible: 0, obstaculos: [], items: [], textos: [],
      siguiente: 520, ultimoSticker: 0, hito: 100, nivel: 0, extra: 0, aviso: 0,
      fondo: { lejos: 0, medio: 0, piso: 0 }, temblor: 0, cuadro: 0,
    };
  }
  nuevaPartida();

  const puntaje = () => Math.floor(Math.floor(p.distancia) / PX_POR_PUNTO)
    + p.burgers * PUNTOS.burger + p.papas * PUNTOS.papas + p.stickers * PUNTOS.sticker;

  function empezar() {
    nuevaPartida();
    estado = "jugando";
    startScreen.hidden = true;
    pauseScreen.hidden = true;
    overScreen.hidden = true;
    pedirPartida();
  }

  function pausar() {
    if (estado !== "jugando") return;
    estado = "pausa";
    pauseScreen.hidden = false;
  }

  function seguir() {
    if (estado !== "pausa") return;
    estado = "jugando";
    pauseScreen.hidden = true;
  }

  function perder() {
    estado = "fin";
    finEn = performance.now();
    p.temblor = 0.3;
    SON.choque();
    if (navigator.vibrate) { try { navigator.vibrate(120); } catch (e) {} }
    setTimeout(mostrarFin, 750);
  }

  /* ---------- Controles ---------- */
  function presionar() {
    if (estado === "inicio") return empezar();
    if (estado === "pausa") return seguir();
    if (estado !== "jugando") return;
    p.sosteniendo = true;
    if (p.enPiso) saltar();
    else p.pedidoSalto = p.tiempo;   // si toca justo antes de caer, salta al tocar el piso
  }

  function soltar() {
    if (p) p.sosteniendo = false;
  }

  function saltar() {
    p.vy = SALTO;
    p.enPiso = false;
    p.tSostenido = 0;
    p.pedidoSalto = -1;
    SON.salto();
  }

  stage.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button, a")) return;
    e.preventDefault();
    presionar();
  });
  window.addEventListener("pointerup", soltar);
  window.addEventListener("pointercancel", soltar);

  const TECLAS = ["Space", "ArrowUp", "KeyW"];
  window.addEventListener("keydown", (e) => {
    if (!TECLAS.includes(e.code)) return;
    if (e.target.closest && e.target.closest("input, textarea, select, button, a, summary")) return;
    e.preventDefault();
    if (e.repeat) return;
    if (estado === "fin") {
      if (performance.now() - finEn > 900) empezar();
      return;
    }
    presionar();
  });
  window.addEventListener("keyup", (e) => { if (TECLAS.includes(e.code)) soltar(); });

  $("playBtn").addEventListener("click", empezar);
  $("againBtn").addEventListener("click", () => {
    empezar();
    stage.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  pauseScreen.addEventListener("click", seguir);
  document.addEventListener("visibilitychange", () => { if (document.hidden) pausar(); });
  window.addEventListener("blur", pausar);

  /* ---------- Obstáculos y comida ---------- */
  const TIPOS = {
    salsa:  { w: 20, h: 48 },
    cono:   { w: 34, h: 42 },
    caja:   { w: 42, h: 40 },
    aceite: { w: 66, h: 16 },
    paloma: { w: 34, h: 32 },
  };
  const ITEM = 26;
  const azar = (a, b) => a + Math.random() * (b - a);
  const elegir = (lista) => lista[Math.floor(Math.random() * lista.length)];

  function crearObstaculo() {
    const pts = puntaje();
    const x = W + 20;
    let grupo;

    const opciones = ["salsa", "cono", "caja"];
    if (pts > 150) opciones.push("aceite");
    if (pts > 350 && Math.random() < 0.25) {
      /* Paloma: baja (hay que saltarla) o alta (hay que NO saltar). */
      const alta = Math.random() < 0.5;
      const t = TIPOS.paloma;
      grupo = [{ tipo: "paloma", x, y: alta ? SUELO - 134 : SUELO - 40, w: t.w, h: t.h, extra: 70 }];
    } else if (pts > 600 && Math.random() < 0.3) {
      /* Dos seguidos */
      const a = elegir(["caja", "cono", "salsa"]), b = elegir(["caja", "cono"]);
      const ta = TIPOS[a], tb = TIPOS[b];
      grupo = [
        { tipo: a, x, y: SUELO - ta.h, w: ta.w, h: ta.h },
        { tipo: b, x: x + ta.w + 4, y: SUELO - tb.h, w: tb.w, h: tb.h },
      ];
    } else {
      const tipo = elegir(opciones), t = TIPOS[tipo];
      grupo = [{ tipo, x, y: SUELO - t.h, w: t.w, h: t.h }];
    }
    p.obstaculos.push(...grupo);

    const ancho = grupo.reduce((m, o) => Math.max(m, o.x + o.w), 0) - x;
    const centro = x + ancho / 2;
    const esPaloma = grupo[0].tipo === "paloma";

    /* Premio arriba del obstáculo: hay que saltar para comerlo. */
    if (!esPaloma) {
      if (p.tiempo > 15000 && p.tiempo - p.ultimoSticker > 20000 && Math.random() < 0.07) {
        p.ultimoSticker = p.tiempo;
        ponerItem("sticker", centro, SUELO - 150);
      } else if (Math.random() < 0.55) {
        ponerItem(Math.random() < 0.8 ? "burger" : "papas", centro, SUELO - 128);
      }
    }

    /* Espacio hasta el próximo: más rápido = más separados en px, igual de justos en tiempo. */
    const hueco = p.vel * azar(0.95, 1.75) + ancho;
    p.siguiente = hueco;

    /* Fila de comida en el piso, en medio del hueco. */
    if (Math.random() < 0.35) {
      const n = 1 + Math.floor(Math.random() * 3);
      const medio = x + ancho + (hueco - ancho) / 2;
      for (let i = 0; i < n; i++) {
        ponerItem(Math.random() < 0.75 ? "burger" : "papas", medio + (i - (n - 1) / 2) * 34, SUELO - 36);
      }
    }
  }

  function ponerItem(tipo, cx, y) {
    p.items.push({ tipo, x: cx - ITEM / 2, y, w: ITEM, h: ITEM, fase: Math.random() * 6 });
  }

  /* Choque con cajas un poquito más chicas que el dibujo, para que sea justo. */
  function choca(a, b, margen = 4) {
    return a.x + margen < b.x + b.w - margen && a.x + a.w - margen > b.x + margen &&
           a.y + margen < b.y + b.h - margen && a.y + a.h - margen > b.y + margen;
  }

  function cajaLupita() {
    return { x: LUPI.x + 12, y: p.y + 8, w: LUPI.w - 22, h: LUPI.h - 8 };
  }

  /* ---------- Actualizar (cada cuadro) ---------- */
  function actualizar(dt) {
    p.tiempo += dt * 1000;
    /* Sube poco a poco y, cada 100 puntos, un empujón que se nota. */
    p.extra += (p.nivel * PASO_VEL - p.extra) * Math.min(1, dt * 3);
    p.vel = Math.min(VEL_MAX, VEL_INICIO + ACELERA * (p.tiempo / 1000) + p.extra);
    if (p.aviso > 0) p.aviso -= dt;
    const avance = p.vel * dt;
    p.distancia += avance;
    p.fondo.lejos += avance * 0.08;
    p.fondo.medio += avance * 0.35;
    p.fondo.piso += avance;
    p.cuadro += dt * (6 + p.vel / 60);
    if (p.invencible > 0) p.invencible -= dt;

    /* Salto */
    let g = GRAVEDAD;
    if (p.vy < 0 && p.sosteniendo && p.tSostenido < SOSTENER_MAX) {
      g *= GRAV_SOSTENIDO;
      p.tSostenido += dt;
    }
    p.vy += g * dt;
    p.y += p.vy * dt;
    if (p.y >= SUELO - LUPI.h) {
      p.y = SUELO - LUPI.h;
      p.vy = 0;
      if (!p.enPiso) {
        p.enPiso = true;
        if (p.pedidoSalto >= 0 && p.tiempo - p.pedidoSalto < 130) saltar();
      }
    }

    /* Aparecen cosas nuevas */
    p.siguiente -= avance;
    if (p.siguiente <= 0) crearObstaculo();

    const yo = cajaLupita();

    for (const o of p.obstaculos) {
      o.x -= avance + (o.extra || 0) * dt;
      if (p.invencible <= 0 && choca(yo, o, o.tipo === "aceite" ? 1 : 4)) return perder();
    }
    p.obstaculos = p.obstaculos.filter((o) => o.x + o.w > -20);

    for (const it of p.items) {
      it.x -= avance;
      it.fase += dt * 5;
      if (!it.comido && choca(yo, it, 0)) {
        it.comido = true;
        if (it.tipo === "burger") { p.burgers++; SON.burger(); }
        if (it.tipo === "papas") { p.papas++; SON.papas(); }
        if (it.tipo === "sticker") { p.stickers++; p.invencible = INVENCIBLE; SON.sticker(); }
        p.textos.push({ txt: "+" + PUNTOS[it.tipo], x: it.x, y: it.y, vida: 0.8 });
      }
    }
    p.items = p.items.filter((it) => !it.comido && it.x + it.w > -20);

    for (const t of p.textos) { t.y -= 50 * dt; t.vida -= dt; }
    p.textos = p.textos.filter((t) => t.vida > 0);

    const pts = puntaje();
    if (pts >= p.hito) {
      p.hito += 100;
      SON.hito();
      if (p.vel < VEL_MAX) { p.nivel++; p.aviso = 1.2; }
    }
  }

  /* ---------- Dibujar ---------- */
  function dibujar(dt) {
    ctx.setTransform(escala, 0, 0, escala, 0, 0);
    if (p.temblor > 0) {
      p.temblor -= dt;
      ctx.translate(azar(-4, 4) * p.temblor * 3, azar(-4, 4) * p.temblor * 3);
    }
    fondo();
    for (const it of p.items) dibujarItem(it);
    for (const o of p.obstaculos) dibujarObstaculo(o);
    dibujarLupita();
    for (const t of p.textos) {
      ctx.globalAlpha = Math.max(0, t.vida / 0.8);
      texto(t.txt, t.x + ITEM / 2, t.y, 18, C.coralHot, "center");
      ctx.globalAlpha = 1;
    }
    if (estado !== "inicio") hud();
  }

  function texto(txt, x, y, tam, color, alinear = "left") {
    ctx.font = `${tam}px ${FUENTE}`;
    ctx.textAlign = alinear;
    ctx.textBaseline = "top";
    ctx.lineWidth = 4;
    ctx.strokeStyle = C.blanco;
    ctx.lineJoin = "round";
    ctx.strokeText(txt, x, y);
    ctx.fillStyle = color;
    ctx.fillText(txt, x, y);
  }

  function hud() {
    const pts = String(puntaje()).padStart(5, "0");
    texto(pts, W - 14, 12, 26, C.morado, "right");
    if (record > 0) texto("RÉCORD " + String(record).padStart(5, "0"), W - 14, 42, 12, C.coralHot, "right");
    texto("🍔 × " + p.burgers, 14, 14, 18, C.morado);
    if (p.invencible > 0) texto("⭐ ¡INVENCIBLE!", W / 2, 14, 16, C.coralHot, "center");
    if (p.aviso > 0) {
      ctx.globalAlpha = Math.min(1, p.aviso * 2);
      texto("¡MÁS RÁPIDO! 🔥", W / 2, 40, 20, C.morado, "center");
      ctx.globalAlpha = 1;
    }
  }

  /* Escenario provisional: cielo, volcán Cayambe, casitas y vereda a cuadros. */
  const CASAS = [
    [46, 52, C.coralClaro], [34, 70, C.lilaClaro], [58, 44, C.coral], [40, 62, C.lila],
    [52, 48, C.coralSuave], [36, 76, C.coralClaro], [60, 54, C.lilaClaro], [44, 40, C.coral],
  ];
  const LARGO_CALLE = CASAS.reduce((s, c) => s + c[0] + 10, 0);

  /* Una imagen que se repite de lado a lado y se desplaza (fondos en movimiento). */
  function banda(nombre, desplazamiento, y, h) {
    const a = ARTE[nombre];
    if (!a || !a.listo) return false;
    const w = a.img.naturalWidth * h / a.img.naturalHeight;
    for (let x = -(desplazamiento % w); x < W; x += w) ctx.drawImage(a.img, Math.floor(x), y, Math.ceil(w) + 1, h);
    return true;
  }

  function fondo() {
    /* El cielo y el volcán quedan quietos: están tan lejos que casi no se mueven. */
    const lejos = ARTE["fondo-lejos"];
    if (lejos.listo) ctx.drawImage(lejos.img, -10, -10, W + 20, SUELO + 20);
    else lejosProvisional();
    if (!banda("fondo-calle", p.fondo.medio, SUELO - 92, 96)) calleProvisional();
    if (!banda("fondo-piso", p.fondo.piso, SUELO, H - SUELO + 2)) pisoProvisional();
  }

  function lejosProvisional() {
    const cielo = ctx.createLinearGradient(0, 0, 0, SUELO);
    cielo.addColorStop(0, C.coralSuave);
    cielo.addColorStop(1, C.crema);
    ctx.fillStyle = cielo;
    ctx.fillRect(-10, -10, W + 20, SUELO + 10);

    /* Sol */
    ctx.fillStyle = C.coralClaro;
    ctx.beginPath();
    ctx.arc(390, 70, 26, 0, Math.PI * 2);
    ctx.fill();

    /* Volcán y cerros (se mueven lento) */
    const lejos = p.fondo.lejos % 620;
    for (let k = -1; k < 2; k++) {
      const vx = 150 + k * 620 - lejos;
      ctx.fillStyle = C.lila;
      ctx.beginPath();
      ctx.moveTo(vx - 190, SUELO - 20);
      ctx.lineTo(vx - 34, SUELO - 150);
      ctx.quadraticCurveTo(vx, SUELO - 162, vx + 34, SUELO - 150);
      ctx.lineTo(vx + 200, SUELO - 20);
      ctx.fill();
      ctx.fillStyle = C.blanco;
      ctx.beginPath();
      ctx.moveTo(vx - 34, SUELO - 150);
      ctx.quadraticCurveTo(vx, SUELO - 162, vx + 34, SUELO - 150);
      ctx.lineTo(vx + 56, SUELO - 132);
      ctx.lineTo(vx + 26, SUELO - 138);
      ctx.lineTo(vx + 6, SUELO - 128);
      ctx.lineTo(vx - 18, SUELO - 138);
      ctx.lineTo(vx - 56, SUELO - 130);
      ctx.fill();
    }
    ctx.fillStyle = C.lilaClaro;
    ctx.beginPath();
    ctx.moveTo(0, SUELO);
    for (let x = 0; x <= W; x += 20) {
      ctx.lineTo(x, SUELO - 38 - Math.sin((x + p.fondo.lejos * 2) / 70) * 12);
    }
    ctx.lineTo(W, SUELO);
    ctx.fill();
  }

  function calleProvisional() {
    /* Casitas (velocidad media) */
    let cx = -(p.fondo.medio % LARGO_CALLE);
    while (cx < W) {
      for (const [w, h, color] of CASAS) {
        if (cx > W) break;
        if (cx + w > 0) {
          ctx.fillStyle = color;
          ctx.fillRect(cx, SUELO - h, w, h);
          ctx.fillStyle = C.morado;
          ctx.fillRect(cx - 3, SUELO - h - 6, w + 6, 6);
          ctx.fillStyle = C.crema;
          for (let wy = SUELO - h + 10; wy < SUELO - 16; wy += 16) {
            ctx.fillRect(cx + 7, wy, 8, 8);
            if (w > 40) ctx.fillRect(cx + w - 15, wy, 8, 8);
          }
          ctx.fillStyle = C.morado;
          ctx.fillRect(cx + w / 2 - 5, SUELO - 14, 10, 14);
        }
        cx += w + 10;
      }
    }
  }

  function pisoProvisional() {
    /* Vereda: borde a cuadros morado y blanco + piso coral */
    ctx.fillStyle = C.coral;
    ctx.fillRect(-10, SUELO, W + 20, H - SUELO + 10);
    const cuadro = 10, desp = p.fondo.piso % (cuadro * 2);
    for (let fila = 0; fila < 2; fila++) {
      for (let x = -cuadro * 2 - desp; x < W + cuadro; x += cuadro) {
        const par = Math.round((x + desp) / cuadro) % 2 === 0;
        ctx.fillStyle = (par !== (fila === 1)) ? C.morado : C.blanco;
        ctx.fillRect(x, SUELO + fila * cuadro, cuadro, cuadro);
      }
    }
    ctx.fillStyle = C.coralHot;
    const raya = p.fondo.piso % 60;
    for (let x = -raya; x < W; x += 60) ctx.fillRect(x, SUELO + 30, 26, 4);
  }

  function dibujarLupita() {
    const x = LUPI.x, y = p.y, w = LUPI.w, h = LUPI.h;
    const muerta = estado === "fin";
    const parpadeo = p.invencible > 0 && p.invencible < 1.2 && Math.floor(p.invencible * 10) % 2 === 0;
    if (parpadeo) ctx.globalAlpha = 0.5;

    if (p.invencible > 0) {
      ctx.fillStyle = "rgba(242,145,124,.35)";
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, 44, 0, Math.PI * 2);
      ctx.fill();
    }

    /* Sombra */
    const alto = Math.max(0, SUELO - LUPI.h - y);
    ctx.fillStyle = "rgba(43,17,82,.18)";
    ctx.beginPath();
    ctx.ellipse(x + w / 2, SUELO + 3, Math.max(8, 24 - alto / 8), 4, 0, 0, Math.PI * 2);
    ctx.fill();

    const cuadro = Math.floor(p.cuadro);
    const bote = estado === "jugando" && p.enPiso ? Math.abs(Math.sin(p.cuadro * Math.PI / 2)) * 4 : 0;
    const listo = muerta ? sprite("lupita-choque", 0, x - 4, y, w + 8, h)
      : estado === "inicio" ? sprite("lupita-base", 0, x, y, w, h)
      : !p.enPiso ? sprite("lupita-salto", 0, x - 6, y, w + 12, h)
      : sprite("lupita-correr", cuadro, x, y - bote, w, h);

    if (!listo) lupitaProvisional(x, y, cuadro, muerta);
    ctx.globalAlpha = 1;
  }

  /* Lupita provisional: cuerpo dibujado + la cara real de la mascota. */
  function lupitaProvisional(x, y, cuadro, muerta) {
    const corriendo = estado === "jugando" && p.enPiso;
    const paso = corriendo ? (cuadro % 2 === 0 ? 1 : -1) : 0;
    const aire = !p.enPiso;

    ctx.save();
    if (muerta) {
      ctx.translate(x + 29, y + 40);
      ctx.rotate(-0.25);
      ctx.translate(-(x + 29), -(y + 40));
    }
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = C.tinta;
    ctx.lineCap = "round";

    /* Patas */
    ctx.fillStyle = C.morado;
    const pata = (px, adelante) => {
      let dx = 0, largo = 13;
      if (aire) { dx = adelante ? 6 : -6; largo = 10; }
      else dx = (adelante ? paso : -paso) * 4;
      ctx.beginPath();
      ctx.roundRect(px + dx, y + 34, 8, largo + 3, 4);
      ctx.fill();
      ctx.stroke();
    };
    pata(x + 8, false);
    pata(x + 30, true);

    /* Colita */
    ctx.beginPath();
    ctx.arc(x + 4, y + 26, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    /* Cuerpo */
    ctx.beginPath();
    ctx.ellipse(x + 22, y + 30, 20, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = C.blanco;
    ctx.beginPath();
    ctx.ellipse(x + 32, y + 34, 8, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    /* Patas del otro lado (encima del cuerpo) */
    ctx.fillStyle = C.morado;
    pata(x + 14, true);
    pata(x + 36, false);

    /* Cabeza: la mascota de La Jefa */
    const bote = corriendo ? Math.abs(Math.sin(p.cuadro * Math.PI)) * 2 : 0;
    const cab = ARTE["lupita-cabeza"];
    if (cab.listo) {
      ctx.drawImage(cab.img, x + 22, y - 16 - bote, 38, 46);
    } else {
      ctx.beginPath();
      ctx.arc(x + 42, y + 10, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    /* Estrellitas de mareo */
    if (muerta) {
      const t = performance.now() / 180;
      for (let i = 0; i < 3; i++) {
        const a = t + (i * Math.PI * 2) / 3;
        texto("★", x + 40 + Math.cos(a) * 18, y - 22 + Math.sin(a) * 6, 12, C.coralHot, "center");
      }
    }
  }

  function dibujarObstaculo(o) {
    const cuadro = Math.floor(p.cuadro * 1.4);
    if (sprite("obs-" + o.tipo, cuadro, o.x, o.y, o.w, o.h)) return;

    const { x, y, w, h } = o;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = C.tinta;
    ctx.lineJoin = "round";

    if (o.tipo === "salsa") {
      ctx.fillStyle = "#e0453a";
      ctx.beginPath(); ctx.roundRect(x, y + 12, w, h - 12, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C.blanco;
      ctx.beginPath(); ctx.roundRect(x + 4, y + 4, w - 8, 10, 3); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + w / 2 - 2, y + 4); ctx.lineTo(x + w / 2, y - 3); ctx.lineTo(x + w / 2 + 2, y + 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C.crema;
      ctx.fillRect(x + 4, y + 22, w - 8, 12);
    } else if (o.tipo === "cono") {
      ctx.fillStyle = "#f27a24";
      ctx.beginPath(); ctx.moveTo(x + w / 2 - 4, y); ctx.lineTo(x + w / 2 + 4, y); ctx.lineTo(x + w - 3, y + h - 5); ctx.lineTo(x + 3, y + h - 5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C.blanco;
      ctx.fillRect(x + 10, y + 14, w - 20, 7);
      ctx.fillStyle = "#f27a24";
      ctx.beginPath(); ctx.roundRect(x, y + h - 6, w, 6, 2); ctx.fill(); ctx.stroke();
    } else if (o.tipo === "caja") {
      ctx.fillStyle = "#c9955b";
      ctx.beginPath(); ctx.roundRect(x, y, w, h, 3); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y + 8); ctx.lineTo(x + w, y + 8); ctx.stroke();
      ctx.fillStyle = C.coral;
      ctx.beginPath(); ctx.arc(x + w / 2, y + 22, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (o.tipo === "aceite") {
      ctx.fillStyle = "#f5c842";
      ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2 + 1, w / 2, h / 2 + 1, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.7)";
      ctx.beginPath(); ctx.ellipse(x + w / 2 - 12, y + h / 2, 8, 2, 0, 0, Math.PI * 2); ctx.fill();
    } else if (o.tipo === "paloma") {
      const ala = cuadro % 2 === 0;
      ctx.fillStyle = "#8f8a9e";
      ctx.beginPath(); ctx.ellipse(x + 22, y + 15, 17, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + 6, y + 10, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#f2a33a";
      ctx.beginPath(); ctx.moveTo(x - 1, y + 9); ctx.lineTo(x - 7, y + 12); ctx.lineTo(x, y + 13); ctx.fill();
      ctx.fillStyle = C.tinta;
      ctx.beginPath(); ctx.arc(x + 5, y + 8, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#b3aec0";
      ctx.beginPath();
      if (ala) { ctx.moveTo(x + 16, y + 12); ctx.lineTo(x + 30, y - 6); ctx.lineTo(x + 34, y + 12); }
      else { ctx.moveTo(x + 16, y + 16); ctx.lineTo(x + 30, y + 30); ctx.lineTo(x + 34, y + 16); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }

  const EMOJI = { burger: "🍔", papas: "🍟", sticker: "⭐" };
  function dibujarItem(it) {
    const bote = Math.sin(it.fase) * 3;
    if (sprite("item-" + it.tipo, 0, it.x, it.y + bote, it.w, it.h)) return;
    if (it.tipo === "sticker") {
      ctx.fillStyle = "rgba(242,145,124,.4)";
      ctx.beginPath(); ctx.arc(it.x + ITEM / 2, it.y + ITEM / 2 + bote, 18, 0, Math.PI * 2); ctx.fill();
    }
    ctx.font = `${ITEM - 2}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(EMOJI[it.tipo], it.x + ITEM / 2, it.y + ITEM / 2 + bote + 1);
  }

  /* ---------- Bucle principal ---------- */
  let ultimo = performance.now();
  function bucle(t) {
    const dt = Math.min(0.05, Math.max(0, (t - ultimo) / 1000));
    ultimo = t;
    if (estado === "jugando") actualizar(dt);
    dibujar(dt);
    requestAnimationFrame(bucle);
  }
  (document.fonts && document.fonts.load ? document.fonts.load(`20px ${FUENTE}`) : Promise.resolve())
    .catch(() => {})
    .finally(() => requestAnimationFrame(bucle));

  /* ---------- Fin de partida ---------- */
  const FRASES = [
    "¡Se me cayó la burger! 🍔", "¡Ay, mi gorrito!", "¡Casi, casi!",
    "Lupita necesita otra burger…", "¡Una más y ya!", "¡Auch! Eso dolió 🐶",
  ];

  function mostrarFin() {
    if (estado !== "fin") return;
    const pts = puntaje();
    const nuevo = pts > record;
    if (nuevo) { record = pts; local.poner("lupita-record", record); }

    $("frase").textContent = elegir(FRASES);
    $("finalScore").textContent = pts.toLocaleString("es-EC");
    const partes = [`🍔 ${p.burgers}`, `🍟 ${p.papas}`];
    if (p.stickers) partes.push(`⭐ ${p.stickers}`);
    partes.push(`${Math.round(p.tiempo / 1000)} s`);
    $("finalStats").textContent = partes.join(" · ");
    $("newRecord").hidden = !nuevo;

    saveMsg.hidden = true;
    saveMsg.className = "g-save-msg";
    if (API_URL && pts > 0) {
      saveForm.hidden = false;
      saveBtn.disabled = false;
      const j = local.leer("lupita-jugador", null);
      if (j) {
        $("fNombre").value = j.nombre || "";
        $("fTel").value = j.telefono || "";
        $("fAcepta").checked = !!j.acepta;
      }
    } else {
      saveForm.hidden = true;
      if (!API_URL) aviso("🏆 El ranking abre muy pronto. Tu récord queda guardado en este teléfono.");
    }
    overScreen.hidden = false;
    $("againBtn").focus({ preventScroll: true });
  }

  function aviso(txt, ok = false) {
    saveMsg.textContent = txt;
    saveMsg.className = "g-save-msg" + (ok ? " ok" : "");
    saveMsg.hidden = false;
  }

  $("basesLink").addEventListener("click", (e) => {
    e.preventDefault();
    const bases = $("bases");
    bases.open = true;
    overScreen.hidden = true;
    bases.scrollIntoView({ behavior: "smooth", block: "start" });
    /* Al cerrar las bases se puede volver a guardar: el cuadro sigue ahí. */
    setTimeout(() => {
      const volver = document.createElement("button");
      volver.type = "button";
      volver.className = "btn btn-coral";
      volver.textContent = "← Volver a guardar mi puntaje";
      volver.style.marginTop = "12px";
      volver.addEventListener("click", () => { volver.remove(); if (estado === "fin") overScreen.hidden = false; });
      if (!bases.querySelector(".btn")) bases.append(volver);
    }, 0);
  });

  /* ---------- Servidor de puntajes ---------- */
  function pedirPartida() {
    partidaToken = null;
    if (!API_URL) return;
    fetch(API_URL + "/api/partida", { method: "POST" })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d && estado !== "inicio") partidaToken = d.partida; })
      .catch(() => {});
  }

  saveForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = $("fNombre").value.trim();
    const telefono = $("fTel").value.trim();
    const acepta = $("fAcepta").checked;
    if (nombre.length < 2) return aviso("Escribe tu nombre (mínimo 2 letras).");
    if (telefono.replace(/\D/g, "").length < 9) return aviso("Escribe tu WhatsApp, ej: 0991234567.");
    if (!acepta) return aviso("Marca la casilla de las bases para participar.");
    if (!partidaToken) return aviso("No pudimos conectar con el ranking 😕 Revisa tu internet y juega otra vez.");

    saveBtn.disabled = true;
    saveBtn.textContent = "Guardando…";
    try {
      const r = await fetch(API_URL + "/api/puntaje", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partida: partidaToken, nombre, telefono, acepta,
          puntaje: puntaje(), duracion: Math.floor(p.tiempo), distancia: Math.floor(p.distancia),
          burgers: p.burgers, papas: p.papas, stickers: p.stickers,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "No se pudo guardar");
      local.poner("lupita-jugador", { nombre, telefono, acepta });
      partidaToken = null;
      saveForm.hidden = true;
      aviso(d.posicion === 1
        ? "👑 ¡Guardado! Vas en el PRIMER lugar del mes. ¡Defiende tu burger!"
        : `🏆 ¡Guardado! Tu mejor puntaje va #${d.posicion} de ${d.jugadores} este mes.`, true);
      cargarRanking();
    } catch (err) {
      aviso(err.message === "Failed to fetch" ? "Sin conexión 😕 Intenta otra vez." : err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "🏆 Guardar mi puntaje";
    }
  });

  /* ---------- Ranking del mes ---------- */
  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
    "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const nombreMes = (m) => MESES[Number(m.slice(5, 7)) - 1] + " " + m.slice(0, 4);

  function diasParaCierre() {
    const ahora = new Date(Date.now() - 5 * 3600e3);          // hora de Ecuador
    const fin = Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() + 1, 1);
    return Math.ceil((fin - ahora.getTime()) / 864e5);
  }

  function pintarCierre() {
    const d = diasParaCierre();
    $("rankCierra").textContent = d <= 1
      ? "⏰ ¡Último día! El ranking cierra hoy a la medianoche."
      : `El ranking cierra en ${d} días · premio: 1 hamburguesa 🍔`;
  }

  async function cargarRanking() {
    const lista = $("rankList"), vacio = $("rankEmpty");
    $("rankMes").textContent = MESES[new Date(Date.now() - 5 * 3600e3).getUTCMonth()];
    pintarCierre();
    if (!API_URL) {
      vacio.textContent = "🐶 El ranking abre muy pronto. ¡Ve practicando!";
      vacio.hidden = false;
      return;
    }
    try {
      const r = await fetch(API_URL + "/api/ranking", { cache: "no-store" });
      if (!r.ok) throw new Error();
      const d = await r.json();
      $("rankMes").textContent = MESES[Number(d.mes.slice(5, 7)) - 1];
      lista.replaceChildren(...d.top.map((f) => {
        const li = document.createElement("li");
        const n = document.createElement("span"); n.className = "n"; n.textContent = f.nombre;
        const s = document.createElement("span"); s.className = "p"; s.textContent = f.puntaje.toLocaleString("es-EC");
        li.append(n, s);
        return li;
      }));
      vacio.hidden = d.top.length > 0;
      vacio.textContent = "Nadie ha jugado este mes todavía. ¡La burger puede ser tuya! 🍔";

      const ganadores = $("winners");
      ganadores.hidden = !d.ganadores.length;
      $("winnersList").replaceChildren(...d.ganadores.map((g) => {
        const li = document.createElement("li");
        li.textContent = `🏆 ${nombreMes(g.mes)} — ${g.nombre} · ${g.puntaje.toLocaleString("es-EC")}`;
        return li;
      }));
    } catch (e) {
      vacio.textContent = "No pudimos cargar el ranking. Intenta más tarde.";
      vacio.hidden = false;
    }
  }
  cargarRanking();
})();
