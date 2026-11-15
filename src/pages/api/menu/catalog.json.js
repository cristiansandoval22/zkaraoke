import { getMenuCatalog } from "../../../lib/menu.js";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function GET(context) {
  try {
    const catalog = await getMenuCatalog();
    context.cache.set({ maxAge: 86_400, swr: 86_400, tags: ["menu"] });
    return jsonResponse(catalog);
  } catch (error) {
    console.error("No se pudo cargar la carta desde Supabase:", error);
    return jsonResponse(
      { error: "No se pudo cargar la carta. Intenta nuevamente." },
      500,
    );
  }
}
