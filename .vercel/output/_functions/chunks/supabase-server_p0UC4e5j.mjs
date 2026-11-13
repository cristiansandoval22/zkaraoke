import { createClient } from "@supabase/supabase-js";
// src/lib/supabase-server.js
var serverClient;
function getSupabaseServerClient() {
	if (serverClient) return serverClient;
	serverClient = createClient("https://mpupgegoxzxwopxnqlaq.supabase.co", "sb_publishable_WFkg2ODFEeqP89uItXpmdg_uFIWpvIG", { auth: {
		persistSession: false,
		autoRefreshToken: false
	} });
	return serverClient;
}
export { getSupabaseServerClient as t };
