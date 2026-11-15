import { createServerClient, parseCookieHeader } from "@supabase/ssr";

/** Creates a Supabase client scoped to the current request and its auth cookies. */
export function createSupabaseSsrClient({ request, cookies }) {
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
    throw new Error("La conexión de Supabase no está configurada en el servidor.");
  }

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("cookie") || "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, options);
        });
      },
    },
  });
}
