-- Keep songs.artist_id during the transition and store all credits in order.
create table if not exists public.song_artists (
  song_id uuid not null references public.songs(id) on delete cascade,
  artist_id uuid not null references public.artists(id) on delete restrict,
  position smallint not null check (position > 0 and position <= 10),
  created_at timestamptz not null default now(),
  constraint song_artists_pkey primary key (song_id, artist_id),
  constraint song_artists_song_position_key unique (song_id, position)
);

create index if not exists song_artists_artist_song_idx
  on public.song_artists (artist_id, song_id);

alter table public.song_artists enable row level security;

drop policy if exists "Public read song artists" on public.song_artists;
create policy "Public read song artists"
  on public.song_artists for select to anon, authenticated using (true);
drop policy if exists "Admin insert song artists" on public.song_artists;
create policy "Admin insert song artists"
  on public.song_artists for insert to authenticated with check (private.is_admin());
drop policy if exists "Admin update song artists" on public.song_artists;
create policy "Admin update song artists"
  on public.song_artists for update to authenticated
  using (private.is_admin()) with check (private.is_admin());
drop policy if exists "Admin delete song artists" on public.song_artists;
create policy "Admin delete song artists"
  on public.song_artists for delete to authenticated using (private.is_admin());

grant select on public.song_artists to anon, authenticated;
grant insert, update, delete on public.song_artists to authenticated;

-- Backfill every existing single artist as the first credit.
insert into public.song_artists (song_id, artist_id, position)
select id, artist_id, 1 from public.songs where artist_id is not null
on conflict do nothing;

create or replace view public.artist_song_counts
with (security_invoker = true)
as
select artist_id, count(*)::integer as song_count
from public.song_artists
group by artist_id;
grant select on public.artist_song_counts to anon, authenticated;

-- Save the song and its complete ordered artist list as one transaction.
create or replace function public.save_song_with_artists(
  p_song_id uuid,
  p_title text,
  p_artist_ids uuid[],
  p_genre_id uuid,
  p_language_id uuid
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  saved_song_id uuid;
  artist_count integer;
  distinct_artist_count integer;
  existing_artist_count integer;
begin
  if not private.is_admin() then
    raise exception 'Administrator access is required';
  end if;
  if nullif(btrim(p_title), '') is null then
    raise exception 'Song title is required';
  end if;

  artist_count := coalesce(cardinality(p_artist_ids), 0);
  select count(distinct selected.artist_id)::integer
    into distinct_artist_count
    from unnest(coalesce(p_artist_ids, array[]::uuid[])) as selected(artist_id);
  if artist_count < 1 or artist_count > 10 or distinct_artist_count <> artist_count then
    raise exception 'Select between 1 and 10 unique artists';
  end if;

  select count(*)::integer into existing_artist_count
    from public.artists where id = any(p_artist_ids);
  if existing_artist_count <> artist_count then
    raise exception 'One or more selected artists do not exist';
  end if;

  if p_song_id is null then
    insert into public.songs (title, artist_id, genre_id, language_id, updated_at)
    values (btrim(p_title), p_artist_ids[1], p_genre_id, p_language_id, now())
    returning id into saved_song_id;
  else
    update public.songs
      set title = btrim(p_title), artist_id = p_artist_ids[1],
          genre_id = p_genre_id, language_id = p_language_id, updated_at = now()
      where id = p_song_id returning id into saved_song_id;
    if saved_song_id is null then
      raise exception 'Song not found or update is not allowed';
    end if;
    delete from public.song_artists where song_id = saved_song_id;
  end if;

  insert into public.song_artists (song_id, artist_id, position)
  select saved_song_id, selected.artist_id, selected.ordinality::smallint
    from unnest(p_artist_ids) with ordinality as selected(artist_id, ordinality);
  return saved_song_id;
end;
$$;

revoke all on function public.save_song_with_artists(uuid, text, uuid[], uuid, uuid) from public, anon;
grant execute on function public.save_song_with_artists(uuid, text, uuid[], uuid, uuid) to authenticated;
