/* ===== LA JEFA DARKITCHEN — Carrito + WhatsApp ===== */

const WHATSAPP = "593998939215";
const COMBO_PRICE = 1.75;

/* ===== LANZAMIENTO =====
   Hasta esta fecha la web está en "antesala": se ve el menú pero los pedidos
   online no se activan todavía; mientras tanto se pide por WhatsApp.
   Lunes 3 de agosto de 2026, 3:30 PM hora de Ecuador (UTC-5).
   Para adelantar o posponer, cambia solo esta línea. */
const LANZAMIENTO = new Date("2026-08-03T15:30:00-05:00").getTime();

const faltaParaLanzar = () => LANZAMIENTO - Date.now();
const enAntesala = () => faltaParaLanzar() > 0;

const BREADS = ["Pan de papa", "Pan de vainiquilla", "Pan brioche albino", "Pan de pretzel"];

const COMBO_DRINKS = ["Pepsi", "Seven Up", "Fuze Tea", "Agua sin gas"];

/* === Personalización estilo caja (POS de La Jefa) ===
   0 = sin · default = incluido · más = extra (se cobra c/u). Quitar es gratis. */
const INGREDIENTS = [
  { id: "carne", name: "Carne", price: 1.00, emoji: "🥩" },
  { id: "queso", name: "Queso", price: 1.00, emoji: "🧀" },
  { id: "salsa", name: "Salsa secreta", price: 0, emoji: "🤫" },
  { id: "mermelada", name: "Mermelada de tocino", price: 1.00, emoji: "🥓" },
  { id: "tocino", name: "Tocino crujiente", price: 1.00, emoji: "🥓" },
  { id: "cebolla", name: "Cebolla caramelizada", price: 0.50, emoji: "🧅" },
  { id: "aros", name: "Aros de cebolla", price: 0.50, emoji: "🧅" },
  { id: "huevo", name: "Huevo", price: 0.50, emoji: "🍳" },
  { id: "chorizo", name: "Chorizo", price: 1.00, emoji: "🌭" },
  { id: "pina", name: "Piña caramelizada", price: 1.00, emoji: "🍍" },
  { id: "aji", name: "Ají", price: 0, emoji: "🌶️" },
];

/* Receta por defecto de cada burger (lo que no aparece = 0) */
const BURGER_DEFAULTS = {
  cheeseburger: { carne: 1, queso: 1, salsa: 1 },
  lupita: { carne: 1, queso: 1, salsa: 1, mermelada: 1, cebolla: 1 },
  reina: { carne: 2, queso: 2, salsa: 1, mermelada: 1, cebolla: 1 },
  consentida: { carne: 2, queso: 2, salsa: 1, tocino: 1, aros: 1 },
  brasil: { carne: 2, queso: 2, salsa: 1, tocino: 1, pina: 1 },
};

/* Toppings por cantidad para papas */
const PAPA_TOPPINGS = [
  { id: "cebolla", name: "Cebolla caramelizada", price: 0.50 },
  { id: "huevo", name: "Huevo", price: 0.50 },
  { id: "aros", name: "Aros de cebolla", price: 0.50 },
  { id: "aji", name: "Ají", price: 0 },
  { id: "tocino", name: "Tocino crujiente", price: 1.00 },
  { id: "carnequeso", name: "Carne y queso", price: 1.00 },
  { id: "mermelada", name: "Mermelada de tocino", price: 1.00 },
  { id: "chorizo", name: "Chorizo", price: 1.00 },
];

/* Ingredientes ya incluidos en papas (se pueden quitar gratis) */
const PAPA_INCLUDED = {
  papiza: ["Carne smash", "Chorizo", "Mermelada de tocino", "Salsa", "Queso cheddar"],
  choripapa: ["Chorizo", "Salsa"],
};

/* opts: bread = elegir pan · combo = puede hacerse combo · toppings = extras */
const MENU = {
  burgers: [
    {
      id: "cheeseburger", name: "Cheese Burger", price: 2.25, emoji: "🧀",
      img: "images/cheese-burger.jpg", badge: "Sencilla",
      desc: "Carne smash, queso cheddar y salsa secreta de Lupita.",
      bread: true, combo: true, toppings: true,
    },
    {
      id: "lupita", name: "La Lupita", price: 3.50, emoji: "🍔",
      img: "images/la-lupita.jpg", badge: "Clásica",
      desc: "Carne smash, queso cheddar, mermelada de tocino, cebolla caramelizada y salsa secreta de Lupita.",
      bread: true, combo: true, toppings: true,
    },
    {
      id: "reina", name: "La Reina", price: 4.50, emoji: "👑",
      img: "images/la-reina.jpg", badge: "Doble carne",
      desc: "Doble carne smash, doble queso cheddar, mermelada de tocino, cebolla caramelizada y salsa secreta de Lupita.",
      bread: true, combo: true, toppings: true,
    },
    {
      id: "consentida", name: "La Consentida", price: 5.00, emoji: "🤩",
      img: "images/la-consentida.jpg", badge: "⭐ La más pedida", hot: true,
      desc: "Doble carne smash, doble queso cheddar, tocino crujiente, aros de cebolla, salsa BBQ de la casa y salsa secreta de Lupita.",
      bread: true, combo: true, toppings: true,
    },
    {
      id: "brasil", name: "Smash do Brasil", price: 5.50, emoji: "🍍",
      img: "images/smash-do-brasil.jpg", badge: "Edición de temporada", hot: true,
      desc: "Doble carne smash, tocino crujiente, doble queso mozzarella, piña caramelizada, salsa ahumada de Lupita y salsa de ajo. Hasta el 9 de agosto.",
      bread: true, combo: true, toppings: true,
    },
  ],
  combos: [
    {
      id: "panas", name: "Promo Panas", price: 10.99, emoji: "🤝",
      img: "images/promo-panas.jpg", badge: "Antes $12", hot: true,
      desc: "4 Cheese Burgers + 2 Papas clásicas. Por $4 más cambia las Cheese por Lupitas.",
      bread: true, combo: false, toppings: false,
    },
    {
      id: "lunes", name: "Combo Lunes de La Jefa", price: 9.99, emoji: "🗓️",
      img: "images/combo-lunes.jpg", badge: "Solo lunes",
      desc: "1 La Lupita + 1 La Reina + 1 La Papiza + 1 Gaseosa de 1L. Válido solo los lunes.",
      bread: true, combo: false, toppings: false,
    },
  ],
  sides: [
    {
      id: "papiza", name: "La Papiza", price: 4.00, emoji: "🍟",
      img: "images/la-papiza.jpg", badge: "Para compartir",
      desc: "Papas crujientes con carne smash, chorizo, mermelada de tocino, salsa y queso cheddar derretido.",
      bread: false, combo: false, toppings: true,
    },
    {
      id: "choripapa", name: "Chori Papa", price: 2.50, emoji: "🌭",
      img: "images/chori-papa.jpg",
      desc: "Papas con chorizo y salsa de la casa.",
      bread: false, combo: false, toppings: true,
    },
    {
      id: "aros", name: "Aros de Cebolla", price: 2.00, emoji: "🧅",
      img: "images/aros-cebolla.jpg",
      desc: "Aros de cebolla dorados y crujientes.",
      bread: false, combo: false, toppings: false,
    },
    {
      id: "papas", name: "Papas Clásicas", price: 1.50, emoji: "🍟",
      img: "images/papas-clasicas.jpg",
      desc: "Papitas crujientes de la casa.",
      bread: false, combo: false, toppings: true,
    },
  ],
  drinks: [
    { id: "pepsi", name: "Pepsi Personal", price: 0.50, emoji: "🥤", img: "images/pepsi.jpg", desc: "Bien fría." },
    { id: "sevenup", name: "Seven Up Personal", price: 0.50, emoji: "🥤", img: "images/sevenup.jpg", desc: "Bien fría." },
    { id: "fuzetea", name: "Fuze Tea", price: 0.50, emoji: "🧋", img: "images/fuze-tea.jpg", desc: "Té frío refrescante." },
    { id: "agua", name: "Agua sin Gas", price: 0.50, emoji: "💧", img: "images/agua.jpg", desc: "Agua natural." },
    { id: "pepsi1l", name: "Pepsi 1L", price: 1.00, emoji: "🥤", img: "images/pepsi-1l.jpg", desc: "Para compartir." },
    { id: "sevenup1l", name: "Seven Up 1L", price: 1.00, emoji: "🥤", img: "images/sevenup-1l.jpg", desc: "Para compartir." },
  ],
};

const money = (n) => `$${n.toFixed(2)}`;

/* Texto escrito por el cliente nunca se inyecta crudo en el HTML */
const esc = (s) => String(s).replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ===== RENDER MENÚ ===== */
function cardHTML(item, type, i) {
  const comboClass = type === "combos" ? " card-combo" : "";
  return `
  <article class="card${comboClass} reveal" style="--d:${(i % 4) * 0.08}s" data-type="${type}" data-id="${item.id}">
    <div class="card-img">
      ${item.badge ? `<span class="card-badge${item.hot ? " hot" : ""}">${item.badge}</span>` : ""}
      <img src="${item.img}" alt="${item.name}" loading="lazy" onerror="this.replaceWith('${item.emoji}')">
    </div>
    <div class="card-body">
      <h3 class="card-name">${item.name}</h3>
      <p class="card-desc">${item.desc}</p>
      <div class="card-bottom">
        <span class="card-price">${money(item.price)}</span>
        <button class="card-add" aria-label="Agregar ${item.name}">+</button>
      </div>
    </div>
  </article>`;
}

document.getElementById("gridBurgers").innerHTML = MENU.burgers.map((it, i) => cardHTML(it, "burgers", i)).join("");
document.getElementById("gridCombos").innerHTML = MENU.combos.map((it, i) => cardHTML(it, "combos", i)).join("");
document.getElementById("gridSides").innerHTML = MENU.sides.map((it, i) => cardHTML(it, "sides", i)).join("");
document.getElementById("gridDrinks").innerHTML = MENU.drinks.map((it, i) => cardHTML(it, "drinks", i)).join("");

/* ===== REVEAL ON SCROLL ===== */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach(el => io.observe(el));

/* Red de seguridad: si el visitante salta de golpe (menú, ancla, recarga a
   media página), el observador nunca ve esos bloques y quedarían invisibles.
   Todo lo que ya pasó por pantalla se muestra sí o sí. */
function revealPassed() {
  document.querySelectorAll(".reveal:not(.in)").forEach(el => {
    if (el.getBoundingClientRect().top < window.innerHeight) {
      el.classList.add("in");
      io.unobserve(el);
    }
  });
}

addEventListener("scroll", revealPassed, { passive: true });
addEventListener("load", revealPassed);
addEventListener("hashchange", revealPassed);
revealPassed();

/* ===== SCROLLSPY ===== */
const spyLinks = document.querySelectorAll("[data-spy]");
const sections = ["hamburguesas", "combos", "picar", "bebidas"].map(id => document.getElementById(id));

const spyIO = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      spyLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${e.target.id}`));
    }
  });
}, { rootMargin: "-30% 0px -60% 0px" });

sections.forEach(s => spyIO.observe(s));

/* ===== TOAST ===== */
let toastTimer;
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

/* ===== ESTADO ===== */

/* El carrito vive en el navegador del cliente, así que NUNCA confiamos en el
   precio guardado: se recalcula desde el menú antes de mostrarlo o enviarlo.
   Si alguien edita el almacenamiento para pagar $0.01, el precio real vuelve. */
function priceOf(line) {
  const item = (MENU[line.type] || []).find(i => i.id === line.id);
  if (!item) return null;                       // producto que ya no existe

  let p = item.price;
  if (line.combo && item.combo) p += COMBO_PRICE;

  const catalogo = line.type === "burgers" ? INGREDIENTS : PAPA_TOPPINGS;
  for (const ex of line.extras || []) {
    const ing = catalogo.find(i => i.id === ex.id);
    if (ing) p += ing.price * Math.min(Math.max(+ex.qty || 0, 0), 5);
  }
  return Math.round(p * 100) / 100;
}

function sanitizeCart(lista) {
  if (!Array.isArray(lista)) return [];
  return lista.reduce((ok, line) => {
    const real = priceOf(line);
    if (real === null) return ok;               // descarta lo que ya no está
    line.qty = Math.min(Math.max(Math.round(+line.qty) || 1, 1), 20);
    line.unit = real;                           // precio real manda
    ok.push(line);
    return ok;
  }, []);
}

let cart = [];
try { cart = sanitizeCart(JSON.parse(localStorage.getItem("lajefa-cart") || "[]")); } catch { cart = []; }

function saveCart() { localStorage.setItem("lajefa-cart", JSON.stringify(cart)); }

let current = null;

/* ===== MODAL PRODUCTO ===== */
const modal = document.getElementById("productModal");
const modalImg = document.getElementById("modalImg");
const optBread = document.getElementById("optBread");
const optIngredients = document.getElementById("optIngredients");
const optCombo = document.getElementById("optCombo");
const comboCheck = document.getElementById("comboCheck");
const comboDrink = document.getElementById("comboDrink");
const ingList = document.getElementById("ingList");

function openModal(type, id) {
  const item = MENU[type].find(i => i.id === id);
  const isBurger = type === "burgers";
  const isPapa = type === "sides" && item.toppings;
  const defaults = isBurger ? { ...(BURGER_DEFAULTS[id] || { carne: 1, queso: 1, salsa: 1 }) } : {};

  current = {
    item, type, isBurger, isPapa,
    bread: BREADS[0],
    combo: false, comboDrink: COMBO_DRINKS[0],
    defaults,
    ing: { ...defaults },              // burger: cantidad por ingrediente
    papaTops: {},                       // papa: cantidad por topping
    papaRemoved: new Set(),             // papa: incluidos quitados
    qty: 1,
  };

  document.getElementById("modalName").textContent = item.name;
  document.getElementById("modalPrice").textContent = money(item.price);
  document.getElementById("modalDesc").textContent = item.desc;
  document.getElementById("itemNote").value = "";
  document.getElementById("qtyValue").textContent = "1";

  modalImg.innerHTML = `<img src="${item.img}" alt="${item.name}" onerror="this.replaceWith('${item.emoji}')">`;

  optBread.hidden = !item.bread;
  optIngredients.hidden = !(isBurger || isPapa);
  optCombo.hidden = !item.combo;
  comboCheck.checked = false;
  comboDrink.hidden = true;

  if (item.bread) {
    document.getElementById("breadOptions").innerHTML = BREADS.map((b, i) =>
      `<button class="opt-chip ${i === 0 ? "selected" : ""}" data-bread="${b}">${b}</button>`).join("");
  }
  if (item.combo) {
    document.getElementById("comboDrinkOptions").innerHTML =
      `<p class="opt-hint">Elige la bebida de tu combo:</p>` +
      COMBO_DRINKS.map((d, i) =>
        `<button class="opt-chip ${i === 0 ? "selected" : ""}" data-drink="${d}">${d}</button>`).join("");
  }
  if (isBurger || isPapa) renderIngredients();

  updateModalTotal();

  /* En antesala no se agrega al carrito: se pide por WhatsApp */
  const enEspera = typeof enAntesala === "function" && enAntesala();
  document.getElementById("addToCart").hidden = enEspera;
  document.querySelector(".qty-control").hidden = enEspera;
  const wa = document.getElementById("preOrderBtn");
  wa.hidden = !enEspera;
  if (enEspera) wa.href = waProducto(item);

  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

/* Fila con stepper − / cantidad / + y estado (Sin · Incluido · Extra) */
function stepperRow(id, name, emoji, qty, def, price) {
  let state, cls;
  if (qty === 0 && def > 0) { state = "Sin"; cls = "off"; }
  else if (qty === 0) { state = price ? `+${money(price)} c/u` : "Gratis"; cls = "zero"; }
  else if (qty <= def) { state = "Incluido"; cls = "inc"; }
  else { state = `Extra ×${qty - def} +${money((qty - def) * price)}`; cls = "extra"; }
  return `
  <div class="ing-row ${qty === 0 && def > 0 ? "removed" : ""}">
    <span class="ing-emoji">${emoji}</span>
    <span class="ing-name">${name}</span>
    <span class="ing-state ${cls}">${state}</span>
    <div class="ing-stepper">
      <button data-ing="${id}" data-d="-1" aria-label="Quitar ${name}">−</button>
      <span>${qty}</span>
      <button data-ing="${id}" data-d="1" aria-label="Agregar ${name}">+</button>
    </div>
  </div>`;
}

function renderIngredients() {
  if (current.isBurger) {
    ingList.innerHTML = INGREDIENTS.map(ing =>
      stepperRow(ing.id, ing.name, ing.emoji, current.ing[ing.id] ?? 0, current.defaults[ing.id] ?? 0, ing.price)
    ).join("");
  } else if (current.isPapa) {
    const included = PAPA_INCLUDED[current.item.id] || [];
    ingList.innerHTML =
      (included.length ? `<p class="opt-hint">Trae incluido (toca para quitar, gratis):</p>
      <div class="opt-list">${included.map(n =>
        `<button class="opt-chip inc-chip ${current.papaRemoved.has(n) ? "removed-chip" : "selected"}" data-inc="${n}">
          ${current.papaRemoved.has(n) ? "✕ Sin " : "✓ "}${n}</button>`).join("")}</div>
      <p class="opt-hint" style="margin-top:12px">Agrega toppings:</p>` : "") +
      PAPA_TOPPINGS.map(t =>
        stepperRow(t.id, t.name, "➕", current.papaTops[t.id] ?? 0, 0, t.price)
      ).join("");
  }
}

function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = "";
}

/* Precio unitario + desglose en vivo */
function priceParts() {
  const parts = [{ label: current.item.name, amount: current.item.price }];
  if (current.isBurger) {
    for (const ing of INGREDIENTS) {
      const def = current.defaults[ing.id] ?? 0;
      const q = current.ing[ing.id] ?? 0;
      if (q > def && ing.price) parts.push({ label: `Extra ${ing.name.toLowerCase()} ×${q - def}`, amount: (q - def) * ing.price });
    }
  }
  if (current.isPapa) {
    for (const t of PAPA_TOPPINGS) {
      const q = current.papaTops[t.id] ?? 0;
      if (q > 0 && t.price) parts.push({ label: `${t.name} ×${q}`, amount: q * t.price });
    }
  }
  if (current.combo) parts.push({ label: `Combo (fries + ${current.comboDrink})`, amount: COMBO_PRICE });
  return parts;
}

function unitPrice() {
  return priceParts().reduce((s, p) => s + p.amount, 0);
}

function updateModalTotal() {
  const parts = priceParts();
  document.getElementById("modalTotal").textContent = money(unitPrice() * current.qty);
  const bd = document.getElementById("priceBreakdown");
  bd.innerHTML = parts.length > 1
    ? parts.map(p => `<div class="bd-row"><span>${p.label}</span><span>${money(p.amount)}</span></div>`).join("")
    : "";
}

modal.addEventListener("click", (e) => {
  if (e.target === modal) return closeModal();

  const breadBtn = e.target.closest("[data-bread]");
  if (breadBtn) {
    current.bread = breadBtn.dataset.bread;
    document.querySelectorAll("[data-bread]").forEach(b => b.classList.toggle("selected", b === breadBtn));
  }

  const drinkBtn = e.target.closest("[data-drink]");
  if (drinkBtn) {
    current.comboDrink = drinkBtn.dataset.drink;
    document.querySelectorAll("[data-drink]").forEach(b => b.classList.toggle("selected", b === drinkBtn));
    updateModalTotal();
  }

  const stepBtn = e.target.closest("[data-ing]");
  if (stepBtn) {
    const id = stepBtn.dataset.ing;
    const d = +stepBtn.dataset.d;
    if (current.isBurger) {
      current.ing[id] = Math.max(0, Math.min(5, (current.ing[id] ?? 0) + d));
    } else {
      current.papaTops[id] = Math.max(0, Math.min(5, (current.papaTops[id] ?? 0) + d));
    }
    renderIngredients();
    updateModalTotal();
  }

  const incChip = e.target.closest("[data-inc]");
  if (incChip) {
    const n = incChip.dataset.inc;
    current.papaRemoved.has(n) ? current.papaRemoved.delete(n) : current.papaRemoved.add(n);
    renderIngredients();
  }
});

modal.addEventListener("change", (e) => {
  if (e.target === comboCheck) {
    current.combo = comboCheck.checked;
    comboDrink.hidden = !comboCheck.checked;
  }
  updateModalTotal();
});

document.getElementById("modalClose").addEventListener("click", closeModal);

document.getElementById("qtyMinus").addEventListener("click", () => {
  if (current.qty > 1) current.qty--;
  document.getElementById("qtyValue").textContent = current.qty;
  updateModalTotal();
});

document.getElementById("qtyPlus").addEventListener("click", () => {
  if (current.qty < 20) current.qty++;
  document.getElementById("qtyValue").textContent = current.qty;
  updateModalTotal();
});

/* Resumen de personalización para carrito y WhatsApp */
function customLines() {
  const L = [];
  if (current.isBurger) {
    for (const ing of INGREDIENTS) {
      const def = current.defaults[ing.id] ?? 0;
      const q = current.ing[ing.id] ?? 0;
      if (q === 0 && def > 0) L.push(`Sin ${ing.name.toLowerCase()}`);
      else if (q > def) L.push(`Extra ${ing.name.toLowerCase()} ×${q - def}`);
    }
  }
  if (current.isPapa) {
    current.papaRemoved.forEach(n => L.push(`Sin ${n.toLowerCase()}`));
    for (const t of PAPA_TOPPINGS) {
      const q = current.papaTops[t.id] ?? 0;
      if (q > 0) L.push(`${t.name} ×${q}`);
    }
  }
  return L;
}

document.getElementById("addToCart").addEventListener("click", () => {
  const extras = [];
  if (current.isBurger) {
    for (const ing of INGREDIENTS) {
      const def = current.defaults[ing.id] ?? 0;
      const q = current.ing[ing.id] ?? 0;
      if (q > def) extras.push({ id: ing.id, qty: q - def });
    }
  }
  if (current.isPapa) {
    for (const t of PAPA_TOPPINGS) {
      const q = current.papaTops[t.id] ?? 0;
      if (q > 0) extras.push({ id: t.id, qty: q });
    }
  }

  cart.push({
    type: current.type,
    id: current.item.id,
    name: current.item.name,
    bread: current.item.bread ? current.bread : null,
    combo: current.combo,
    comboDrink: current.combo ? current.comboDrink : null,
    extras,
    lines: customLines(),
    note: document.getElementById("itemNote").value.trim(),
    qty: current.qty,
    unit: unitPrice(),
  });
  saveCart();
  closeModal();
  renderCart();
  toast(`✅ ${current.item.name} agregado al pedido`);
  const btn = document.getElementById("cartBtn");
  btn.classList.remove("bump");
  void btn.offsetWidth;
  btn.classList.add("bump");
});

document.querySelector(".menu").addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (card) openModal(card.dataset.type, card.dataset.id);
});

/* ===== CÓDIGOS DE DESCUENTO =====
   Para agregar otro código: copia la línea y cambia nombre y porcentaje.
   Se aplica sobre el subtotal del pedido (el domicilio se cobra aparte). */
const DISCOUNTS = {
  LAJEFA10: { percent: 10 },
};

let appliedCode = null;
try { appliedCode = localStorage.getItem("lajefa-code") || null; } catch { appliedCode = null; }
if (appliedCode && !DISCOUNTS[appliedCode]) appliedCode = null;

function discountAmount(subtotal) {
  if (!appliedCode) return 0;
  return Math.round(subtotal * DISCOUNTS[appliedCode].percent) / 100;
}

function promoFeedback(texto, ok) {
  const el = document.getElementById("promoMsg");
  el.textContent = texto;
  el.className = `promo-msg ${ok ? "ok" : "err"}`;
  el.hidden = false;
}

function applyCode() {
  const input = document.getElementById("promoInput");
  const code = input.value.trim().toUpperCase();

  if (!code) return promoFeedback("Escribe un código para aplicarlo.", false);

  if (!DISCOUNTS[code]) {
    appliedCode = null;
    localStorage.removeItem("lajefa-code");
    promoFeedback("Ese código no existe o ya venció 😕", false);
    return renderCart();
  }

  appliedCode = code;
  localStorage.setItem("lajefa-code", code);
  input.value = code;
  promoFeedback(`✅ ¡Código aplicado! ${DISCOUNTS[code].percent}% de descuento`, true);
  renderCart();
}

document.getElementById("promoApply").addEventListener("click", applyCode);
document.getElementById("promoInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); applyCode(); }
});

if (appliedCode) {
  document.getElementById("promoInput").value = appliedCode;
  promoFeedback(`✅ ¡Código aplicado! ${DISCOUNTS[appliedCode].percent}% de descuento`, true);
}

/* ===== CARRITO ===== */
const cartOverlay = document.getElementById("cartOverlay");

function openCart() {
  cartOverlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeCart() {
  cartOverlay.hidden = true;
  document.body.style.overflow = "";
}

document.getElementById("cartBtn").addEventListener("click", () => {
  if (enAntesala()) { toast(`🔒 Los pedidos por la web abren en ${textoCorto()}`); return; }
  openCart();
});
document.getElementById("cartClose").addEventListener("click", closeCart);
cartOverlay.addEventListener("click", (e) => { if (e.target === cartOverlay) closeCart(); });

function renderCart() {
  const itemsEl = document.getElementById("cartItems");
  cart = sanitizeCart(cart);
  const subtotal = cart.reduce((s, i) => s + i.unit * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const descuento = discountAmount(subtotal);
  const total = subtotal - descuento;

  document.getElementById("cartCount").textContent = count;
  document.getElementById("cartEmpty").style.display = cart.length ? "none" : "block";
  document.getElementById("cartFooter").hidden = !cart.length;

  document.getElementById("subtotalLine").hidden = !descuento;
  document.getElementById("discountLine").hidden = !descuento;
  document.getElementById("cartSubtotal").textContent = money(subtotal);
  document.getElementById("cartDiscount").textContent = `-${money(descuento)}`;
  if (descuento) {
    document.getElementById("discountLabel").textContent = `Descuento (${appliedCode} · ${DISCOUNTS[appliedCode].percent}%)`;
  }
  document.getElementById("cartTotal").textContent = money(total);
  renderSuggestions();

  itemsEl.innerHTML = cart.map((item, idx) => {
    const details = [];
    if (item.bread) details.push(esc(item.bread));
    if (item.combo) details.push(`Combo + ${esc(item.comboDrink)}`);
    details.push(...(item.lines || []).map(esc));
    if (item.note) details.push(`Nota: ${esc(item.note)}`);
    return `
    <div class="cart-item">
      <div class="cart-item-top">
        <span class="cart-item-name">${esc(item.name)}</span>
        <span class="cart-item-price">${money(item.unit * item.qty)}</span>
      </div>
      ${details.length ? `<div class="cart-item-detail">${details.join(" · ")}</div>` : ""}
      <div class="cart-item-actions">
        <div class="qty-control">
          <button data-minus="${idx}" aria-label="Menos">−</button>
          <span>${item.qty}</span>
          <button data-plus="${idx}" aria-label="Más">+</button>
        </div>
        <button class="cart-remove" data-remove="${idx}">Eliminar</button>
      </div>
    </div>`;
  }).join("");
}

/* ===== SUGERENCIAS: "¿Le sumas algo?" =====
   Mira qué falta en el carrito y ofrece el acompañante lógico.
   Sin IA, sin costo: papas si no hay, bebida si no hay, salsa/postre extra. */
function renderSuggestions() {
  const bloque = document.getElementById("suggestBlock");
  const fila = document.getElementById("suggestRow");
  if (!cart.length) { bloque.hidden = true; return; }

  const tiene = (t) => cart.some(i => i.type === t);
  const tieneId = (id) => cart.some(i => i.id === id);
  const hayBurger = tiene("burgers") || tiene("combos");

  /* El combo ya incluye papas + bebida: no las volvemos a ofrecer */
  const hayCombo = cart.some(i => i.combo);

  const ideas = [];
  if (hayBurger && !tiene("sides") && !hayCombo) ideas.push(["sides", "papas"]);
  if (!tiene("drinks") && !hayCombo) ideas.push(["drinks", "pepsi"]);
  if (hayBurger && !tieneId("aros")) ideas.push(["sides", "aros"]);
  if (!hayBurger && tiene("sides")) ideas.push(["burgers", "lupita"]);

  const lista = ideas.slice(0, 3).map(([t, id]) => ({ t, p: MENU[t].find(x => x.id === id) })).filter(x => x.p);
  if (!lista.length) { bloque.hidden = true; return; }

  fila.innerHTML = lista.map(({ t, p }) => `
    <button type="button" class="suggest-card" data-add-type="${t}" data-add-id="${p.id}">
      <img src="${p.img}" alt="" onerror="this.replaceWith('${p.emoji}')">
      <span class="suggest-name">${esc(p.name)}</span>
      <span class="suggest-price">+${money(p.price)}</span>
    </button>`).join("");
  bloque.hidden = false;
}

document.getElementById("suggestRow").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-add-id]");
  if (!btn) return;
  openModal(btn.dataset.addType, btn.dataset.addId);
});

document.getElementById("cartItems").addEventListener("click", (e) => {
  const minus = e.target.closest("[data-minus]");
  const plus = e.target.closest("[data-plus]");
  const remove = e.target.closest("[data-remove]");
  if (minus) {
    const i = +minus.dataset.minus;
    cart[i].qty > 1 ? cart[i].qty-- : cart.splice(i, 1);
  }
  if (plus) { const i = cart[+plus.dataset.plus]; if (i.qty < 20) i.qty++; }
  if (remove) cart.splice(+remove.dataset.remove, 1);
  if (minus || plus || remove) { saveCart(); renderCart(); }
});

/* ===== DATOS DEL PEDIDO (obligatorios) ===== */
let orderMode = null;   // Delivery · Retiro en local · Comer en el local
let payMethod = null;   // Efectivo · Transferencia · DeUna · Tarjeta

const addressBlock = document.getElementById("addressBlock");
const cashBlock = document.getElementById("cashBlock");
const formError = document.getElementById("formError");

function pickChoice(container, attr, value) {
  container.querySelectorAll(".choice").forEach(b =>
    b.classList.toggle("selected", b.dataset[attr] === value));
}

document.getElementById("modeOptions").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-mode]");
  if (!btn) return;
  orderMode = btn.dataset.mode;
  pickChoice(document.getElementById("modeOptions"), "mode", orderMode);
  addressBlock.hidden = orderMode !== "Delivery";
  clearFieldErrors();
});

document.getElementById("payOptions").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-pay]");
  if (!btn) return;
  payMethod = btn.dataset.pay;
  pickChoice(document.getElementById("payOptions"), "pay", payMethod);
  cashBlock.hidden = payMethod !== "Efectivo";
  clearFieldErrors();
});

function clearFieldErrors() {
  document.querySelectorAll(".field-error").forEach(el => el.classList.remove("field-error"));
  formError.hidden = true;
}

["custName", "custAddress"].forEach(id =>
  document.getElementById(id).addEventListener("input", clearFieldErrors));

/* Devuelve null si está todo OK, o el mensaje de lo que falta */
function validateOrder() {
  const name = document.getElementById("custName").value.trim();
  const address = document.getElementById("custAddress").value.trim();
  const faltan = [];

  if (!orderMode) {
    faltan.push("elegir cómo lo quieres");
    document.getElementById("modeOptions").classList.add("field-error");
  }
  if (!name) {
    faltan.push("tu nombre");
    document.getElementById("custName").classList.add("field-error");
  }
  if (orderMode === "Delivery" && !address) {
    faltan.push("tu dirección");
    document.getElementById("custAddress").classList.add("field-error");
  }
  if (!payMethod) {
    faltan.push("la forma de pago");
    document.getElementById("payOptions").classList.add("field-error");
  }

  if (!faltan.length) return null;
  return `Falta ${faltan.join(", ").replace(/, ([^,]*)$/, " y $1")} 😊`;
}

/* ===== CHECKOUT WHATSAPP ===== */
document.getElementById("checkoutBtn").addEventListener("click", () => {
  cart = sanitizeCart(cart);
  saveCart();
  if (!cart.length) return;

  clearFieldErrors();
  const problema = validateOrder();
  if (problema) {
    formError.textContent = problema;
    formError.hidden = false;
    const primero = document.querySelector(".field-error");
    primero.scrollIntoView({ block: "center", behavior: "smooth" });
    if (primero.tagName === "INPUT") primero.focus({ preventScroll: true });
    return;
  }

  const name = document.getElementById("custName").value.trim();
  const address = document.getElementById("custAddress").value.trim();
  const cashWith = document.getElementById("cashWith").value.trim();
  const subtotal = cart.reduce((s, i) => s + i.unit * i.qty, 0);
  const descuento = discountAmount(subtotal);
  const total = subtotal - descuento;

  let msg = "🍔 *NUEVO PEDIDO — LA JEFA DARKITCHEN*\n\n";

  cart.forEach((item) => {
    msg += `▪️ ${item.qty}x *${item.name}* — ${money(item.unit * item.qty)}\n`;
    if (item.bread) msg += `   🥖 ${item.bread}\n`;
    if (item.combo) msg += `   🍟 Combo (Classic Fries + ${item.comboDrink})\n`;
    (item.lines || []).forEach(l => { msg += `   ▫️ ${l}\n`; });
    if (item.note) msg += `   📝 ${item.note}\n`;
  });

  if (descuento) {
    msg += `\nSubtotal: ${money(subtotal)}`;
    msg += `\n🎟️ Descuento *${appliedCode}* (${DISCOUNTS[appliedCode].percent}%): -${money(descuento)}`;
  }
  msg += `\n💰 *Total: ${money(total)}*`;
  msg += orderMode === "Delivery" ? `\n_(sin incluir domicilio)_\n` : `\n`;

  const icono = { "Delivery": "🛵", "Retiro en local": "🏃", "Comer en el local": "🍽️" }[orderMode];
  msg += `\n👤 Nombre: ${name}`;
  msg += `\n${icono} Tipo: ${orderMode}`;
  if (orderMode === "Delivery") msg += `\n📍 Dirección: ${address}`;
  msg += `\n💳 Pago: ${payMethod}`;
  if (payMethod === "Efectivo" && cashWith) msg += ` (paga con ${cashWith})`;
  msg += `\n\n¡Gracias! Quedo atento(a) para confirmar mi pedido. 🐶`;

  const waUrl = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
  const ventana = window.open(waUrl, "_blank");

  if (!ventana) {
    /* El navegador bloqueó la ventana nueva: mandamos a WhatsApp en la misma
       pestaña para no perder el pedido. */
    window.location.href = waUrl;
    return;
  }

  /* Pedido enviado: vaciamos carrito y mostramos la página de gracias.
     Esa visita a /gracias es la que el contador usa para saber cuántos
     pedidos salieron de verdad (no solo cuántos miraron). */
  cart = [];
  saveCart();
  try { sessionStorage.setItem("lajefa-wa", waUrl); } catch (e) {}
  window.location.href = "gracias.html";
});

renderCart();

/* ===== ANTESALA DE LANZAMIENTO =====
   Portón con cuenta regresiva. Se puede espiar el menú, pero el carrito no
   se activa hasta la hora. Al llegar la hora todo se abre solo, sin que
   nadie toque nada. */
const gate = document.getElementById("gate");
const peekbar = document.getElementById("peekbar");
const preOrderBtn = document.getElementById("preOrderBtn");

const dos = (n) => String(n).padStart(2, "0");

function partesRestantes() {
  const ms = Math.max(faltaParaLanzar(), 0);
  const s = Math.floor(ms / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60 };
}

function textoCorto() {
  const { d, h, m, s } = partesRestantes();
  if (d > 0) return `${d}d ${dos(h)}h ${dos(m)}m`;
  if (h > 0) return `${dos(h)}h ${dos(m)}m ${dos(s)}s`;
  return `${dos(m)}m ${dos(s)}s`;
}

/* Enlace de WhatsApp con el producto que está mirando */
function waProducto(item) {
  const txt = `¡Hola La Jefa! 🐶 Quiero pedir *${item.name}* (${money(item.price)})`;
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(txt)}`;
}

function abrirLaWeb() {
  document.body.classList.remove("antesala");
  gate.hidden = true;
  peekbar.hidden = true;
  document.body.style.overflow = "";
}

function tickAntesala() {
  if (!enAntesala()) {                      // ¡llegó la hora!
    abrirLaWeb();
    clearInterval(relojAntesala);
    return;
  }
  const { d, h, m, s } = partesRestantes();
  document.getElementById("gDias").textContent = dos(d);
  document.getElementById("gHoras").textContent = dos(h);
  document.getElementById("gMin").textContent = dos(m);
  document.getElementById("gSeg").textContent = dos(s);
  document.getElementById("peekCount").textContent = textoCorto();
}

let relojAntesala;

if (enAntesala()) {
  document.body.classList.add("antesala");
  gate.hidden = false;
  document.body.style.overflow = "hidden";
  tickAntesala();
  relojAntesala = setInterval(tickAntesala, 1000);

  document.getElementById("peekBtn").addEventListener("click", () => {
    gate.hidden = true;                     // deja mirar el menú
    peekbar.hidden = false;
    document.body.style.overflow = "";
  });
}

/* ===== ABIERTO / CERRADO (hora Ecuador) ===== */
/* Horario: Lun-Sáb 15:30-22:00 · Domingo cerrado. Minutos desde medianoche. */
const SCHEDULE = { 0: null, 1: [930, 1320], 2: [930, 1320], 3: [930, 1320], 4: [930, 1320], 5: [930, 1320], 6: [930, 1320] };
const DAY_IDX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function ecuadorNow() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Guayaquil", hour12: false,
    weekday: "short", hour: "2-digit", minute: "2-digit",
  }).formatToParts(new Date());
  const get = (t) => parts.find(p => p.type === t).value;
  return { day: DAY_IDX[get("weekday")], mins: (+get("hour") % 24) * 60 + (+get("minute")) };
}

function updateStatus() {
  const { day, mins } = ecuadorNow();
  const banner = document.getElementById("closedBanner");
  const today = SCHEDULE[day];

  if (today && mins >= today[0] && mins < today[1]) {
    banner.hidden = true;
    return;
  }
  let when;
  if (today && mins < today[0]) when = "¡Hoy abrimos a las 3:30 PM!";
  else if (day === 6 || day === 0) when = "Abrimos el lunes a las 3:30 PM";
  else when = "Abrimos mañana a las 3:30 PM";
  document.getElementById("closedText").textContent = `Ya cerramos la cocina de La Jefa. ${when}`;
  banner.hidden = false;
}

updateStatus();
setInterval(updateStatus, 60000);

/* ===== PROMO DE LA SEMANA ===== */
/* Edita aquí la promo destacada. day: día en que aplica (1 = lunes). */
const PROMO = {
  active: true,
  itemId: "lunes",
  title: "Combo Lunes de La Jefa",
  desc: "1 La Lupita + 1 La Reina + 1 La Papiza + 1 Gaseosa de 1L por solo $9.99. Solo los lunes.",
  day: 1,
};

function updatePromo() {
  if (!PROMO.active) return;
  const sec = document.getElementById("promoSection");
  sec.hidden = false;
  document.getElementById("promoTitle").textContent = PROMO.title;
  document.getElementById("promoDesc").textContent = PROMO.desc;

  const { day, mins } = ecuadorNow();
  const el = document.getElementById("promoCount");
  if (day === PROMO.day && mins < 1320) {
    const left = 1320 - mins;
    el.innerHTML = `<strong>¡Es HOY!</strong> Termina en ${Math.floor(left / 60)}h ${left % 60}m`;
  } else {
    let days = (PROMO.day - day + 7) % 7;
    if (days === 0) days = 7;
    const hoursLeft = (days * 1440 - mins + 930) / 60;
    el.innerHTML = `Vuelve en <strong>${Math.floor(hoursLeft / 24)}d ${Math.round(hoursLeft % 24)}h</strong>`;
  }
}

updatePromo();
setInterval(updatePromo, 60000);

document.getElementById("promoBtn").addEventListener("click", () => openModal("combos", PROMO.itemId));

/* ===== RESEÑAS =====
   Reseñas REALES de Google Maps. Para agregar otra, copia una línea. */
const REVIEWS = [
  {
    name: "Dialex Herrera", stars: 5,
    text: "Excelentes hamburguesas, súper frescas y jugosas. Se nota que tienen ingredientes de calidad y el sabor exquisito. Súper recomendados.",
  },
  {
    name: "Sandra Villalba", stars: 5,
    text: "Excelentes hamburguesas y papas crujientes. Se puede comer en el lugar.",
  },
  {
    name: "Daniel Gaona", stars: 5,
    text: "Deliciosas. 100% recomendadas.",
  },
  {
    name: "Marco Valenzuela", stars: 5,
    text: "Todo excelente 💯",
  },
  {
    name: "Matías", stars: 5,
    text: "Comida 5 · Servicio 5 · Ambiente 5",
  },
];

const reviewsGrid = document.getElementById("reviewsGrid");
if (REVIEWS.length) {
  reviewsGrid.innerHTML = REVIEWS.map(r => `
    <div class="review-card">
      <div class="review-stars">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</div>
      <p class="review-text">${esc(r.text)}</p>
      <p class="review-name">— ${esc(r.name)}</p>
    </div>`).join("");
} else {
  reviewsGrid.hidden = true;
}

/* ===== QUIZ: ¿QUÉ BURGER ERES? ===== */
const QUIZ = [
  { q: "¿Cómo llegas al viernes?", a: [
    { t: "😌 Tranqui, sin drama", id: "lupita" },
    { t: "🔥 Con hambre de campeonato", id: "reina" },
    { t: "🎭 Full intensidad, lo quiero TODO", id: "consentida" },
    { t: "🏖️ Soñando con vacaciones", id: "brasil" },
  ]},
  { q: "Elige tu salsa de cabecera", a: [
    { t: "🤫 La secreta de Lupita, obvio", id: "lupita" },
    { t: "🍖 BBQ de la casa", id: "consentida" },
    { t: "🍍 Algo dulce y tropical", id: "brasil" },
    { t: "🧀 Queso y ya, soy simple", id: "cheeseburger" },
  ]},
  { q: "Tu plan perfecto", a: [
    { t: "📺 Serie + comida, solo/a", id: "cheeseburger" },
    { t: "🎉 Con toda la banda", id: "reina" },
    { t: "😏 Una cita que impresione", id: "consentida" },
    { t: "🌴 Modo playa mental", id: "brasil" },
  ]},
  { q: "Nivel de hambre ahora mismo", a: [
    { t: "🤏 Un antojito", id: "cheeseburger" },
    { t: "😋 Hambre normal de persona normal", id: "lupita" },
    { t: "💪 Doble o nada", id: "reina" },
    { t: "🌋 Apocalíptico", id: "consentida" },
  ]},
];

const quizModal = document.getElementById("quizModal");
const quizBody = document.getElementById("quizBody");
let quizStep = 0;
let quizScores = {};

function openQuiz() {
  quizStep = 0;
  quizScores = {};
  renderQuizStep();
  quizModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeQuiz() {
  quizModal.hidden = true;
  document.body.style.overflow = "";
}

function renderQuizStep() {
  const step = QUIZ[quizStep];
  quizBody.innerHTML = `
    <img src="images/brand/mascota.png" alt="" class="quiz-modal-mascot">
    <p class="quiz-progress">Pregunta ${quizStep + 1} de ${QUIZ.length}</p>
    <h3 class="quiz-q">${step.q}</h3>
    <div class="quiz-answers">
      ${step.a.map((ans, i) => `<button class="quiz-answer" data-ans="${i}">${ans.t}</button>`).join("")}
    </div>`;
}

function renderQuizResult() {
  const order = ["consentida", "reina", "brasil", "lupita", "cheeseburger"];
  const winner = order.reduce((best, id) =>
    (quizScores[id] || 0) > (quizScores[best] || 0) ? id : best, "lupita");
  const item = MENU.burgers.find(b => b.id === winner);
  quizBody.innerHTML = `
    <img src="images/brand/sticker-aprobado.png" alt="" class="quiz-modal-mascot">
    <p class="quiz-progress">Tu resultado</p>
    <h3 class="quiz-q">Eres <span class="quiz-result-name">${item.name}</span> ${item.emoji}</h3>
    <p class="quiz-result-desc">${item.desc}</p>
    <div class="quiz-result-actions">
      <button class="btn btn-coral btn-big" id="quizAddBtn">🍔 Pedirla ahora · ${money(item.price)}</button>
      <button class="btn btn-ghost-purple" id="quizRetryBtn">Repetir el test</button>
    </div>`;
  document.getElementById("quizAddBtn").addEventListener("click", () => {
    closeQuiz();
    openModal("burgers", winner);
  });
  document.getElementById("quizRetryBtn").addEventListener("click", openQuiz);
}

quizBody.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-ans]");
  if (!btn) return;
  const id = QUIZ[quizStep].a[+btn.dataset.ans].id;
  quizScores[id] = (quizScores[id] || 0) + 1;
  quizStep++;
  quizStep < QUIZ.length ? renderQuizStep() : renderQuizResult();
});

document.getElementById("quizBtn").addEventListener("click", openQuiz);
document.getElementById("quizClose").addEventListener("click", closeQuiz);
quizModal.addEventListener("click", (e) => { if (e.target === quizModal) closeQuiz(); });
