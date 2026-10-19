'use strict';
/* Importador del CSV "Espacios culturales del Neuquén" (ODAFyC) — Portal de Datos Abiertos del Neuquén, licencia CC BY 4.0.
   Requiere shared.js (distancia). Todo ocurre en el navegador. */
const FUENTE_ODAFYC = 'ODAFyC – Portal de Datos Abiertos del Neuquén (CC BY 4.0)';
const sinTildes = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

/* CSV con separador ";", comillas dobles y saltos de línea dentro de campos entrecomillados. */
function parseCSV(t, sep = ';') {
  t = t.replace(/^\uFEFF/, '');
  const filas = []; let r = [], c = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; }
    else if (ch === '"') q = true;
    else if (ch === sep) { r.push(c); c = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; r.push(c); c = ''; filas.push(r); r = []; }
    else c += ch;
  }
  if (c || r.length) { r.push(c); filas.push(r); }
  return filas.filter(x => x.some(v => v.trim()));
}

/* Convierte el CSV a lugares, descartando filas sin coordenadas válidas o con ubicación dudosa. */
function leerOdafyc(txt) {
  const [h, ...f] = parseCSV(txt), ix = n => h.findIndex(x => sinTildes(x).startsWith(sinTildes(n)));
  const c = { id: ix('ID'), nom: ix('Nombre'), esp: ix('Espacios'), acc: ix('Acceso'), dep: ix('Dependencia'), loc: ix('Localidad'), dom: ix('Domicilio'), ll: ix('Latitud') };
  if (Object.values(c).some(i => i < 0)) throw new Error('Columnas no reconocidas');
  let malos = 0; const filas = [];
  f.forEach(r => {
    const g = i => (r[i] || '').trim();
    const m = g(c.ll).match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/), lat = m && +m[1], lng = m && +m[2];
    // Debe caer dentro de la provincia del Neuquén (aprox.)
    if (!m || lat < -41.2 || lat > -36.5 || lng < -71.9 || lng > -67.9) { malos++; return; }
    const loc = g(c.loc);
    filas.push({ id: 'odafyc-' + g(c.id), nombre: g(c.nom), categoria: 'cultura', subtipo: g(c.esp).split(',')[0].trim(),
      direccion: g(c.dom).replace(/\s+/g, ' '), barrio: loc === 'Neuquén' ? '' : loc, lat, lng, telefono: '', whatsapp: '', horarios: '', h24: false,
      web: '', descripcion: '', extra: { Acceso: g(c.acc), Dependencia: g(c.dep) }, fuente: FUENTE_ODAFYC, _loc: loc });
  });
  // Ubicación dudosa: a más de 15 km de la mediana de su propia localidad (ej: coordenadas de otra ciudad).
  const med = a => a.slice().sort((x, y) => x - y)[a.length >> 1], por = {};
  filas.forEach(l => (por[l._loc] ||= []).push(l));
  let atipicos = 0;
  const ok = filas.filter(l => {
    const gr = por[l._loc]; if (gr.length < 3) return true;
    if (distancia(med(gr.map(x => x.lat)), med(gr.map(x => x.lng)), l.lat, l.lng) > 15000) { atipicos++; return false; }
    return true;
  });
  return { filas: ok, malos, atipicos, localidades: [...new Set(ok.map(l => l._loc))].sort((a, b) => a.localeCompare(b, 'es')) };
}

/* Filtra por localidad y evita duplicados (mismo id, o mismo nombre a menos de 25 m). */
function nuevosDesdeOdafyc(filas, loc, sinPrivados, existentes) {
  const base = existentes.slice(), nuevos = []; let duplicados = 0;
  filas.filter(l => l._loc === loc && !(sinPrivados && l.extra.Dependencia === 'Privado')).forEach(l => {
    const a = sinTildes(l.nombre).slice(0, 10);
    const dup = base.some(e => e.id === l.id || (distancia(e.lat, e.lng, l.lat, l.lng) < 25 &&
      (sinTildes(e.nombre).startsWith(a) || sinTildes(l.nombre).startsWith(sinTildes(e.nombre).slice(0, 10)))));
    if (dup) duplicados++; else { const { _loc, ...o } = l; nuevos.push(o); base.push(o); }
  });
  return { nuevos, duplicados };
}
