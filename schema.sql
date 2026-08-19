-- Esegui questo script in Supabase: Dashboard → SQL Editor → New query → Run

create table public.scores (
  user_id uuid references auth.users(id) on delete cascade primary key,
  username text not null,
  score integer not null default 0,
  difficulty text,
  updated_at timestamptz not null default now()
);

-- Attiva le regole di sicurezza a livello di riga (RLS)
alter table public.scores enable row level security;

-- Chiunque (anche non loggato) può leggere la classifica
create policy "Lettura pubblica della classifica"
  on public.scores for select
  using (true);

-- Un utente può creare SOLO il proprio punteggio
create policy "L'utente crea solo il proprio punteggio"
  on public.scores for insert
  with check (auth.uid() = user_id);

-- Un utente può aggiornare SOLO il proprio punteggio
create policy "L'utente aggiorna solo il proprio punteggio"
  on public.scores for update
  using (auth.uid() = user_id);


-- ============================================================
-- FEEDBACK: valutazioni a fine spedizione (1-5 stelle + commento)
-- ============================================================
create table public.feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  mode text,
  rating integer check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- Un utente può inviare solo il proprio feedback (nessuna lettura pubblica:
-- lo controlli tu dal pannello Supabase, non serve mostrarlo nell'app)
create policy "L'utente invia solo il proprio feedback"
  on public.feedback for insert
  with check (auth.uid() = user_id);


-- ============================================================
-- SESSIONS: log di ogni spedizione, per capire uso reale e abbandoni
-- ============================================================
create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  mode text,
  sub_type text,          -- difficoltà (gioco) o tipo di turismo
  transport text,
  kids_mode boolean default false,
  target_count integer,   -- quante tappe proposte all'inizio
  targets_found integer,  -- quante completate (aggiornato alla fine)
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.sessions enable row level security;

create policy "L'utente crea solo le proprie sessioni"
  on public.sessions for insert
  with check (auth.uid() = user_id);

create policy "L'utente aggiorna solo le proprie sessioni"
  on public.sessions for update
  using (auth.uid() = user_id);


-- ============================================================
-- SEARCH_ERRORS: quando "nessun luogo trovato" o Overpass non risponde,
-- utile per capire in quali zone/modalità l'app funziona male
-- ============================================================
create table public.search_errors (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  mode text,
  sub_type text,        -- difficoltà (gioco) o tipo di turismo
  transport text,
  lat double precision,
  lon double precision,
  error_type text,       -- 'empty' (nessun luogo trovato) | 'network' (Overpass irraggiungibile)
  created_at timestamptz not null default now()
);

alter table public.search_errors enable row level security;

create policy "L'utente registra solo i propri errori"
  on public.search_errors for insert
  with check (auth.uid() = user_id);
