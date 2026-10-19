'use strict';
/* Panel de administración. Trabaja sobre un BORRADOR en localStorage y exporta lugares.json.
   Aviso: la contraseña se verifica en el navegador; frena a curiosos, no a atacantes (ver README). */
const $ = s => document.querySelector(s);
const KEY = 'draft_lugares';
let datos = [], editId = null, pick, pin;

const sha = async t => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)))]
  .map(b => b.toString(16).padStart(2, '0')).join('');
const slug = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

$('#fLogin').onsubmit = async e => {
  e.preventDefault();
  if (await sha($('#pass').value) === ADMIN_HASH) { sessionStorage.setItem('adm', '1'); iniciar(); }
  else $('#err').textContent = 'Contraseña incorrecta.';
};

async function iniciar() {
  if (sessionStorage.getItem('adm') !== '1') return;
  $('#login').hidden = true; $('#panel').hidden = false;
  try { datos = JSON.parse(localStorage.getItem(KEY)); } catch { datos = null; }
  if (!Array.isArray(datos)) datos = (await (await fetch('lugares.json')).json()).lugares;
  $('#selCat').innerHTML = Object.entries(CATS).map(([k, c]) => `<option value="${k}">${c.n}</option>`).join('');
  pick = L.map('pick').setView([-38.9516, -68.0591], 12);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(pick);
  pick.on('click', e => { setLL(e.latlng.lat, e.latlng.lng); });
  render();
}

function setLL(lat, lng) {
  $('#f').lat.value = lat.toFixed(6); $('#f').lng.value = lng.toFixed(6);
  pin ? pin.setLatLng([lat, lng]) : pin = L.marker([lat, lng]).addTo(pick);
}
const guardar = () => { localStorage.setItem(KEY, JSON.stringify(datos)); render(); };

function render() {
  $('#n').textContent = datos.length;
  $('#lst').innerHTML = datos.map(l => `<li class="fila"><span><b>${esc(l.nombre)}</b><small>${esc((CATS[l.categoria] || CATS.otros).n)} – ${esc(l.barrio || '')}</small></span>
    <button class="btn" data-e="${esc(l.id)}">Editar</button><button class="btn" data-d="${esc(l.id)}">Eliminar</button></li>`).join('');
}

$('#lst').onclick = e => {
  const ed = e.target.dataset.e, del = e.target.dataset.d;
  if (del && confirm('¿Eliminar este lugar?')) { datos = datos.filter(l => l.id !== del); guardar(); }
  if (ed) {
    const l = datos.find(x => x.id === ed), f = $('#f'); editId = ed;
    ['nombre', 'categoria', 'subtipo', 'direccion', 'barrio', 'telefono', 'whatsapp', 'web', 'horarios', 'descripcion'].forEach(k => f[k].value = l[k] || '');
    f.h24.checked = !!l.h24; f.extra.value = Object.entries(l.extra || {}).map(([k, v]) => `${k}: ${v}`).join('\n');
    setLL(l.lat, l.lng); pick.setView([l.lat, l.lng], 15);
    $('#tForm').textContent = 'Editando: ' + l.nombre; scrollTo({ top: 0, behavior: 'smooth' });
  }
};

function limpiar() { $('#f').reset(); editId = null; $('#tForm').textContent = 'Agregar lugar'; }
$('#bCan').onclick = limpiar;

$('#f').onsubmit = e => {
  e.preventDefault();
  const v = Object.fromEntries(new FormData(e.target)), extra = {};
  (v.extra || '').split('\n').forEach(r => { const i = r.indexOf(':'); if (i > 0) extra[r.slice(0, i).trim()] = r.slice(i + 1).trim(); });
  const lat = parseFloat(v.lat), lng = parseFloat(v.lng);
  if (!isFinite(lat) || !isFinite(lng)) return alert('Latitud y longitud deben ser números.');
  const o = {
    id: editId || slug(v.nombre) + '-' + Date.now().toString(36), nombre: v.nombre.trim(), categoria: v.categoria,
    subtipo: v.subtipo.trim(), direccion: v.direccion.trim(), barrio: v.barrio.trim(), lat, lng,
    telefono: v.telefono.trim(), whatsapp: v.whatsapp.replace(/\D/g, ''), horarios: v.horarios.trim(), h24: !!v.h24,
    web: v.web.trim(), descripcion: v.descripcion.trim(), extra
  };
  const prev = datos.find(l => l.id === editId); if (prev?.fuente) o.fuente = prev.fuente;
  editId ? datos = datos.map(l => l.id === editId ? o : l) : datos.push(o);
  guardar(); limpiar();
};

$('#bExp').onclick = () => {
  const blob = new Blob([JSON.stringify({ actualizado: new Date().toISOString().slice(0, 10), lugares: datos }, null, 2)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'lugares.json' });
  a.click(); URL.revokeObjectURL(a.href);
};
$('#bImp').onchange = async e => {
  try {
    const j = JSON.parse(await e.target.files[0].text()), arr = Array.isArray(j) ? j : j.lugares;
    if (!Array.isArray(arr)) throw 0;
    if (confirm(`Se reemplazarán los lugares actuales por ${arr.length} lugares importados. ¿Continuar?`)) { datos = arr; guardar(); }
  } catch { alert('El archivo no es un lugares.json válido.'); }
  e.target.value = '';
};
$('#bRes').onclick = () => { if (confirm('Se descarta el borrador y se vuelve a lugares.json publicado.')) { localStorage.removeItem(KEY); location.reload(); } };
$('#bOut').onclick = () => { sessionStorage.removeItem('adm'); location.reload(); };
iniciar();

/* ---------- Importar CSV de Datos Abiertos (ver importar.js) ---------- */
let imp = null, res = null;
function prever() {
  res = nuevosDesdeOdafyc(imp.filas, $('#selLoc').value, $('#chkPriv').checked, datos);
  $('#impInfo').textContent = `${res.nuevos.length} lugares nuevos · ${res.duplicados} ya existían. En todo el archivo se descartaron ${imp.malos} filas sin coordenadas válidas y ${imp.atipicos} con ubicación dudosa.`;
  $('#bAdd').disabled = !res.nuevos.length;
}
$('#bCsv').onchange = async e => {
  try { imp = leerOdafyc(await e.target.files[0].text()); }
  catch { alert('No reconocimos el archivo. Debe ser el CSV de "Espacios culturales del Neuquén" (columnas ID;Nombre;Entidad;…).'); return; }
  $('#selLoc').innerHTML = imp.localidades.map(l => `<option${l === 'Neuquén' ? ' selected' : ''}>${esc(l)}</option>`).join('');
  $('#imp').hidden = false; prever(); e.target.value = '';
};
$('#selLoc').onchange = $('#chkPriv').onchange = prever;
$('#bAdd').onclick = () => { datos.push(...res.nuevos); guardar(); $('#imp').hidden = true; alert(res.nuevos.length + ' lugares agregados al borrador.'); };
