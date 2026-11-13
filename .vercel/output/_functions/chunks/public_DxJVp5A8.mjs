import { t as __exportAll } from "./rolldown-runtime_D8jQpDG7.mjs";
import { t as getSupabaseServerClient } from "./supabase-server_p0UC4e5j.mjs";
// src/pages/api/settings/public.json.js
var public_json_exports = /* @__PURE__ */ __exportAll({ GET: () => GET });
function jsonResponse(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json; charset=utf-8" }
	});
}
async function GET(context) {
	try {
		const { data, error } = await getSupabaseServerClient().from("settings").select("whatsapp_number,whatsapp_bar").eq("id", true).maybeSingle();
		if (error) throw error;
		context.cache.set({
			maxAge: 86400,
			swr: 86400,
			tags: ["settings"]
		});
		return jsonResponse({
			whatsappNumber: data?.whatsapp_number ?? "",
			whatsappBar: data?.whatsapp_bar ?? ""
		});
	} catch (error) {
		console.error("No se pudo cargar la configuración pública:", error);
		return jsonResponse({ error: "No se pudo cargar la configuración del negocio." }, 500);
	}
}
// \0virtual:astro:page:src/pages/api/settings/public.json@_@js
var page = () => public_json_exports;
export { page };
