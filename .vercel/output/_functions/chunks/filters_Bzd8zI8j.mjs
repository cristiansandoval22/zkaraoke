import { t as __exportAll } from "./rolldown-runtime_D8jQpDG7.mjs";
import { t as getSupabaseServerClient } from "./supabase-server_p0UC4e5j.mjs";
// src/pages/api/songs/filters.json.js
var filters_json_exports = /* @__PURE__ */ __exportAll({ GET: () => GET });
function jsonResponse(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json; charset=utf-8" }
	});
}
async function GET(context) {
	try {
		const supabase = getSupabaseServerClient();
		const [genresResult, languagesResult, settingsResult] = await Promise.all([
			supabase.from("genres").select("id,name").order("name"),
			supabase.from("languages").select("id,name").order("name"),
			supabase.from("settings").select("max_songs_per_order").eq("id", true).maybeSingle()
		]);
		for (const result of [
			genresResult,
			languagesResult,
			settingsResult
		]) if (result.error) throw result.error;
		context.cache.set({
			maxAge: 86400,
			swr: 86400,
			tags: ["songs"]
		});
		return jsonResponse({
			genres: genresResult.data ?? [],
			languages: languagesResult.data ?? [],
			maxSongsPerOrder: settingsResult.data?.max_songs_per_order ?? 2
		});
	} catch (error) {
		console.error("No se pudieron cargar los filtros del catálogo musical:", error);
		return jsonResponse({ error: "No se pudieron cargar los filtros del catálogo." }, 500);
	}
}
// \0virtual:astro:page:src/pages/api/songs/filters.json@_@js
var page = () => filters_json_exports;
export { page };
