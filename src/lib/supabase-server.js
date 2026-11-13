import { createClient } from "@supabase/supabase-js";

let serverClient;

export function getSupabaseServerConfig() {
  // Las claves publicables son las mismas para el navegador y el servidor.
  // Respeta los alias de servidor cuando estén configurados.
  const url =
    process.env.SUPABASE_URL ||
    import.meta.env.SUPABASE_URL ||
    process.env.PUBLIC_SUPABASE_URL ||
    import.meta.env.PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "La conexión de Supabase no está configurada en el servidor.",
    );
  }

  return { url, publishableKey };
}

export function getSupabaseServerClient() {
  if (serverClient) return serverClient;

  const { url, publishableKey } = getSupabaseServerConfig();

  serverClient = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return serverClient;
}
