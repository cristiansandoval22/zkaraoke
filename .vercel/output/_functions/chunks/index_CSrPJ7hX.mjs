import { t as __exportAll } from "./rolldown-runtime_D8jQpDG7.mjs";
import { h as addAttribute, l as renderTemplate, r as renderComponent, u as maybeRenderHead } from "./server_Dflk56LB.mjs";
import { t as createComponent } from "./astro-component_Muq-HobA.mjs";
import { t as createAstro } from "./astro-global_DHcZqO7I.mjs";
import { t as renderScript } from "./script_DpONasWa.mjs";
import "./compiler_hRCWSfR6.mjs";
import { n as $$BaseLayout, t as $$PageHeading } from "./PageHeading_DRuvX4uc.mjs";
import { t as getSupabaseServerClient } from "./supabase-server_p0UC4e5j.mjs";
// src/pages/index.astro
var pages_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	prerender: () => false,
	url: () => ""
});
createAstro("https://astro.build");
var $$Index = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Index;
	const { data: activeLocations, error: locationsError } = await getSupabaseServerClient().from("tables").select("id,name,capacity").eq("active", true).order("name", { ascending: true });
	if (!locationsError) Astro.cache.set({
		maxAge: 86400,
		swr: 86400,
		tags: ["tables"]
	});
	const locationCollator = new Intl.Collator("es", {
		numeric: true,
		sensitivity: "base"
	});
	const locations = [...activeLocations ?? []].sort((first, second) => locationCollator.compare(first.name, second.name));
	const tables = locations.filter((location) => !/^barra\b/i.test(location.name));
	const barSpaces = locations.filter((location) => /^barra\b/i.test(location.name));
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Selecciona tu mesa | Karaoke & Bar" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div data-location-selection><!-- Presentación y acceso a las reglas del local --><section class="welcome-banner"><div><p class="eyebrow">BIENVENIDO/A</p><h1>Tu noche<br><span>empieza aquí.</span></h1><p>Elige dónde disfrutarás la experiencia.</p><a href="/reglas">Reglas del lugar</a></div><div class="welcome-graphic" aria-hidden="true">♫</div></section><!-- Encabezado del paso de selección -->${renderComponent($$result, "PageHeading", $$PageHeading, {
		"eyebrow": "PASO 01",
		"title": "¿Dónde estás?",
		"description": "Selecciona tu mesa o un espacio en la barra."
	})}<!-- Selección de espacio en la barra --><section class="selection-section" aria-labelledby="bar-heading"><div class="section-title"><h2 id="bar-heading">Barra</h2><span>${barSpaces.length} espacios</span></div>${locationsError ? null : barSpaces.length ? renderTemplate`<div class="location-grid bar-grid">${barSpaces.map((space) => renderTemplate`<button class="location-card" type="button"${addAttribute(space.name, "data-location")}${addAttribute(`${space.name}, capacidad ${space.capacity}`, "aria-label")}><span class="table-icon" aria-hidden="true">▤</span><strong>${space.name}</strong></button>`)}</div>` : renderTemplate`<p>No hay espacios de barra activos configurados.</p>`}</section><!-- Selección de mesa --><section class="selection-section" aria-labelledby="tables-heading"><div class="section-title"><h2 id="tables-heading">Mesas</h2><span>${tables.length} espacios</span></div>${locationsError ? renderTemplate`<p role="alert">No se pudieron cargar las mesas. Intenta recargar la página.</p>` : tables.length ? renderTemplate`<div class="location-grid">${tables.map((table) => renderTemplate`<button class="location-card" type="button"${addAttribute(table.name, "data-location")}${addAttribute(`${table.name}, capacidad ${table.capacity}`, "aria-label")}><span class="table-icon" aria-hidden="true">▦</span><strong>${table.name}</strong></button>`)}</div>` : renderTemplate`<p>No hay mesas activas configuradas.</p>`}</section><!-- Se habilita cuando el cliente selecciona un espacio --><button class="btn btn-primary btn-full continue-btn" id="continue-location" type="button" disabled>Continuar <span aria-hidden="true">→</span></button></div>${renderScript($$result, "E:/zkaraoke/src/pages/index.astro?astro&type=script&index=0&lang.ts")}` })}`;
}, "E:/zkaraoke/src/pages/index.astro", void 0);
var $$file = "E:/zkaraoke/src/pages/index.astro";
// \0virtual:astro:page:src/pages/index@_@astro
var page = () => pages_exports;
export { page };
