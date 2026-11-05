// Rumbo Cafetería · demo
import { initKit } from '../kit/kit.js?v=1';
import { precioLinea, tieneOpciones, tieneVariantes } from '../kit/core/variantes.js?v=1';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const html = document.documentElement;
const desktop = matchMedia('(min-width: 900px)');
const hoverFino = matchMedia('(hover: hover) and (pointer: fine)');
const calma = matchMedia('(prefers-reduced-motion: reduce)').matches;
const h12 = (h) => String(h || '').replace(/^0(\d)/, '$1');

// =========================================================
// INTRO: el punto traza el espiral, el logo se escribe una vez y se abre la puerta verde
// =========================================================
(function intro() {
  if (!html.classList.contains('con-intro')) { html.classList.add('listo'); return; }
  const t0 = performance.now();
  const minimo = desktop.matches ? 1900 : 1350;
  const heroImg = $('.hero__foto img');
  const imgLista = heroImg.complete ? Promise.resolve() : new Promise(r => { heroImg.addEventListener('load', r, { once: true }); heroImg.addEventListener('error', r, { once: true }); });
  const tope = new Promise(r => setTimeout(r, 2600));
  Promise.race([Promise.all([document.fonts?.ready, imgLista]), tope]).then(() => {
    const falta = Math.max(0, minimo - (performance.now() - t0));
    setTimeout(() => {
      html.classList.add('intro-abre');
      setTimeout(() => html.classList.add('listo'), 180);
      setTimeout(() => { html.classList.add('intro-fin'); $('.intro')?.remove(); }, 900);
    }, falta);
  });
})();

// =========================================================
// BARRA, MENÚ Y ENTRADAS
// =========================================================
const top = $('.top');
let ticking = false;
const pintarTop = () => { top.classList.toggle('is-solida', scrollY > 40 || !$('.menu-m').hidden); html.classList.toggle('paso-hero', scrollY > innerHeight * .6); ticking = false; };
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(pintarTop); } }, { passive: true });
pintarTop();

const menuBtn = $('.top__menu'), menu = $('#menu-m');
function toggleMenu(abrir = menu.hidden) {
  menu.hidden = !abrir; menuBtn.setAttribute('aria-expanded', String(abrir)); menuBtn.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
  menuBtn.innerHTML = abrir ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16M4 16h16"/></svg>';
  bloquear(abrir); pintarTop();
}
menuBtn.addEventListener('click', () => toggleMenu());
$$('a', menu).forEach(a => a.addEventListener('click', () => toggleMenu(false)));

const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
  es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } });
}, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' }) : null;
$$('.rv').forEach(el => io ? io.observe(el) : el.classList.add('visto'));

// bloqueo de scroll que anda en iPhone
let scrollGuardado = 0, bloqueos = 0;
function bloquear(si) {
  bloqueos = Math.max(0, bloqueos + (si ? 1 : -1));
  if (si && bloqueos === 1) { scrollGuardado = scrollY; Object.assign(document.body.style, { position: 'fixed', top: `-${scrollGuardado}px`, left: '0', right: '0' }); html.classList.add('pop-abierto'); }
  if (!si && bloqueos === 0) { Object.assign(document.body.style, { position: '', top: '', left: '', right: '' }); html.style.scrollBehavior = 'auto'; scrollTo(0, scrollGuardado); html.style.scrollBehavior = ''; html.classList.remove('pop-abierto'); }
}

// =========================================================
// TEMPLATE DE LA CARTA
// =========================================================
const chica = (src) => String(src || '').replace(/\.webp$/, '-s.webp');
const ETIQ = {
  casa: { label: 'De la casa' }, veggie: { label: 'Sin carne' },
  sintacc: { label: 'Sin TACC', icono: '<svg viewBox="0 0 24 24"><path d="M12 3v18M8 7c0 2 2 3 4 3M16 7c0 2-2 3-4 3M8 12c0 2 2 3 4 3M16 12c0 2-2 3-4 3M4 4l16 16" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>' },
  vegano: { label: 'Vegano', icono: '<svg viewBox="0 0 24 24"><path d="M20 4C10 4 4 9 4 16c0 2 1 4 1 4s2-7 9-10c-5 4-7 8-7 10 9 0 13-7 13-16Z" fill="currentColor"/></svg>' },
};
const conOpciones = (p) => tieneOpciones(p) || tieneVariantes(p) || (p.adicionales || []).length > 0;
function tplCarta(p, ctx) {
  const vs = tieneVariantes(p) ? p.variantes.filter(v => v.precio != null) : [];
  const precio = vs.length ? `desde ${ctx.money(vs[0].precio)}` : (ctx.money(p.precio) ?? '<span class="kit-price--na">Consultar</span>');
  const tags = (p.etiquetas || []).map(t => `<span class="it__tag">${esc(ETIQ[t]?.label || t)}</span>`).join('');
  const pedible = ctx.pedible(p);
  // un solo botón redondo para todo: no cambia de tamaño al sumar (la cantidad va en un globito)
  const boton = !pedible ? '' : `<button type="button" class="it__cal" data-calibrar="${esc(p.id)}" aria-label="Sumar ${esc(p.nombre)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg><i hidden></i></button>`;
  return `<div class="it__body"><h4 class="it__n">${esc(p.nombre)}${tags}</h4>${p.descripcion ? `<p class="it__d">${esc(p.descripcion)}</p>` : ''}${p.foto ? `<button type="button" class="it__ver" data-foto="${esc(ctx.asset(p.foto))}" data-nombre="${esc(p.nombre)}">Ver foto</button>` : ''}</div>
    <div class="it__side"><span class="it__p">${precio}</span>${boton}</div>`;
}

// =========================================================
// KIT
// =========================================================
const pendientes = []; let alCarta = null;
document.addEventListener('kit:carta', (e) => { alCarta ? alCarta(e) : pendientes.push(e); });
const kit = await initKit({
  config: 'cliente.json',
  imagenes: { lqip: 'img/lqip.json' },
  cartas: { 'carta-principal': { itemClass: 'it', template: tplCarta, etiquetas: ETIQ } },
  carrito: { label: 'Tu pedido' },
  badgeTexto: 'Probá el panel del local',
});
window.kitRumbo = kit;
const productos = new Map();
const money = (n) => kit.money(n);

// precios en el HTML (hero, promos) siempre desde la carta guardada
function pintarPrecios() {
  $$('[data-precio]').forEach(el => {
    const p = productos.get(el.dataset.precio); if (!p) return;
    const vs = tieneVariantes(p) ? p.variantes.filter(v => v.precio != null) : [];
    const v = vs.length ? vs[0].precio : p.precio; if (v != null) el.textContent = money(v);
  });
}

// ---------- carta: encabezado, anterior/siguiente, foto
const cartaEl = $('#carta-principal');
const META = {
  cafe: (n) => `${n} opciones · leche Oatly o de almendras +${money(1500)} · todo para llevar`,
  infusiones: (n) => `${n} opciones · tés en hebras de Pei Chen`,
  frios: (n) => `${n} opciones · para llevar`,
  promos: (n) => `${n} promos · café o té a elección`,
  cocina: (n) => `${n} opciones · consultá aptos vegetarianos, veganos y sin TACC`,
  pasteleria: (n) => `${n} opciones · consultá por la torta de la semana`,
  almuerzos: (n) => `${n} opciones · ${money(14000)} el plato, con promos de bebida y café`,
};
const catActual = () => $('.kit-tab.is-on', cartaEl)?.dataset.cat || 'cafe';
function pintarCabecera() {
  const tabs = $$('.kit-tab', cartaEl); const on = tabs.findIndex(t => t.classList.contains('is-on'));
  const cat = catActual();
  const panel = $('.kit-carta__panel:not([hidden])', cartaEl);
  const items = panel ? $$('.kit-item', panel) : [];
  $('.carta__sec').textContent = tabs[on]?.textContent || 'Café';
  $('.carta__meta').textContent = (META[cat] || ((k) => `${k} opciones`))(items.length);
  const prev = tabs[on - 1], next = tabs[on + 1];
  const [bp, bn] = $$('[data-carta-mover]');
  bp.disabled = !prev; bn.disabled = !next;
  bp.style.visibility = prev ? '' : 'hidden'; bn.style.visibility = next ? '' : 'hidden';
  $('[data-carta-prev]').textContent = prev ? prev.textContent : 'Anterior';
  $('[data-carta-next]').textContent = next ? (desktop.matches ? `Siguiente: ${next.textContent}` : next.textContent) : 'Siguiente';
  const def = items.find(i => i.dataset.photo); if (def) mostrarFoto(def);
  pintarBadges();
}
function mostrarFoto(item) {
  const p = productos.get(item?.dataset.id); if (!p?.foto) return;
  $$('.it.is-sel', cartaEl).forEach(x => x.classList.toggle('is-sel', x === item));
  const img = $('.aside__img img'), cap = $('.aside__foto figcaption');
  const src = kit.asset(p.foto);
  if (img.getAttribute('src') === src) return;
  img.classList.add('is-cambia');
  const pre = new Image(); pre.src = src;
  const listo = () => { img.src = src; img.alt = p.nombre; cap.textContent = p.nombre; requestAnimationFrame(() => img.classList.remove('is-cambia')); };
  pre.decode ? pre.decode().then(listo, listo) : (pre.onload = listo);
}
function onCarta(e) {
  (e.detail.productos || []).forEach(p => productos.set(p.id, p));
  if (e.detail.el === cartaEl) pintarCabecera();
  pintarPrecios(); if (bebidaActual >= 0) pintarPop(bebidaActual, false); pintarTicket();
}

cartaEl.addEventListener('click', (e) => {
  if (e.target.closest('.kit-tab')) { requestAnimationFrame(pintarCabecera); return; }
  const f = e.target.closest('[data-foto]'); if (f) { lightbox(f.dataset.foto, f.dataset.nombre); }
});
let hovT = 0;
cartaEl.addEventListener('pointerover', (e) => {
  if (!hoverFino.matches) return;
  const it = e.target.closest('.kit-item[data-photo]'); if (!it) return;
  clearTimeout(hovT); hovT = setTimeout(() => mostrarFoto(it), 80);
});
$$('[data-carta-mover]').forEach(b => b.addEventListener('click', () => {
  const tabs = $$('.kit-tab', cartaEl); const on = tabs.findIndex(t => t.classList.contains('is-on'));
  const dest = tabs[on + Number(b.dataset.cartaMover)]; if (!dest) return;
  dest.click();
  dest.scrollIntoView?.({ block: 'nearest', inline: 'center', behavior: calma ? 'auto' : 'smooth' });
  const cab = desktop.matches ? $('.carta__head') : $('.carta__grid'); const y = cab.getBoundingClientRect().top;
  if (y < 0 || y > innerHeight * .5) scrollTo({ top: scrollY + y - (desktop.matches ? 120 : 70), behavior: calma ? 'auto' : 'smooth' });
}));

// ---------- foto del plato en el celu
const lb = $('.lb');
function lightbox(src, nombre) {
  if (desktop.matches && hoverFino.matches) return;
  $('img', lb).src = src; $('img', lb).alt = nombre || ''; $('figcaption', lb).textContent = nombre || '';
  lb.hidden = false; bloquear(true); $('.lb__x', lb).focus();
}
function cerrarLb() { if (lb.hidden) return; lb.hidden = true; bloquear(false); }
lb.addEventListener('click', (e) => { if (e.target.closest('[data-lb-cerrar]')) cerrarLb(); });

// =========================================================
// CALIBRADOR: opciones de leche, extra shot, tamaño y combos
// =========================================================
const cal = $('.cal'), calForm = $('.cal__caja');
let calP = null, calCant = 1, calOrigen = null;
function abrirCal(id, origen) {
  const p = productos.get(id); if (!p) return;
  if (!conOpciones(p)) { kit.carrito.agregar(id, 1, { origen }); return; }
  calP = p; calCant = 1; calOrigen = origen;
  $('.cal__n', cal).textContent = p.nombre;
  $('.cal__d', cal).textContent = p.descripcion || '';
  $('.cal__k', cal).textContent = p.categoria === 'cafe' || p.categoria === 'infusiones' || p.categoria === 'frios' ? 'Calibralo a tu gusto' : 'Armalo a tu gusto';
  const g = [];
  const vs = tieneVariantes(p) ? p.variantes.filter(v => v.precio != null) : [];
  if (vs.length) g.push(`<fieldset class="cal__g"><legend>Tamaño</legend><div class="cal__chips">${vs.map((v, i) => `<label class="cal__chip"><input type="radio" name="variante" value="${esc(v.id)}" ${i ? '' : 'checked'}><span>${esc(v.nombre)} <small>${esc(money(v.precio))}</small></span></label>`).join('')}</div></fieldset>`);
  (p.opciones || []).forEach(o => g.push(`<fieldset class="cal__g"><legend>${esc(o.nombre)}</legend><div class="cal__chips">${o.valores.map((v, i) => `<label class="cal__chip"><input type="radio" name="o-${esc(o.id)}" data-grupo="${esc(o.id)}" value="${esc(v.id)}" ${i ? '' : 'checked'}><span>${esc(v.nombre)}${v.precio ? ` <small>+${esc(money(v.precio))}</small>` : ''}</span></label>`).join('')}</div></fieldset>`));
  if ((p.adicionales || []).length) g.push(`<fieldset class="cal__g"><legend>Sumale</legend><div class="cal__chips">${p.adicionales.map(a => `<label class="cal__chip"><input type="checkbox" name="extra" value="${esc(a.id)}"><span>${esc(a.nombre)} <small>+${esc(money(a.precio))}</small></span></label>`).join('')}</div></fieldset>`);
  $('.cal__grupos', cal).innerHTML = g.join('');
  pintarCal();
  cal.hidden = false; bloquear(true);
  setTimeout(() => $('.cal__x', cal).focus(), 40);
}
function eleccion() {
  const variante = $('input[name="variante"]:checked', cal)?.value;
  const opc = {}; $$('input[data-grupo]:checked', cal).forEach(i => { opc[i.dataset.grupo] = i.value; });
  const extras = $$('input[name="extra"]:checked', cal).map(i => i.value);
  return { variante, opc, extras };
}
function pintarCal() {
  const pl = precioLinea(calP, eleccion());
  $('.cal__cant output', cal).textContent = calCant;
  $('.cal__ok span', cal).textContent = money((pl.precio || 0) * calCant);
}
function cerrarCal() { if (cal.hidden) return; cal.hidden = true; bloquear(false); }
cal.addEventListener('change', pintarCal);
cal.addEventListener('click', (e) => {
  if (e.target.closest('[data-cal-cerrar]')) { cerrarCal(); return; }
  const b = e.target.closest('[data-cal-cant]'); if (b) { calCant = Math.max(1, Math.min(20, calCant + Number(b.dataset.calCant))); pintarCal(); }
});
calForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const el = eleccion(); const origen = calOrigen;
  cerrarCal();
  kit.carrito.agregar(calP.id, calCant, { ...el, origen: origen?.isConnected ? origen : null });
});
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-calibrar]'); if (!b) return;
  abrirCal(b.dataset.calibrar, b);
});

// cuántos hay en el pedido de cada producto con opciones (badge en su botón, sin mover nada)
function pintarBadges() {
  const c = kit.carrito.calc(); const n = {};
  (c.items || []).forEach(i => { n[i.id] = (n[i.id] || 0) + i.cant; });
  $$('.it__cal').forEach(b => { const k = n[b.dataset.calibrar] || 0; const i = $('i', b); i.hidden = !k; i.textContent = k; });
}

// =========================================================
// TICKET: el pedido se imprime y se escribe como mensaje de WhatsApp
// =========================================================
const tkItems = $('[data-tk-items]'), tkMsg = $('[data-tk-msg]');
let tkPrevio = '';
const K = (i) => `${i.id}|${i.detalle || ''}`;
function pintarTicket() {
  const c = kit.carrito.calc(); const items = c.items || [];
  const firma = items.map(i => `${K(i)}:${i.cant}`).join('|');
  const nuevos = new Set(items.filter(i => !tkPrevio.includes(`${K(i)}:`)).map(i => K(i)));
  tkPrevio = firma;
  tkItems.innerHTML = items.map(i => `<li${nuevos.has(K(i)) ? '' : ' style="animation:none"'}><span>${i.cant} × ${esc(i.nombre)}${i.detalle ? `<small>${esc(i.detalle)}</small>` : ''}</span><b>${i.precio != null ? esc(money(i.subtotal)) : 'a confirmar'}</b></li>`).join('');
  $('[data-tk-vacio]').hidden = items.length > 0;
  $('[data-tk-tot]').hidden = !items.length;
  $('[data-tk-total]').textContent = money(c.total || 0);
  $('[data-tk-ir]').disabled = !items.length;
  if (!items.length) { tkMsg.innerHTML = 'Hola Rumbo, quiero retirar:<br>1 Flat White (Avena Oatly)<br>2 Medialuna de Manteca<br>Total $12.500 · paso a las 10:45 hs'; tkMsg.classList.add('is-vacia'); }
  else {
    tkMsg.classList.remove('is-vacia');
    tkMsg.innerHTML = `Hola Rumbo, quiero retirar:<br>${items.map(i => `${i.cant} ${esc(i.nombre)}${i.detalle ? ` (${esc(i.detalle)})` : ''}`).join('<br>')}<br><b>Total ${esc(money(c.total))}</b> · paso lo antes posible`;
  }
}

// contador en la barra
function pintarContador(bump = false) {
  const n = (kit.carrito.calc().items || []).reduce((s, i) => s + i.cant, 0);
  const b = $('.top__n'); b.hidden = !n; b.textContent = n;
  if (bump) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
  $('.top__carro').setAttribute('aria-label', n ? `Ver tu pedido (${n})` : 'Ver tu pedido');
}
document.addEventListener('kit:carrito', (e) => { pintarContador((e.detail?.delta || 0) > 0); pintarTicket(); pintarBadges(); });
kit.carrito.listo?.then(() => { pintarContador(); pintarTicket(); pintarBadges(); });

// =========================================================
// LA BRÚJULA: grande y centrada; la info aparece en el centro (tamaño fijo, nada se mueve)
// =========================================================
const BEBIDAS = [
  { id: 'doppio', label: 'Doppio', ml: 'Dos shots' },
  { id: 'flat-white', label: 'Flat white', ml: '160 ml' },
  { id: 'latte', label: 'Latte', ml: '240 ml' },
  { id: 'filtrado', label: 'Filtrado V60', ml: '220 o 440 ml' },
  { id: 'latte-frio', label: 'Latte frío', ml: '300 ml' },
  { id: 'chai-latte', label: 'Chai latte', ml: '240 ml', tinta: 'rgba(185, 135, 90, .55)' },
  { id: 'matcha-latte', label: 'Matcha', ml: '240 ml', tinta: 'rgba(141, 166, 90, .55)' },
  { id: 'cappuccino', label: 'Cappuccino', ml: '160 ml' },
];
const dial = $('.dial'), puntos = $('.dial__puntos'), aguja = $('.dial__aguja'), pop = $('.pop');
const N = BEBIDAS.length, PASO = 360 / N;
let bebidaActual = -1, angulo = 0;
puntos.innerHTML = BEBIDAS.map((b, i) => `<button type="button" class="dial__p" data-i="${i}" aria-pressed="false">${esc(b.label)}</button>`).join('');
$('.dial__marcas').innerHTML = Array.from({ length: N * 4 }, (_, k) => { const a = (k * 360 / (N * 4) - 90) * Math.PI / 180; const r1 = k % 4 ? 186 : 176; return `<line x1="${200 + Math.cos(a) * r1}" y1="${200 + Math.sin(a) * r1}" x2="${200 + Math.cos(a) * 194}" y2="${200 + Math.sin(a) * 194}"/>`; }).join('');
function ubicarPuntos() {
  const tam = dial.getBoundingClientRect().width || 360;
  const r = tam * .425;
  $$('.dial__p', puntos).forEach((b, i) => {
    const a = (i * PASO - 90) * Math.PI / 180;
    b.style.setProperty('--x', `${Math.cos(a) * r}px`); b.style.setProperty('--y', `${Math.sin(a) * r}px`);
  });
}
ubicarPuntos(); addEventListener('resize', () => requestAnimationFrame(ubicarPuntos), { passive: true });
const TAZA = `<svg viewBox="0 0 64 64" fill="none" stroke="#E0A858" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 24h34v10a17 17 0 0 1-34 0V24Z" fill="#E0A858" fill-opacity=".25"/><path d="M46 28h4a6 6 0 0 1 0 12h-5"/><path d="M8 56h44"/><path d="M22 10c-2 3 2 5 0 8M30 8c-2 3 2 5 0 8M38 10c-2 3 2 5 0 8"/></svg>`;
function pintarPop(i, animar = true) {
  if (i < 0) return;
  const b = BEBIDAS[i]; const p = productos.get(b.id);
  $$('.dial__p', puntos).forEach((x, k) => { x.classList.toggle('is-on', k === i); x.setAttribute('aria-pressed', String(k === i)); });
  const primera = pop.hidden;
  const aplicar = () => {
    $('.pop__n', pop).textContent = p?.nombre?.replace(/ · .*$/, '') || b.label;
    const vs = p && tieneVariantes(p) ? p.variantes.filter(v => v.precio != null) : [];
    $('.pop__ml span', pop).textContent = b.ml;
    $('.pop__ml b', pop).textContent = p ? (vs.length ? `desde ${money(vs[0].precio)}` : (money(p.precio) || 'Consultar')) : '';
    $('.pop__d', pop).textContent = p?.descripcion || '';
    $('.pop__sumar', pop).dataset.calibrar = b.id;
    $('.pop__sumar', pop).setAttribute('aria-label', `Sumar ${b.label} a tu pedido`);
    const img = $('.pop__foto img', pop), taza = $('.pop__taza', pop);
    if (p?.foto) { img.hidden = false; taza.hidden = true; img.src = kit.asset(p.foto); img.alt = p.nombre; }
    else { img.hidden = true; taza.hidden = false; taza.style.setProperty('--tinta-taza', b.tinta || 'rgba(201, 151, 78, .4)'); taza.innerHTML = TAZA; }
    pop.classList.remove('is-cambia');
  };
  if (primera) { aplicar(); pop.hidden = false; dial.classList.add('is-elegida'); return; }
  if (!animar || calma) { aplicar(); return; }
  pop.classList.add('is-cambia');
  setTimeout(aplicar, 180);
}
function irA(i, animar = true) {
  i = ((i % N) + N) % N;
  let d = i * PASO - (angulo % 360); if (d > 180) d -= 360; if (d < -180) d += 360;
  angulo += d; aguja.style.setProperty('--ang', `${angulo}deg`);
  if (i !== bebidaActual) { bebidaActual = i; pintarPop(i, animar); }
}
puntos.addEventListener('click', (e) => { const b = e.target.closest('.dial__p'); if (b && !arrastro) irA(Number(b.dataset.i)); });
let hovT2 = 0;
puntos.addEventListener('pointerover', (e) => {
  if (!hoverFino.matches || arrastrando) return;
  const b = e.target.closest('.dial__p'); if (!b) return;
  clearTimeout(hovT2); hovT2 = setTimeout(() => irA(Number(b.dataset.i)), 60);
});
// girar la aguja con el dedo o el mouse (desde el aro, no desde el centro: ahí está el botón Sumar)
let arrastrando = false, arrastro = false, inicio = null;
const anguloDe = (e) => { const r = dial.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI + 90; };
dial.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || e.target.closest('.dial__centro button')) return;
  inicio = { x: e.clientX, y: e.clientY, id: e.pointerId }; arrastro = false;
});
dial.addEventListener('pointermove', (e) => {
  if (!inicio || e.pointerId !== inicio.id) return;
  const dx = e.clientX - inicio.x, dy = e.clientY - inicio.y;
  if (!arrastrando) {
    if (Math.hypot(dx, dy) < 8) return;
    if (e.pointerType !== 'mouse' && Math.abs(dy) > Math.abs(dx) * 1.2) { inicio = null; return; }
    arrastrando = true; arrastro = true; dial.classList.add('is-arrastra'); dial.setPointerCapture(e.pointerId);
  }
  e.preventDefault();
  let d = anguloDe(e) - (angulo % 360); if (d > 180) d -= 360; if (d < -180) d += 360; angulo += d;
  aguja.style.setProperty('--ang', `${angulo}deg`);
  const i = ((Math.round(angulo / PASO) % N) + N) % N;
  if (i !== bebidaActual) { bebidaActual = i; pintarPop(i); }
});
const soltar = () => {
  if (arrastrando) { dial.classList.remove('is-arrastra'); irA(Math.round(angulo / PASO)); }
  arrastrando = false; inicio = null; setTimeout(() => { arrastro = false; }, 30);
};
dial.addEventListener('pointerup', soltar); dial.addEventListener('pointercancel', soltar);
puntos.addEventListener('keydown', (e) => {
  if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
  e.preventDefault(); const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1; irA(Math.max(bebidaActual, 0) + d); $$('.dial__p', puntos)[bebidaActual].focus();
});
// chips del hero → la brújula con esa bebida
$$('[data-ir-bebida]').forEach(a => a.addEventListener('click', () => { const i = BEBIDAS.findIndex(b => b.id === a.dataset.irBebida); if (i >= 0) setTimeout(() => irA(i), 450); }));

// =========================================================
// FILAS DESLIZABLES: arrastre con el mouse desde cualquier parte
// =========================================================
$$('[data-fila]').forEach(fila => {
  let x0 = 0, s0 = 0, activo = false, movio = false, v = 0, ultX = 0, ultT = 0, raf = 0;
  const usable = () => getComputedStyle(fila).overflowX === 'auto';
  fila.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !usable()) return;
    if (e.target.closest('button, a, input')) return;
    cancelAnimationFrame(raf); activo = true; movio = false; x0 = ultX = e.clientX; s0 = fila.scrollLeft; ultT = performance.now(); v = 0;
  });
  addEventListener('pointermove', (e) => {
    if (!activo) return;
    const dx = e.clientX - x0;
    if (!movio && Math.abs(dx) > 4) { movio = true; fila.classList.add('is-arrastra'); }
    if (!movio) return;
    e.preventDefault();
    fila.scrollLeft = s0 - dx;
    const t = performance.now(); v = (e.clientX - ultX) / Math.max(1, t - ultT); ultX = e.clientX; ultT = t;
  });
  addEventListener('pointerup', () => {
    if (!activo) return; activo = false;
    if (!movio) return;
    // inercia corta y después vuelve el snap
    let vel = -v * 16;
    const paso = () => { fila.scrollLeft += vel; vel *= .92; if (Math.abs(vel) > .5) raf = requestAnimationFrame(paso); else fila.classList.remove('is-arrastra'); };
    raf = requestAnimationFrame(paso);
  });
  fila.addEventListener('click', (e) => { if (movio) { e.preventDefault(); e.stopPropagation(); movio = false; } }, true);
  fila.addEventListener('dragstart', (e) => e.preventDefault());
});

// =========================================================
// ABIERTO AHORA, HORARIOS Y MAPA
// =========================================================
const DIAS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
const NOMBRE = { dom: 'el domingo', lun: 'el lunes', mar: 'el martes', mie: 'el miércoles', jue: 'el jueves', vie: 'el viernes', sab: 'el sábado' };
function proximaApertura() {
  const H = kit.config.horarios; const hoy = new Date(kit.hoy() + 'T12:00:00Z').getUTCDay();
  for (let i = 1; i <= 7; i++) { const d = DIAS[(hoy + i) % 7]; if ((H[d] || []).length) return { dia: i === 1 ? 'mañana' : NOMBRE[d], hora: h12(H[d][0][0]) }; }
  return null;
}
function pintarAbierto() {
  const e = kit.abierto();
  let corto, largo;
  if (e.abierto) { corto = `Abierto · hasta las ${h12(e.cierra)} hs`; largo = `Abierto ahora · cerramos a las ${h12(e.cierra)} hs`; }
  else if (e.abre) { corto = `Abrimos a las ${h12(e.abre)} hs`; largo = `Cerrado ahora · abrimos hoy a las ${h12(e.abre)} hs`; }
  else { const p = proximaApertura(); corto = p ? `Abrimos ${p.dia} a las ${p.hora} hs` : 'Cerrado'; largo = p ? `Cerrado ahora · abrimos ${p.dia} a las ${p.hora} hs` : 'Cerrado'; }
  $$('[data-abierto]').forEach(el => { el.classList.toggle('is-cerrado', !e.abierto); $('span', el).textContent = corto; });
  $$('[data-abierto-largo]').forEach(el => { el.classList.toggle('is-cerrado', !e.abierto); $('span', el).textContent = largo; });
  const d = DIAS[new Date(kit.hoy() + 'T12:00:00Z').getUTCDay()];
  $$('[data-horas] li').forEach(li => li.classList.toggle('is-hoy', li.dataset.dia === d));
}
pintarAbierto(); setInterval(pintarAbierto, 60_000);
const mapa = $('.donde__mapa iframe');
if (mapa) {
  const cargar = () => { if (mapa.dataset.src) { mapa.src = mapa.dataset.src; delete mapa.dataset.src; } };
  if (io) { const mo = new IntersectionObserver((es) => { if (es.some(x => x.isIntersecting)) { cargar(); mo.disconnect(); } }, { rootMargin: '600px 0px' }); mo.observe(mapa); } else cargar();
}

// =========================================================
// CONFIRMACIÓN PROPIA: "Te lo estamos calibrando"
// =========================================================
const ok = $('.ok');
const DIAS_L = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
function cuandoTexto(r) {
  if (!r?.fecha) return 'Te avisamos cuando esté listo.';
  const [, m, d] = r.fecha.split('-').map(Number);
  const dia = r.fecha === kit.hoy() ? 'hoy' : `el ${DIAS_L[new Date(r.fecha + 'T12:00:00Z').getUTCDay()]} ${d}/${m}`;
  const f = r.franja || {};
  if (f.asap || f.id === 'asap') return `Retirás <b>lo antes posible</b>, ${dia}${f.desde ? ` (~${esc(h12(f.desde))} hs)` : ''}`;
  if (f.desde && f.desde === f.hasta) return `Retirás <b>${dia} a las ${esc(h12(f.desde))} hs</b>`;
  return `Retirás <b>${dia}</b>`;
}
document.addEventListener('kit:exito', (e) => {
  const d = e.detail; if (!['enviado', 'aprobado'].includes(d.estado)) return;
  e.preventDefault();
  const p = d.pedido || {};
  $('.ok__cod', ok).textContent = `PEDIDO #${d.codigo || p.codigo || ''}`;
  $('.ok__cuando', ok).innerHTML = `${cuandoTexto(p.retiro)} en Freire 2599${p.cliente?.nombre ? ` · ${esc(p.cliente.nombre)}` : ''}`;
  $('.ok__items', ok).innerHTML = (p.items || []).map(i => `<li>${i.cant} × ${esc(i.nombre)}${i.detalle ? ` <small>(${esc(i.detalle)})</small>` : ''}</li>`).join('');
  $('.ok__pago', ok).textContent = d.estado === 'aprobado' ? 'Pagado con Mercado Pago (pago de prueba).' : 'Pagás al retirar.';
  $('.ok__sub', ok).textContent = d.estado === 'aprobado' ? 'Ya está en el panel del local.' : 'Ya está en el panel del local. Si se abrió WhatsApp, mandá el mensaje para confirmarlo.';
  const wa = $('[data-ok-wa]', ok); wa.hidden = !d.waUrl; if (d.waUrl) wa.href = d.waUrl;
  ok.hidden = false; bloquear(true);
  setTimeout(() => $('.cal__x', ok).focus(), 50);
});
function cerrarOk() { if (ok.hidden) return; ok.hidden = true; bloquear(false); }
ok.addEventListener('click', (e) => { if (e.target.closest('[data-ok-cerrar]')) cerrarOk(); });

// la carta que llegó mientras arrancaba el kit
alCarta = onCarta; pendientes.splice(0).forEach(onCarta);

addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!cal.hidden) cerrarCal(); else if (!lb.hidden) cerrarLb(); else if (!ok.hidden) cerrarOk(); else if (!menu.hidden) toggleMenu(false);
});
