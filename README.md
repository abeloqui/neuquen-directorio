# Directorio Comunitario de Neuquén

Web estática (HTML + CSS + JS vanilla), PWA, mapa Leaflet + OpenStreetMap. Sin analítica, sin cuentas, sin publicidad.
La ubicación del usuario se procesa solo en su navegador.

## Estructura
```
index.html · admin.html · lugares.json · manifest.json · sw.js · vercel.json
css/style.css
js/shared.js   categorías, horarios, estado abierto/cerrado, distancia
js/app.js      mapa, filtros, ficha, favoritos, geolocalización
js/admin.js    panel de administración
js/config.js   hash SHA-256 de la contraseña
icons/
```

## Desplegar en Vercel
**Con GitHub (recomendado):** subí la carpeta a un repo → vercel.com → *Add New → Project* → elegí el repo →
*Framework Preset: Other*, sin build command ni output directory → *Deploy*.
**Con CLI:** `npm i -g vercel` y, dentro de la carpeta, `vercel --prod`.
Para probar local: `npx serve .` (la geolocalización y el service worker requieren `localhost` o HTTPS).

## Actualizar lugares
1. Entrá a `/admin.html`, ingresá la contraseña y agregá, editá o eliminá lugares (clic en el mapa para tomar coordenadas).
2. Los cambios quedan como **borrador en tu navegador**; revisalos en `/index.html?borrador=1`.
3. **Exportar JSON** → reemplazá `lugares.json` en el proyecto → commit/deploy. También podés **Importar** un JSON.
Los usuarios reciben la actualización la próxima vez que abran la app (el service worker refresca en segundo plano).

## Contraseña del panel
Contraseña inicial: `neuquen2026`. Para cambiarla, generá el hash y pegalo en `js/config.js`:
```
printf 'MiNuevaClave' | sha256sum        # Linux/Mac
```
o en la consola del navegador:
`crypto.subtle.digest('SHA-256',new TextEncoder().encode('MiNuevaClave')).then(b=>console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))`

**Importante:** al ser un sitio estático, la verificación ocurre en el navegador. Sirve para evitar errores y curiosos, pero
no es seguridad real: el hash es público y el panel solo edita un borrador local. Lo que se publica es lo que vos subas a
`lugares.json`, por eso la protección real es quién tiene acceso al repositorio.

## Formato de horarios
`"1-5 08:30-20:00; 6 09:00-13:00"` (0 = domingo … 6 = sábado). Para 24 horas: `"h24": true`.
"Cierra pronto" = faltan 60 minutos o menos.

## Datos de ejemplo
Los 15 lugares son **ejemplos con coordenadas aproximadas**; verificá y completá direcciones y teléfonos antes de publicar
(los WhatsApp `5492990000000` son marcadores de posición).

## Soberanía total (opcional)
Leaflet se carga desde unpkg con verificación de integridad y se guarda en caché para uso offline. Para no depender de ningún CDN,
descargá Leaflet 1.9.4 a `vendor/leaflet/`, cambiá las rutas en `index.html` y `admin.html`, y quitá `https://unpkg.com` del CSP en `vercel.json`.
Las teselas vienen de OpenStreetMap (respetá su [política de uso](https://operations.osmfoundation.org/policies/tiles/); para mucho tráfico conviene un proveedor propio).

## Datos abiertos (Portal de Datos Abiertos del Neuquén)
- **Espacios culturales:** el relevamiento de ODAFyC (CC BY 4.0, marzo 2025) ya aporta 13 lugares reales de Neuquén Capital (bibliotecas populares, centros culturales, museos).
  Para sumar más, bajá el CSV de <https://portaldatosabiertos.neuquen.gov.ar/dataset/espacios-culturales-del-neuquen> y usá en el panel
  **Importar CSV de espacios culturales**: elegís la localidad, el importador descarta filas sin coordenadas o con ubicación dudosa, evita duplicados y agrega todo al borrador.
  Como la licencia exige atribución, cada lugar importado muestra su fuente y el pie de página la cita.
- **Límites del dato:** no trae horarios ni teléfonos (se completan a mano en el panel) y tiene errores propios (ej. direcciones de una ciudad con coordenadas de otra, que el importador filtra).
- **Pendiente:** el portal también publica "Espacios deportivos" y "Gestión de Residuos Sólidos Urbanos" (CSV); el segundo parece listar sitios de disposición final, no puntos de reciclaje para vecinos, así que conviene revisarlo antes de usarlo.
  El catálogo SIG Estadística (<https://sigestadistica.neuquen.gov.ar/catalogue/>) es un GeoNode que se carga con JavaScript; cuando identifiques una capa útil (centros de salud, comisarías), podemos sumar un importador para ese formato.
