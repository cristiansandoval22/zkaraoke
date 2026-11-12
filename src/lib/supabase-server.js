import { createClient } from "@supabase/supabase-js";

let serverClient;

export function getSupabaseServerClient() {
  if (serverClient) return serverClient;

  const url = import.meta.env.SUPABASE_URL;
  const publishableKey = import.meta.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Faltan SUPABASE_URL o SUPABASE_PUBLISHABLE_KEY en el entorno del servidor.",
    );
  }

  serverClient = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return serverClient;
}
