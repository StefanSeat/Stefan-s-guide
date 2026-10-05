-- STEFANOV VODIČ – baza za zajednicu (Supabase)
-- Pokreni ceo fajl jednom: Supabase > SQL Editor > New query > nalepi > Run.
--
-- Šta pravi:
--   profiles    javno ime korisnika
--   places      mesta koja dodaju korisnici (sa Google Maps linkom)
--   lists       top liste korisnika
--   list_items  mesta u listama, sa rangom
--   votes       glasovi za i protiv (+1 / -1), jedan glas po korisniku po mestu
--   place_scores  zbir glasova po mestu (javno)
--
-- Mesta iz Stefanovog vodiča se u glasovima i listama vode po svom id-u (npr. "gradska-przionica"),
-- a mesta korisnika kao "u_" + uuid.

create extension if not exists pgcrypto;

-- Profili ---------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text check (char_length(display_name) between 2 and 40),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profili su javni" on public.profiles for select using (true);
create policy "svoj profil: unos" on public.profiles for insert with check (id = auth.uid());
create policy "svoj profil: izmena" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
-- Korisnik sme da menja samo ime, nikad is_admin
revoke insert, update on public.profiles from anon, authenticated;
grant insert (id, display_name) on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- Mesta korisnika -------------------------------------------------------
create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  category text not null check (category in ('jelo', 'kafa', 'pice', 'vidi', 'radi', 'noc')),
  area text not null default '' check (char_length(area) <= 60),
  address text not null default '' check (char_length(address) <= 200),
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  maps_url text not null check (
    char_length(maps_url) <= 2000 and
    maps_url ~* '^https://((www\.)?google\.[a-z.]+/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl/|goo\.gl/maps/)'
  ),
  created_by uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.places enable row level security;
create policy "mesta su javna" on public.places for select using (true);
create policy "prijavljeni dodaju mesta" on public.places for insert to authenticated with check (created_by = auth.uid());
create policy "brisanje: autor ili admin" on public.places for delete using (created_by = auth.uid() or public.is_admin());

-- Najviše 20 novih mesta po korisniku dnevno (zaštita od spama)
create or replace function public.limit_places() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.places where created_by = new.created_by and created_at > now() - interval '1 day') >= 20 then
    raise exception 'Dnevni limit: najviše 20 novih mesta';
  end if;
  return new;
end $$;
drop trigger if exists places_limit on public.places;
create trigger places_limit before insert on public.places for each row execute function public.limit_places();

-- Liste -----------------------------------------------------------------
create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null check (char_length(title) between 1 and 60),
  created_at timestamptz not null default now()
);
alter table public.lists enable row level security;
create policy "liste su javne" on public.lists for select using (true);
create policy "svoje liste: unos" on public.lists for insert to authenticated with check (owner = auth.uid());
create policy "svoje liste: izmena" on public.lists for update using (owner = auth.uid()) with check (owner = auth.uid());
create policy "svoje liste: brisanje" on public.lists for delete using (owner = auth.uid());

create table if not exists public.list_items (
  list_id uuid not null references public.lists on delete cascade,
  place_key text not null check (char_length(place_key) between 1 and 80),
  rank int not null check (rank between 1 and 50),
  primary key (list_id, place_key)
);
alter table public.list_items enable row level security;
create policy "stavke su javne" on public.list_items for select using (true);
create policy "stavke svoje liste" on public.list_items for all
  using (exists (select 1 from public.lists l where l.id = list_id and l.owner = auth.uid()))
  with check (exists (select 1 from public.lists l where l.id = list_id and l.owner = auth.uid()));

-- Glasovi ---------------------------------------------------------------
create table if not exists public.votes (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  place_key text not null check (char_length(place_key) between 1 and 80),
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (user_id, place_key)
);
alter table public.votes enable row level security;
-- Ko je kako glasao nije javno; svako vidi samo svoje glasove
create policy "svoji glasovi: čitanje" on public.votes for select using (user_id = auth.uid());
create policy "svoji glasovi: unos" on public.votes for insert to authenticated with check (user_id = auth.uid());
create policy "svoji glasovi: izmena" on public.votes for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "svoji glasovi: brisanje" on public.votes for delete using (user_id = auth.uid());

-- Javni zbir glasova (pogled radi sa pravima vlasnika, pa vidi sve glasove, ali prikazuje samo zbirove)
create or replace view public.place_scores as
  select place_key,
         count(*) filter (where value = 1)  as up,
         count(*) filter (where value = -1) as down,
         coalesce(sum(value), 0)::int        as score
  from public.votes
  group by place_key;
grant select on public.place_scores to anon, authenticated;
