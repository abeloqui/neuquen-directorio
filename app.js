'use strict';
/* Directorio Comunitario de Neuquén — lógica del mapa público.
   Todo se procesa en el navegador: la ubicación NUNCA se envía a ningún servidor. */
const $ = s => document.querySelector(s);
const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const leer = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const aviso = t => { $('#aviso').textContent = t; };

const st = { lugares: [], cat: 'todos', q: '', est: 'todos', orden: 'nombre', pos: null, favs: new Set(leer('favs', [])) };

/* ---------- Mapa ---------- */
const map = L.map('map', { zoomControl: false }).setView([-38.9516, -68.0591], 13);
L.control.zoom({ position: 'bottomright' }).addTo(map);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
const capa = L.layerGroup().addTo(map);
let yo = null;

const icono = l => {
  const c = CATS[l.categoria] || CATS.otros;
  return L.divIcon({ className: '', html: `<div class="pin" style="--c:${c.c}"><span>${c.e}</span></div>`, iconSize: [34, 34], iconAnchor: [17, 40] });
};

/* ---------- Datos ---------- */
async function cargar() {
  // ?borrador en la URL muestra los cambios hechos en el panel antes de publicarlos.
  if (location.search.includes('borrador')) { const d = leer('draft_lugares', null); if (Array.isArray(d)) return d; }
  return (await (await fetch('lugares.json')).json()).lugares;
}

/* ---------- Filtros + render ---------- */
function render() {
  const q = norm(st.q);
  const r = st.lugares.filter(l => {
    const k = estado(l).k;
    return (st.cat === 'todos' || (st.cat === 'fav' ? st.favs.has(l.id) : l.categoria === st.cat))
      && (!q || norm([l.nombre, l.subtipo, l.barrio, l.direccion, l.descripcion].join(' ')).includes(q))
      && (st.est === 'todos' || k === st.est || (st.est === 'abierto' && k === 'pronto'));
  });
  r.forEach(l => { l._d = st.pos ? distancia(st.pos.lat, st.pos.lng, l.lat, l.lng) : null; });
  r.sort(st.orden === 'distancia' && st.pos ? (a, b) => a._d - b._d : (a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  $('#cuenta').textContent = r.length + (r.length === 1 ? ' lugar' : ' lugares');
  $('#res').innerHTML = r.length ? r.map(item).join('')
    : '<li class="vacio">No encontramos lugares con esos filtros. Probá otra categoría o borrá la búsqueda.</li>';
  capa.clearLayers();
  r.forEach(l => L.marker([l.lat, l.lng], { icon: icono(l), title: l.nombre }).on('click', () => abrir(l.id)).addTo(capa));
}

const item = l => {
  const e = estado(l), c = CATS[l.categoria] || CATS.otros;
  return `<li><button class="it" data-id="${esc(l.id)}"><i class="dot" style="background:${c.c}">${c.e}</i>
    <span class="tx"><b>${st.favs.has(l.id) ? '♥ ' : ''}${esc(l.nombre)}</b>
    <small>${esc(l.subtipo || c.n)}${l.barrio ? ' – ' + esc(l.barrio) : ''}</small>
    <em class="b ${e.k}">${esc(e.t)}</em></span>${l._d != null ? `<span class="ds">${fmtDist(l._d)}</span>` : ''}</button></li>`;
};

/* ---------- Ficha detallada ---------- */
function abrir(id) {
  const l = st.lugares.find(x => x.id === id); if (!l) return;
  const e = estado(l), c = CATS[l.categoria] || CATS.otros, tel = (l.telefono || '').replace(/[^\d+]/g, '');
  const hor = l.h24 ? 'Las 24 horas' : horarioTexto(l.horarios).map(esc).join('<br>') || 'Sin datos';
  $('#ficha').innerHTML = `<button class="x" data-x aria-label="Cerrar">✕</button>
    <h2>${esc(l.nombre)}</h2><p class="sub">${c.e} ${esc(l.subtipo || c.n)}</p>
    <p><span class="b ${e.k}">${esc(e.t)}</span>${st.pos ? ` <span class="ds">a ${fmtDist(distancia(st.pos.lat, st.pos.lng, l.lat, l.lng))}</span>` : ''}</p>
    ${l.descripcion ? `<p>${esc(l.descripcion)}</p>` : ''}
    <dl><dt>Dirección</dt><dd>${esc(l.direccion)}${l.barrio ? ', ' + esc(l.barrio) : ''}</dd><dt>Horarios</dt><dd>${hor}</dd>
    ${Object.entries(l.extra || {}).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
    ${l.fuente ? `<p class="fuente">Fuente: ${esc(l.fuente)}</p>` : ''}
    <div class="acc">${tel ? `<a class="btn" href="tel:${esc(tel)}">Llamar</a>` : ''}
    ${l.whatsapp ? `<a class="btn wa" href="https://wa.me/${esc(l.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
    ${l.web ? `<a class="btn" href="${esc(l.web)}" target="_blank" rel="noopener">Sitio web</a>` : ''}
    <a class="btn" href="https://www.openstreetmap.org/?mlat=${l.lat}&mlon=${l.lng}#map=18/${l.lat}/${l.lng}" target="_blank" rel="noopener">Cómo llegar</a>
    <button class="btn" data-fav="${esc(l.id)}">${st.favs.has(l.id) ? '♥ Quitar de favoritos' : '♡ Guardar'}</button></div>`;
  $('#ficha').show();
  map.flyTo([l.lat, l.lng], Math.max(map.getZoom(), 16), { duration: .6 });
}

/* ---------- Geolocalización (solo en el navegador) ---------- */
function ubicar() {
  if (!navigator.geolocation) return aviso('Tu navegador no permite usar la ubicación. Podés seguir usando el mapa.');
  aviso('Buscando tu ubicación…');
  navigator.geolocation.getCurrentPosition(p => {
    st.pos = { lat: p.coords.latitude, lng: p.coords.longitude };
    if (yo) yo.remove();
    yo = L.layerGroup([
      L.circle([st.pos.lat, st.pos.lng], { radius: p.coords.accuracy, weight: 1, opacity: .4, fillOpacity: .08 }),
      L.marker([st.pos.lat, st.pos.lng], { icon: L.divIcon({ className: '', html: '<div class="yo"></div>', iconSize: [18, 18] }), zIndexOffset: 1000 })
        .bindTooltip('Estás aquí', { permanent: true, direction: 'top', offset: [0, -8] })
    ]).addTo(map);
    map.flyTo([st.pos.lat, st.pos.lng], 15);
    st.orden = 'distancia'; $('#orden').value = 'distancia';
    aviso(''); render();
  }, err => aviso(err.code === 1
    ? 'No diste permiso para usar tu ubicación. Podés seguir usando el mapa; si querés activarla, tocá el candado de la barra del navegador.'
    : 'No pudimos obtener tu ubicación. Probá de nuevo o seguí usando el mapa.'),
  { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
}

/* ---------- Eventos ---------- */
$('#chips').innerHTML = [['todos', 'Todos'], ['fav', '♥ Favoritos'], ...Object.entries(CATS).map(([k, c]) => [k, c.e + ' ' + c.n])]
  .map(([k, t]) => `<button data-k="${k}" aria-pressed="${k === 'todos'}">${esc(t)}</button>`).join('');
$('#chips').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  st.cat = b.dataset.k; $('#chips').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); render();
};
$('#q').oninput = e => { st.q = e.target.value; render(); };
$('#est').onchange = e => { st.est = e.target.value; render(); };
$('#orden').onchange = e => { st.orden = e.target.value; if (st.orden === 'distancia' && !st.pos) ubicar(); render(); };
$('#btnLoc').onclick = ubicar;
$('#res').onclick = e => { const b = e.target.closest('[data-id]'); if (b) abrir(b.dataset.id); };
$('#ficha').onclick = e => {
  if (e.target.closest('[data-x]')) $('#ficha').close();
  const f = e.target.closest('[data-fav]');
  if (f) { const id = f.dataset.fav; st.favs.has(id) ? st.favs.delete(id) : st.favs.add(id); localStorage.setItem('favs', JSON.stringify([...st.favs])); abrir(id); render(); }
};
$('#btnTema').onclick = () => {
  const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = t; localStorage.setItem('tema', t);
};
document.documentElement.dataset.theme = localStorage.getItem('tema') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

/* ---------- Inicio ---------- */
(async () => {
  try { st.lugares = await cargar(); } catch { aviso('No pudimos cargar los lugares. Revisá tu conexión.'); }
  render();
  setInterval(render, 60000); // refresca "abierto/cerrado" cada minuto
  // Si el usuario ya dio permiso antes, centramos solos; si no, esperamos al botón (sin pedir permiso de golpe).
  navigator.permissions?.query({ name: 'geolocation' }).then(p => p.state === 'granted' && ubicar()).catch(() => {});
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
})();
