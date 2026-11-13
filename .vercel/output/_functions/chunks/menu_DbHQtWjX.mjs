import { t as __exportAll } from "./rolldown-runtime_D8jQpDG7.mjs";
import { h as addAttribute, l as renderTemplate, r as renderComponent, u as maybeRenderHead } from "./server_Dflk56LB.mjs";
import { t as createComponent } from "./astro-component_Muq-HobA.mjs";
import { t as createAstro } from "./astro-global_DHcZqO7I.mjs";
import { t as renderScript } from "./script_DpONasWa.mjs";
import "./compiler_hRCWSfR6.mjs";
import { n as $$BaseLayout, t as $$PageHeading } from "./PageHeading_DRuvX4uc.mjs";
import { t as $$LocationPill } from "./LocationPill_nKhn_kl9.mjs";
// src/components/ModuleCard.astro
createAstro("https://astro.build");
var $$ModuleCard = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$ModuleCard;
	const { href, icon, title, description, tone = "purple", action } = Astro.props;
	return renderTemplate`${maybeRenderHead($$result)}<a${addAttribute(`module-card ${tone}`, "class")}${addAttribute(href, "href")}><span class="module-icon">${icon}</span><span class="module-copy"><strong>${title}</strong><small>${description}</small></span><span class="module-arrow">↗</span></a>`;
}, "E:/zkaraoke/src/components/ModuleCard.astro", void 0);
// src/pages/menu.astro
var menu_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Menu,
	file: () => $$file,
	url: () => $$url
});
var $$Menu = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Menú principal | Karaoke & Bar" }, { "default": ($$result) => renderTemplate`${renderComponent($$result, "PageHeading", $$PageHeading, {
		"eyebrow": "MENÚ PRINCIPAL",
		"title": "¿Qué te provoca?",
		"description": "Elige un módulo. Puedes hacer ambos pedidos por separado."
	})}${renderComponent($$result, "LocationPill", $$LocationPill, {})}${maybeRenderHead($$result)}<div class="module-list">${renderComponent($$result, "ModuleCard", $$ModuleCard, {
		"href": "/canciones",
		"icon": "🎤",
		"title": "Pedir música",
		"description": "Busca tus canciones favoritas y envíalas al DJ.",
		"tone": "purple"
	})}${renderComponent($$result, "ModuleCard", $$ModuleCard, {
		"href": "/carta",
		"icon": "🍻",
		"title": "Comida y bebidas",
		"description": "Explora la carta y pide directo a caja o barra.",
		"tone": "orange"
	})}</div><a class="back-link" href="/">← Cambiar mesa o barra</a>${renderScript($$result, "E:/zkaraoke/src/pages/menu.astro?astro&type=script&index=0&lang.ts")}` })}`;
}, "E:/zkaraoke/src/pages/menu.astro", void 0);
var $$file = "E:/zkaraoke/src/pages/menu.astro";
var $$url = "/menu";
// \0virtual:astro:page:src/pages/menu@_@astro
var page = () => menu_exports;
export { page };
