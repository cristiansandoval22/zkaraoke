import { getSupabaseServerClient } from "./supabase-server.js";

// Centraliza las lecturas de la carta para la página SSR y su endpoint JSON.
export async function getMenuCatalog() {
  const supabase = getSupabaseServerClient();
  const [categoriesResult, productsResult] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id,name,icon,display_order")
      .order("display_order", { ascending: true }),
    supabase
      .from("menu_items")
      .select(
        "id,name,description,price,category_id,image_url,available,category:menu_categories(name,icon)",
      )
      .eq("available", true)
      .order("name", { ascending: true }),
  ]);

  if (categoriesResult.error) throw categoriesResult.error;
  if (productsResult.error) throw productsResult.error;

  return {
    categories: categoriesResult.data ?? [],
    products: productsResult.data ?? [],
  };
}
