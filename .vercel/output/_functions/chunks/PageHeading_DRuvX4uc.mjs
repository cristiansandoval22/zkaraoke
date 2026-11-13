import { d as renderHead, l as renderTemplate, o as renderSlot, r as renderComponent, u as maybeRenderHead } from "./server_Dflk56LB.mjs";
import { t as createComponent } from "./astro-component_Muq-HobA.mjs";
import { t as createAstro } from "./astro-global_DHcZqO7I.mjs";
import "./compiler_hRCWSfR6.mjs";
// src/components/Header.astro
createAstro("https://astro.build");
var $$Header = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Header;
	const { compact = false } = Astro.props;
	return renderTemplate`${maybeRenderHead($$result)}<header class="site-header"><a class="brand" href="/" aria-label="Karaoke &amp; Bar, inicio"><span class="brand-mark">♫</span><span><strong>Z</strong><small>KARAOKE</small></span></a>${!compact && renderTemplate`<span class="header-note"><span class="live-dot"></span> Tu noche, tu música</span>`}</header>`;
}, "E:/zkaraoke/src/components/Header.astro", void 0);
// src/layouts/BaseLayout.astro
createAstro("https://astro.build");
var $$BaseLayout = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$BaseLayout;
	const { title = "Karaoke & Bar" } = Astro.props;
	return renderTemplate`<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#10101a"><meta name="description" content="Pide canciones, comida y bebidas en Karaoke &amp; Bar."><title>${title}</title>${renderHead($$result)}</head><body>${renderComponent($$result, "Header", $$Header, {})}<main class="page-shell">${renderSlot($$result, $$slots["default"])}</main></body></html>`;
}, "E:/zkaraoke/src/layouts/BaseLayout.astro", void 0);
// src/components/PageHeading.astro
createAstro("https://astro.build");
var $$PageHeading = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$PageHeading;
	const { eyebrow, title, description } = Astro.props;
	return renderTemplate`${maybeRenderHead($$result)}<div class="page-heading">${eyebrow && renderTemplate`<p class="eyebrow">${eyebrow}</p>`}<h1>${title}</h1>${description && renderTemplate`<p class="muted">${description}</p>`}</div>`;
}, "E:/zkaraoke/src/components/PageHeading.astro", void 0);
export { $$BaseLayout as n, $$PageHeading as t };
