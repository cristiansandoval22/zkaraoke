import { t as __exportAll } from "./rolldown-runtime_D8jQpDG7.mjs";
import { t as getSupabaseServerClient } from "./supabase-server_p0UC4e5j.mjs";
// src/pages/api/songs/search.json.js
var search_json_exports = /* @__PURE__ */ __exportAll({ GET: () => GET });
var PAGE_SIZE = 30;
var UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
function jsonResponse(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json; charset=utf-8" }
	});
}
function escapeLikeTerm(value) {
	return value.replace(/[\\%_]/g, "\\$&");
}
function quotePostgrestValue(value) {
	return `"${value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
}
function applyCatalogFilters(query, genreId, languageId, cursorTitle, cursorId) {
	if (genreId) query = query.eq("genre_id", genreId);
	if (languageId) query = query.eq("language_id", languageId);
	if (cursorTitle !== null && cursorId) {
		const safeTitle = quotePostgrestValue(cursorTitle);
		query = query.or(`title.gt.${safeTitle},and(title.eq.${safeTitle},id.gt.${cursorId})`);
	}
	return query.order("title", { ascending: true }).order("id", { ascending: true }).limit(31);
}
async function GET(context) {
	const { searchParams } = new URL(context.request.url);
	const rawTerm = (searchParams.get("q") ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
	if (rawTerm.length === 1) return jsonResponse({
		songs: [],
		hasMore: false,
		nextCursor: null
	});
	const term = rawTerm.length >= 2 ? escapeLikeTerm(rawTerm) : "";
	const genreId = searchParams.get("genre") ?? "";
	const languageId = searchParams.get("language") ?? "";
	const cursorTitle = searchParams.get("afterTitle");
	const cursorId = searchParams.get("afterId");
	if (genreId && !UUID_PATTERN.test(genreId) || languageId && !UUID_PATTERN.test(languageId)) return jsonResponse({ error: "El género o idioma seleccionado no es válido." }, 400);
	if (cursorTitle && !cursorId || !cursorTitle && cursorId || cursorId && !UUID_PATTERN.test(cursorId)) return jsonResponse({ error: "El cursor de paginación no es válido." }, 400);
	if (cursorTitle && cursorTitle.length > 300) return jsonResponse({ error: "El cursor de paginación no es válido." }, 400);
	try {
		const supabase = getSupabaseServerClient();
		let songRows = [];
		if (!term) {
			const { data, error } = await applyCatalogFilters(supabase.from("songs").select("id,title,artist:artists(name),genre:genres(name),language:languages(name)"), genreId, languageId, cursorTitle, cursorId);
			if (error) throw error;
			songRows = data ?? [];
		} else {
			const pattern = `%${term}%`;
			const titleQuery = applyCatalogFilters(supabase.from("songs").select("id,title,artist:artists(name),genre:genres(name),language:languages(name)").ilike("title", pattern), genreId, languageId, cursorTitle, cursorId);
			const artistQuery = applyCatalogFilters(supabase.from("songs").select("id,title,artist:artists!inner(name),genre:genres(name),language:languages(name)").ilike("artists.name", pattern), genreId, languageId, cursorTitle, cursorId);
			const [titleResult, artistResult] = await Promise.all([titleQuery, artistQuery]);
			if (titleResult.error) throw titleResult.error;
			if (artistResult.error) throw artistResult.error;
			const uniqueSongs = /* @__PURE__ */ new Map();
			for (const song of [...titleResult.data ?? [], ...artistResult.data ?? []]) uniqueSongs.set(song.id, song);
			songRows = [...uniqueSongs.values()].sort((left, right) => left.title.localeCompare(right.title, "en-US") || (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));
		}
		const hasMore = songRows.length > PAGE_SIZE;
		const songs = songRows.slice(0, PAGE_SIZE);
		const lastSong = songs.at(-1);
		const nextCursor = hasMore && lastSong ? {
			title: lastSong.title,
			id: lastSong.id
		} : null;
		context.cache.set({
			maxAge: 21600,
			swr: 21600,
			tags: ["songs"]
		});
		return jsonResponse({
			songs,
			hasMore,
			nextCursor
		});
	} catch (error) {
		console.error("No se pudo consultar el catálogo musical:", error);
		return jsonResponse({ error: "No se pudo cargar el catálogo. Intenta nuevamente." }, 500);
	}
}
// \0virtual:astro:page:src/pages/api/songs/search.json@_@js
var page = () => search_json_exports;
export { page };
