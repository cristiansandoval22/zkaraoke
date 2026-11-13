import { t as __exportAll } from "./rolldown-runtime_D8jQpDG7.mjs";
import { t as getSupabaseServerClient } from "./supabase-server_p0UC4e5j.mjs";
// src/pages/api/menu/catalog.json.js
var catalog_json_exports = /* @__PURE__ */ __exportAll({ GET: () => GET });
function jsonResponse(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json; charset=utf-8" }
	});
}
async function GET(context) {
	try {
		const supabase = getSupabaseServerClient();
		const [categoriesResult, productsResult] = await Promise.all([supabase.from("menu_categories").select("id,name,icon,display_order").order("display_order", { ascending: true }), supabase.from("menu_items").select("id,name,description,price,category_id,image_url,available,category:menu_categories(name,icon)").eq("available", true).order("name", { ascending: true })]);
		if (categoriesResult.error) throw categoriesResult.error;
		if (productsResult.error) throw productsResult.error;
		context.cache.set({
			maxAge: 86400,
			swr: 86400,
			tags: ["menu"]
		});
		return jsonResponse({
			categories: categoriesResult.data ?? [],
			products: productsResult.data ?? []
		});
	} catch (error) {
		console.error("No se pudo cargar la carta desde Supabase:", error);
		return jsonResponse({ error: "No se pudo cargar la carta. Intenta nuevamente." }, 500);
	}
}
// \0virtual:astro:page:src/pages/api/menu/catalog.json@_@js
var page = () => catalog_json_exports;
export { page };
