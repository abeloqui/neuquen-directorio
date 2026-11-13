# 📍 Neuquén Mejora

Plataforma ciudadana para reportar problemas de **infraestructura** e **inseguridad** en Neuquén Capital sobre un mapa. Cualquier vecino puede reportar sin registrarse, pero **nada se publica sin aprobación** de la persona administradora.

## Características

- Mapa público (Leaflet + OpenStreetMap) con solo los reportes aprobados, marcadores por tipo y categoría, filtros por tipo, categoría, barrio y fecha.
- Formulario de reporte sin registro: geolocalización o selección manual, foto opcional (se comprime en el navegador), contacto visible solo para el admin.
- Panel de administración protegido (Supabase Auth): aprobar, rechazar, editar, cambiar estado, destacar, mover ubicación, crear y eliminar reportes.
- Ranking público de barrios con fórmula transparente, pesos editables y ajuste manual con motivo visible.
- Estadísticas: reportes por estado, barrios con más problemas abiertos y evolución mensual.
- Modo oscuro, diseño mobile-first y SEO básico (metadatos, sitemap, robots).

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Leaflet / react-leaflet · Supabase (Postgres, Auth, Storage) · Recharts · Vercel.

## Estructura

```
app/            Páginas públicas, panel /admin y API (/api/reports)
components/     UI, mapa, formularios y componentes del admin
lib/            Clientes de Supabase, constantes, tipos, ranking
supabase/       schema.sql (tablas, vistas, RLS, storage, datos iniciales)
middleware.ts   Protege /admin (sesión + pertenencia a la tabla admins)
```

## Seguridad

- La tabla `reports` tiene RLS: solo el admin accede. El público lee la vista `public_reports`, que **no incluye el contacto**.
- Los reportes se crean desde `/api/reports` (servidor, service role) con validación, honeypot y límite básico por IP.
- `SUPABASE_SERVICE_ROLE_KEY` solo se usa en el servidor. Nunca la expongas con `NEXT_PUBLIC_`.
- El límite por IP es en memoria (por instancia serverless): sirve como primera barrera, no como protección fuerte. Si hay abuso, sumá Cloudflare Turnstile o Upstash Ratelimit.

## 1. Configurar Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. Entrá a **SQL Editor → New query**, pegá todo `supabase/schema.sql` y ejecutalo.
3. Verificá en **Table Editor** que existan `reports`, `neighborhoods` (50 barrios), `report_categories`, `ranking_settings` y `admins`, y en **Storage** el bucket público `report-photos`.
4. En **Project Settings → API** copiá la `Project URL`, la `anon public key` y la `service_role key`.
5. En **Authentication → Providers → Email**, desactivá **Allow new users to sign up** para que nadie pueda registrarse.

## 2. Crear el usuario administrador

1. **Authentication → Users → Add user → Create new user**: ingresá tu email y una contraseña fuerte, y marcá *Auto Confirm User*.
2. En el **SQL Editor** ejecutá (con tu email):

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'tu@email.com';
```

3. Ingresá en `/admin/login` con ese email y contraseña.

## 3. Variables de entorno

Copiá `.env.example` a `.env.local` (local) o cargalas en Vercel:

| Variable | Descripción |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave service role (solo servidor) |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio, sin barra final |

## 4. Desplegar en Vercel

1. Subí el proyecto a un repositorio de GitHub.
2. En [vercel.com](https://vercel.com) → **Add New → Project** → importá el repositorio (Framework: Next.js, se detecta solo).
3. En **Environment Variables** cargá las cuatro variables de arriba.
4. **Deploy**. Cuando termine, actualizá `NEXT_PUBLIC_SITE_URL` con el dominio real y redeployá.

## Desarrollo local (opcional)

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Cálculo del ranking de barrios

Un puntaje **más alto** significa **más problemas** (el puesto 1 es el barrio más afectado). Solo cuentan reportes aprobados:

```
score = infraestructura abierta × 3
      + seguridad (últimos 90 días) × 4
      + días promedio de resolución (tope 60) × 0,1
      − resueltos (últimos 90 días) × 1
      ± ajuste manual (público, con motivo)
```

Los pesos viven en la tabla `ranking_settings` y se editan desde `/admin/ranking`. El cálculo se hace en la vista SQL `neighborhood_ranking` y se replica en `lib/ranking.ts`. No normaliza por población ni superficie.

## Estados de un reporte

`Pendiente` → `Aprobado` → `En proceso` → `Resuelto` (o `Rechazado`). Son públicos Aprobado, En proceso y Resuelto.

## Licencia

MIT
