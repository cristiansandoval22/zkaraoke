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
    const { data, error } = await supabase
      .from("settings")
      .select("whatsapp_number,whatsapp_bar")
      .eq("id", true)
      .maybeSingle();

    if (error) throw error;

    context.cache.set({ maxAge: 86_400, swr: 86_400, tags: ["settings"] });
    return jsonResponse({
      whatsappNumber: data?.whatsapp_number ?? "",
      whatsappBar: data?.whatsapp_bar ?? "",
    });
  } catch (error) {
    console.error("No se pudo cargar la configuración pública:", error);
    return jsonResponse(
      { error: "No se pudo cargar la configuración del negocio." },
      500,
    );
  }
}
