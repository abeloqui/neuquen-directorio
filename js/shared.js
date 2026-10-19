'use strict';
/* Utilidades compartidas entre el mapa público (app.js) y el panel (admin.js). */

// Categorías: clave → nombre, color del marcador y emoji.
const CATS = {
  comercio:  { n: 'Comercio',             c: '#c2410c', e: '🛍️' },
  feria:     { n: 'Feria / Mercado',      c: '#b45309', e: '🧺' },
  comedor:   { n: 'Comedor / Merendero',  c: '#be123c', e: '🍲' },
  hogar:     { n: 'Hogar / Refugio',      c: '#7c3aed', e: '🏠' },
  seguridad: { n: 'Seguridad',            c: '#1d4ed8', e: '🛡️' },
  salud:     { n: 'Salud',                c: '#047857', e: '✚' },
  reciclaje: { n: 'Reciclaje / Ambiente', c: '#15803d', e: '♻️' },
  cultura:   { n: 'Cultura y Educación',  c: '#0e7490', e: '📚' },
  mutual:    { n: 'Mutual / Cooperativa', c: '#a21caf', e: '🤝' },
  otros:     { n: 'Otros servicios',      c: '#475569', e: '📍' }
};

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hhmm = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');

/* Horarios: texto "1-5 08:30-20:00; 6 09:00-13:00" (0=domingo … 6=sábado).
   Se admiten rangos de días que cruzan el domingo, ej. "5-0". */
function parseHorarios(s) {
  return (s || '').split(';').map(x => x.trim()).filter(Boolean).map(x => {
    const m = x.match(/^(\d)(?:-(\d))?\s+(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const [, d1, d2, h1, m1, h2, m2] = m, dias = [];
    for (let i = +d1, fin = d2 === undefined ? +d1 : +d2; ; i = (i + 1) % 7) { dias.push(i); if (i === fin) break; }
    return { d: dias, a: +h1 * 60 + +m1, b: +h2 * 60 + +m2 };
  }).filter(Boolean);
}

/* Texto legible de los horarios, una línea por tramo. */
const horarioTexto = s => (s || '').split(';').map(x => x.trim()).filter(Boolean).map(x =>
  x.replace(/^(\d)-(\d)/, (_, a, b) => DIAS[a] + ' a ' + DIAS[b]).replace(/^(\d)\s/, (_, a) => DIAS[a] + ' ').replace('-', '–'));

/* Estado actual: abierto | pronto (cierra en ≤60 min) | cerrado | sd (sin datos). */
function estado(l, ahora = new Date()) {
  if (l.h24) return { k: 'abierto', t: 'Abierto 24 h' };
  const tramos = parseHorarios(l.horarios);
  if (!tramos.length) return { k: 'sd', t: 'Horario sin datos' };
  const dia = ahora.getDay(), min = ahora.getHours() * 60 + ahora.getMinutes();
  for (const r of tramos) if (r.d.includes(dia) && min >= r.a && min < r.b)
    return r.b - min <= 60 ? { k: 'pronto', t: `Cierra en ${r.b - min} min` } : { k: 'abierto', t: `Abierto hasta ${hhmm(r.b)}` };
  return { k: 'cerrado', t: 'Cerrado' };
}

/* Distancia en metros entre dos coordenadas (fórmula de Haversine). */
function distancia(la1, lo1, la2, lo2) {
  const R = 6371e3, r = Math.PI / 180, x = (la2 - la1) * r, y = (lo2 - lo1) * r;
  const h = Math.sin(x / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(y / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const fmtDist = m => m < 1000 ? Math.round(m / 10) * 10 + ' m' : (m / 1000).toFixed(1) + ' km';
