/* Renderiza un HTML animado a cuadros PNG usando Chrome, y arma el MP4.
 *
 *   node render-video.mjs video.html salida.mp4 [ancho] [alto] [fps]
 *
 * El HTML debe exponer window.render(t) y window.DURACION (segundos).
 * Cada cuadro se dibuja llamando render(t) y fotografiando: el video sale
 * idéntico siempre, sin depender de la velocidad de la máquina.
 */
import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const [htmlArg, outArg, wArg, hArg, fpsArg] = process.argv.slice(2);
const HTML = resolve(htmlArg);
const OUT = resolve(outArg ?? "salida.mp4");
const W = +(wArg ?? 1080), H = +(hArg ?? 1080), FPS = +(fpsArg ?? 30);
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9333 + Math.floor(Math.random() * 400);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* --- arrancar Chrome --- */
const perfil = mkdtempSync(join(tmpdir(), "cromo-"));
const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${perfil}`,
  "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
  "--no-first-run", "--no-default-browser-check", `--window-size=${W},${H}`,
  "about:blank",
], { stdio: "ignore" });

/* --- esperar a que conteste --- */
let objetivo;
for (let i = 0; i < 60; i++) {
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const pestañas = await r.json();
    objetivo = pestañas.find((t) => t.type === "page");
    if (objetivo) break;
  } catch {}
  await sleep(250);
}
if (!objetivo) { chrome.kill(); throw new Error("Chrome no respondió"); }

/* --- hablar con Chrome por WebSocket (CDP) --- */
const ws = new WebSocket(objetivo.webSocketDebuggerUrl);
await new Promise((ok, err) => { ws.onopen = ok; ws.onerror = err; });

let idMsg = 0;
const esperando = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && esperando.has(m.id)) {
    const { ok, err } = esperando.get(m.id);
    esperando.delete(m.id);
    m.error ? err(new Error(m.error.message)) : ok(m.result);
  }
};
const cdp = (method, params = {}) =>
  new Promise((ok, err) => {
    const id = ++idMsg;
    esperando.set(id, { ok, err });
    ws.send(JSON.stringify({ id, method, params }));
  });

const evaluar = async (expr) => {
  const r = await cdp("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  return r.result?.value;
};

/* --- preparar página --- */
await cdp("Page.enable");
await cdp("Runtime.enable");
await cdp("Emulation.setDeviceMetricsOverride", {
  width: W, height: H, deviceScaleFactor: 1, mobile: false,
});
await cdp("Page.navigate", { url: `file://${HTML}` });
await sleep(1400);

/* fuentes e imágenes listas antes de fotografiar */
await evaluar(`document.fonts.ready.then(()=>Promise.all(
  [...document.images].filter(i=>!i.complete).map(i=>new Promise(r=>{i.onload=i.onerror=r}))
)).then(()=>true)`);
await sleep(500);

const DUR = (await evaluar("window.DURACION")) ?? 15;
const TOTAL = Math.round(DUR * FPS);
const carpeta = mkdtempSync(join(tmpdir(), "cuadros-"));
console.log(`Cocinando ${TOTAL} cuadros (${DUR}s a ${FPS} fps) ...`);

for (let f = 0; f < TOTAL; f++) {
  await evaluar(`window.render(${(f / FPS).toFixed(4)}); true`);
  const shot = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  writeFileSync(join(carpeta, `f${String(f).padStart(5, "0")}.png`), Buffer.from(shot.data, "base64"));
  if (f % 30 === 0) process.stdout.write(`  ${f}/${TOTAL}\r`);
}

ws.close();
chrome.kill();

/* --- juntar los cuadros en MP4 --- */
console.log("\nArmando el video ...");
execFileSync("ffmpeg", [
  "-y", "-framerate", String(FPS), "-i", join(carpeta, "f%05d.png"),
  "-c:v", "libx264", "-preset", "slow", "-crf", "20",
  "-pix_fmt", "yuv420p", "-movflags", "+faststart", OUT,
], { stdio: ["ignore", "ignore", "pipe"] });

rmSync(carpeta, { recursive: true, force: true });
rmSync(perfil, { recursive: true, force: true });
console.log(`Listo: ${OUT}`);
