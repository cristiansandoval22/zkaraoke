import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerConfig } from "../../../lib/supabase-server.js";

const allowedTags = new Set(["songs", "artists", "menu", "tables", "settings"]);

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function POST(context) {
  const authorization = context.request.headers.get("authorization") ?? "";
  const accessToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!accessToken) {
    return jsonResponse(
      { error: "Debes iniciar sesión como administrador." },
      401,
    );
  }

  let requestedTags;
  try {
    ({ tags: requestedTags } = await context.request.json());
  } catch {
    return jsonResponse(
      { error: "La solicitud de actualización no es válida." },
      400,
    );
  }

  if (
    !Array.isArray(requestedTags) ||
    requestedTags.length === 0 ||
    requestedTags.some(
      (tag) => typeof tag !== "string" || !allowedTags.has(tag),
    )
  ) {
    return jsonResponse(
      { error: "Las etiquetas de caché solicitadas no son válidas." },
      400,
    );
  }

  let config;
  try {
    config = getSupabaseServerConfig();
  } catch {
    return jsonResponse(
      { error: "La conexión del servidor no está configurada." },
      500,
    );
  }

  const supabase = createClient(config.url, config.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: userData, error: userError } =
    await supabase.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return jsonResponse(
      { error: "La sesión de administrador no es válida." },
      401,
    );
  }

  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (adminError || !admin) {
    return jsonResponse(
      { error: "No tienes permisos para actualizar el caché." },
      403,
    );
  }

  const tags = [...new Set(requestedTags)];
  if (context.cache.enabled) {
    await context.cache.invalidate({ tags });
  }

  return jsonResponse({ ok: true, cacheEnabled: context.cache.enabled });
}
