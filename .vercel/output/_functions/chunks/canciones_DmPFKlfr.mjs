import { t as __exportAll } from "./rolldown-runtime_D8jQpDG7.mjs";
import { l as renderTemplate, r as renderComponent, u as maybeRenderHead } from "./server_Dflk56LB.mjs";
import { t as createComponent } from "./astro-component_Muq-HobA.mjs";
import { t as renderScript } from "./script_DpONasWa.mjs";
import "./compiler_hRCWSfR6.mjs";
import { n as $$BaseLayout, t as $$PageHeading } from "./PageHeading_DRuvX4uc.mjs";
import { t as $$LocationPill } from "./LocationPill_nKhn_kl9.mjs";
// src/pages/canciones.astro
var canciones_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Canciones,
	file: () => $$file,
	url: () => $$url
});
var $$Canciones = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Pedir música | Karaoke & Bar" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<nav class="top-row" aria-label="Navegación de sección"><a class="back-link" href="/menu">← Menú</a><span class="step-label">MÚSICA · 01</span></nav>${renderComponent($$result, "PageHeading", $$PageHeading, {
		"eyebrow": "CATÁLOGO MUSICAL",
		"title": "Elige tu canción.",
		"description": "¡Tú tienes el micrófono! Puedes pedir hasta 2 canciones."
	})}${renderComponent($$result, "LocationPill", $$LocationPill, {})}<aside class="music-cart-strip" aria-live="polite"><div class="cart-info"><span class="cart-mini-icon" aria-hidden="true">♫</span><span><strong>Tu selección</strong><small><b id="song-count">0/2</b> canciones</small></span></div><a href="/resumen-musica" id="song-summary-link" class="btn btn-primary btn-small">Ver resumen →</a></aside><section class="filter-panel" aria-label="Filtros de canciones"><label class="search-field" for="song-search"><span aria-hidden="true">⌕</span><input id="song-search" type="search" placeholder="Buscar canción o artista..." autocomplete="off"></label><div class="filter-row"><select id="genre-filter" aria-label="Filtrar por género"><option value="">Todos los géneros</option></select><select id="language-filter" aria-label="Filtrar por idioma"><option value="">Todos los idiomas</option></select></div></section><section aria-labelledby="catalog-heading"><header class="section-title"><h2 id="catalog-heading">Catálogo</h2><span>Recomendadas para ti</span></header><div id="song-list" class="song-list"></div><nav class="song-pagination" id="song-pagination" aria-label="Paginación de canciones" hidden><button type="button" id="song-page-prev" class="btn btn-outline" disabled>← Anterior</button><span id="song-page-info" aria-live="polite">Página 1</span><button type="button" id="song-page-next" class="btn btn-outline" disabled>Siguiente →</button></nav></section>${renderScript($$result, "E:/zkaraoke/src/pages/canciones.astro?astro&type=script&index=0&lang.ts")}` })}`;
}, "E:/zkaraoke/src/pages/canciones.astro", void 0);
var $$file = "E:/zkaraoke/src/pages/canciones.astro";
var $$url = "/canciones";
// \0virtual:astro:page:src/pages/canciones@_@astro
var page = () => canciones_exports;
export { page };
