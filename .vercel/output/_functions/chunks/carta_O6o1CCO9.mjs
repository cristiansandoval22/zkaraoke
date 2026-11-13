import { t as __exportAll } from "./rolldown-runtime_D8jQpDG7.mjs";
import { h as addAttribute, l as renderTemplate, r as renderComponent, u as maybeRenderHead } from "./server_Dflk56LB.mjs";
import { t as createComponent } from "./astro-component_Muq-HobA.mjs";
import { t as createAstro } from "./astro-global_DHcZqO7I.mjs";
import { t as renderScript } from "./script_DpONasWa.mjs";
import "./compiler_hRCWSfR6.mjs";
import { n as $$BaseLayout, t as $$PageHeading } from "./PageHeading_DRuvX4uc.mjs";
import { t as $$LocationPill } from "./LocationPill_nKhn_kl9.mjs";
// src/components/BottomCartBar.astro
createAstro("https://astro.build");
var $$BottomCartBar = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$BottomCartBar;
	const { label = "Ver resumen", href = "/resumen-carta", countId = "food-count", totalId = "food-total" } = Astro.props;
	return renderTemplate`${maybeRenderHead($$result)}<div class="bottom-cart-bar" id="bottom-cart-bar"><div><strong${addAttribute(countId, "id")}>0 productos</strong><small${addAttribute(totalId, "id")}>S/ 0.00</small></div><a class="btn btn-primary"${addAttribute(href, "href")}>${label}<span>→</span></a></div>`;
}, "E:/zkaraoke/src/components/BottomCartBar.astro", void 0);
// src/pages/carta.astro
var carta_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Carta,
	file: () => $$file,
	url: () => $$url
});
var $$Carta = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Carta | Karaoke & Bar" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="top-row"><a class="back-link" href="/menu">← Menú</a><span class="step-label">CARTA · 01</span></div>${renderComponent($$result, "PageHeading", $$PageHeading, {
		"eyebrow": "CARTA & BAR",
		"title": "Algo rico para compartir.",
		"description": "Agrega tus favoritos. Puedes ajustar las cantidades aquí mismo."
	})}${renderComponent($$result, "LocationPill", $$LocationPill, {})}<label class="search-field product-search"><span>⌕</span><input id="product-search" type="search" placeholder="Buscar en la carta..."></label><div class="category-tabs" id="menu-category-tabs" aria-label="Filtrar por categoría"></div><div id="product-list" class="product-grid"></div>${renderComponent($$result, "BottomCartBar", $$BottomCartBar, {})}${renderScript($$result, "E:/zkaraoke/src/pages/carta.astro?astro&type=script&index=0&lang.ts")}` })}`;
}, "E:/zkaraoke/src/pages/carta.astro", void 0);
var $$file = "E:/zkaraoke/src/pages/carta.astro";
var $$url = "/carta";
// \0virtual:astro:page:src/pages/carta@_@astro
var page = () => carta_exports;
export { page };
