import { getSupabaseServerClient } from "../../../lib/supabase-server.js";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function GET(context) {
  try {
    const supabase = getSupabaseServerClient();
    const { data: rankings, error: rankingError } = await supabase
      .from("artist_song_counts")
      .select("artist_id,song_count")
      .order("song_count", { ascending: false })
      .limit(30);

    if (rankingError) throw rankingError;
    const ids = (rankings ?? []).map((row) => row.artist_id);
    if (!ids.length) {
      context.cache.set({ maxAge: 86_400, swr: 86_400, tags: ["artists"] });
      return jsonResponse({ artists: [] });
    }

    const { data: artists, error: artistsError } = await supabase
      .from("artists")
      .select("id,name,image_url")
      .in("id", ids);
    if (artistsError) throw artistsError;

    const byId = new Map((artists ?? []).map((artist) => [artist.id, artist]));
    const orderedArtists = rankings
      .map((row) => {
        const artist = byId.get(row.artist_id);
        return artist ? { ...artist, song_count: row.song_count } : null;
      })
      .filter(Boolean);

    context.cache.set({ maxAge: 86_400, swr: 86_400, tags: ["artists"] });
    return jsonResponse({ artists: orderedArtists });
  } catch (error) {
    console.error("No se pudieron cargar los artistas populares:", error);
    return jsonResponse({ error: "No se pudieron cargar los artistas." }, 500);
  }
}
