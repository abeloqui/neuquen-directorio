-- =========================================================
-- NEUQUEN MEJORA - Esquema de base de datos (Supabase)
-- Pegar completo en SQL Editor y ejecutar.
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------- Admins ----------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------- Barrios ----------
create table if not exists public.neighborhoods (
  id serial primary key,
  name text not null unique,
  slug text not null unique,
  manual_adjustment numeric not null default 0,
  adjustment_note text,
  created_at timestamptz not null default now()
);

-- ---------- Categorias ----------
create table if not exists public.report_categories (
  slug text primary key,
  type text not null check (type in ('infraestructura','seguridad')),
  label text not null,
  sort_order int not null default 0
);

-- ---------- Reportes ----------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('infraestructura','seguridad')),
  category text not null references public.report_categories(slug),
  title text not null check (char_length(title) between 5 and 120),
  description text not null check (char_length(description) between 10 and 2000),
  photo_url text,
  lat double precision not null check (lat between -39.5 and -38.5),
  lng double precision not null check (lng between -69.0 and -68.0),
  neighborhood_id int references public.neighborhoods(id) on delete set null,
  author_name text,
  contact text,
  status text not null default 'pending'
    check (status in ('pending','approved','in_progress','resolved','rejected')),
  featured boolean not null default false,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz,
  resolved_at timestamptz
);

create index if not exists reports_status_idx on public.reports(status);
create index if not exists reports_neighborhood_idx on public.reports(neighborhood_id);
create index if not exists reports_created_idx on public.reports(created_at desc);

create or replace function public.reports_before_write()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();

  if new.status in ('approved','in_progress','resolved') and new.approved_at is null then
    new.approved_at = now();
  end if;

  if new.status = 'resolved' and new.resolved_at is null then
    new.resolved_at = now();
  end if;

  if new.status <> 'resolved' then
    new.resolved_at = null;
  end if;

  return new;
end;
$$;

drop trigger if exists reports_before_write_trg on public.reports;
create trigger reports_before_write_trg
before insert or update on public.reports
for each row execute function public.reports_before_write();

-- ---------- Configuracion del ranking ----------
create table if not exists public.ranking_settings (
  id int primary key default 1 check (id = 1),
  weight_infra_open numeric not null default 3,
  weight_security numeric not null default 4,
  weight_resolution_days numeric not null default 0.1,
  resolution_days_cap numeric not null default 60,
  weight_resolved_bonus numeric not null default 1,
  window_days int not null default 90,
  updated_at timestamptz not null default now()
);
insert into public.ranking_settings (id) values (1) on conflict do nothing;

-- ---------- Vista publica de reportes (SIN contacto) ----------
create or replace view public.public_reports as
select
  id, type, category, title, description, photo_url,
  lat, lng, neighborhood_id, author_name,
  status, featured, created_at, approved_at, resolved_at
from public.reports
where status in ('approved','in_progress','resolved');

-- ---------- Vista del ranking de barrios ----------
-- Score MAS ALTO = barrio con MAS problemas (puesto 1 = el mas afectado)
create or replace view public.neighborhood_ranking as
with agg as (
  select
    n.id,
    n.name,
    n.slug,
    n.manual_adjustment,
    n.adjustment_note,
    count(r.id) filter (
      where r.type = 'infraestructura' and r.status in ('approved','in_progress')
    ) as infra_open,
    count(r.id) filter (
      where r.type = 'seguridad'
        and r.status in ('approved','in_progress','resolved')
        and r.approved_at >= now() - make_interval(days => s.window_days)
    ) as security_recent,
    count(r.id) filter (
      where r.status = 'resolved'
        and r.resolved_at >= now() - make_interval(days => s.window_days)
    ) as resolved_recent,
    coalesce(
      avg(extract(epoch from (r.resolved_at - r.approved_at)) / 86400.0) filter (
        where r.status = 'resolved' and r.resolved_at is not null and r.approved_at is not null
      ), 0
    ) as avg_resolution_days,
    s.weight_infra_open,
    s.weight_security,
    s.weight_resolution_days,
    s.resolution_days_cap,
    s.weight_resolved_bonus
  from public.neighborhoods n
  join public.ranking_settings s on s.id = 1
  left join public.reports r
    on r.neighborhood_id = n.id
   and r.status in ('approved','in_progress','resolved')
  group by n.id, s.id
),
scored as (
  select
    id, name, slug, infra_open, security_recent, resolved_recent,
    round(avg_resolution_days::numeric, 1) as avg_resolution_days,
    manual_adjustment, adjustment_note,
    greatest(
      0,
      infra_open * weight_infra_open
      + security_recent * weight_security
      + least(avg_resolution_days, resolution_days_cap) * weight_resolution_days
      - resolved_recent * weight_resolved_bonus
      + manual_adjustment
    )::numeric(10,2) as score
  from agg
)
select
  row_number() over (order by score desc, name) as position,
  *
from scored;

-- ---------- Seguridad (RLS) ----------
alter table public.admins enable row level security;
alter table public.neighborhoods enable row level security;
alter table public.report_categories enable row level security;
alter table public.reports enable row level security;
alter table public.ranking_settings enable row level security;

drop policy if exists "admin ve su fila" on public.admins;
create policy "admin ve su fila" on public.admins
  for select using (user_id = auth.uid());

drop policy if exists "admin gestiona reportes" on public.reports;
create policy "admin gestiona reportes" on public.reports
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "barrios lectura publica" on public.neighborhoods;
create policy "barrios lectura publica" on public.neighborhoods
  for select using (true);
drop policy if exists "barrios admin escribe" on public.neighborhoods;
create policy "barrios admin escribe" on public.neighborhoods
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "categorias lectura publica" on public.report_categories;
create policy "categorias lectura publica" on public.report_categories
  for select using (true);
drop policy if exists "categorias admin escribe" on public.report_categories;
create policy "categorias admin escribe" on public.report_categories
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "pesos lectura publica" on public.ranking_settings;
create policy "pesos lectura publica" on public.ranking_settings
  for select using (true);
drop policy if exists "pesos admin actualiza" on public.ranking_settings;
create policy "pesos admin actualiza" on public.ranking_settings
  for update using (public.is_admin()) with check (public.is_admin());

grant select on public.public_reports to anon, authenticated;
grant select on public.neighborhood_ranking to anon, authenticated;

-- ---------- Storage de fotos ----------
insert into storage.buckets (id, name, public)
values ('report-photos', 'report-photos', true)
on conflict (id) do nothing;

drop policy if exists "admin sube fotos" on storage.objects;
create policy "admin sube fotos" on storage.objects
  for insert with check (bucket_id = 'report-photos' and public.is_admin());

drop policy if exists "admin borra fotos" on storage.objects;
create policy "admin borra fotos" on storage.objects
  for delete using (bucket_id = 'report-photos' and public.is_admin());

-- ---------- Categorias iniciales ----------
insert into public.report_categories (slug, type, label, sort_order) values
  ('bache',            'infraestructura', 'Bache / calle en mal estado', 1),
  ('luminaria',        'infraestructura', 'Luminaria apagada o rota',    2),
  ('basural',          'infraestructura', 'Basural / residuos',          3),
  ('agua-cloacas',     'infraestructura', 'Pérdida de agua / cloacas',   4),
  ('semaforo',         'infraestructura', 'Semáforo / señalización',     5),
  ('espacio-publico',  'infraestructura', 'Plaza / espacio público',     6),
  ('otro-infra',       'infraestructura', 'Otro (infraestructura)',      7),
  ('robo',             'seguridad',       'Robo / hurto',                1),
  ('vandalismo',       'seguridad',       'Vandalismo',                  2),
  ('zona-peligrosa',   'seguridad',       'Zona peligrosa / sin iluminación', 3),
  ('transito',         'seguridad',       'Conducción peligrosa / tránsito', 4),
  ('otro-seg',         'seguridad',       'Otro (seguridad)',            5)
on conflict (slug) do nothing;

-- ---------- Barrios de Neuquen Capital ----------
insert into public.neighborhoods (name, slug) values
  ('14 de Octubre / Copol', '14-de-octubre-copol'),
  ('Alta Barda', 'alta-barda'),
  ('Altos del Limay', 'altos-del-limay'),
  ('Área Centro Este (El Alto)', 'area-centro-este'),
  ('Área Centro Oeste', 'area-centro-oeste'),
  ('Área Centro Sur (El Bajo)', 'area-centro-sur'),
  ('Bardas Soleadas', 'bardas-soleadas'),
  ('Barrio Nuevo', 'barrio-nuevo'),
  ('Belgrano (Manuel Belgrano)', 'belgrano'),
  ('Bouquet Roldán', 'bouquet-roldan'),
  ('Canal V', 'canal-v'),
  ('Ciudad Industrial / Obispo Jaime de Nevares (Parque Industrial)', 'ciudad-industrial'),
  ('Colonia Nueva Esperanza', 'colonia-nueva-esperanza'),
  ('Confluencia Rural', 'confluencia-rural'),
  ('Confluencia Urbana', 'confluencia-urbana'),
  ('Cuenca XV', 'cuenca-xv'),
  ('Cumelén', 'cumelen'),
  ('Don Bosco II', 'don-bosco-ii'),
  ('Don Bosco III', 'don-bosco-iii'),
  ('El Progreso', 'el-progreso'),
  ('Esfuerzo', 'esfuerzo'),
  ('Gran Neuquén Norte', 'gran-neuquen-norte'),
  ('Gran Neuquén Sur', 'gran-neuquen-sur'),
  ('Gregorio Álvarez', 'gregorio-alvarez'),
  ('Hi.Be.Pa.', 'hibepa'),
  ('Huiliches', 'huiliches'),
  ('Islas Malvinas', 'islas-malvinas'),
  ('La Sirena', 'la-sirena'),
  ('Limay', 'limay'),
  ('Mariano Moreno', 'mariano-moreno'),
  ('Melipal', 'melipal'),
  ('Militar (Zona de la Guarnición del Ejército)', 'militar'),
  ('Provincias Unidas', 'provincias-unidas'),
  ('Rincón de Emilio', 'rincon-de-emilio'),
  ('Río Grande', 'rio-grande'),
  ('San Lorenzo Norte', 'san-lorenzo-norte'),
  ('San Lorenzo Sur', 'san-lorenzo-sur'),
  ('Santa Genoveva', 'santa-genoveva'),
  ('Sapere (Aníbal Sapere)', 'sapere'),
  ('Terrazas del Neuquén', 'terrazas-del-neuquen'),
  ('Unión de Mayo', 'union-de-mayo'),
  ('Valentina Norte Rural', 'valentina-norte-rural'),
  ('Valentina Norte Urbana', 'valentina-norte-urbana'),
  ('Valentina Sur Rural', 'valentina-sur-rural'),
  ('Valentina Sur Urbana', 'valentina-sur-urbana'),
  ('Villa Ceferino', 'villa-ceferino'),
  ('Villa Farrell', 'villa-farrell'),
  ('Villa Florencia', 'villa-florencia'),
  ('Villa María', 'villa-maria')
on conflict do nothing;
