import { t as __exportAll } from "./rolldown-runtime_D8jQpDG7.mjs";
import { l as renderTemplate, r as renderComponent, u as maybeRenderHead } from "./server_Dflk56LB.mjs";
import { t as createComponent } from "./astro-component_Muq-HobA.mjs";
import { t as renderScript } from "./script_DpONasWa.mjs";
import "./compiler_hRCWSfR6.mjs";
import { n as $$BaseLayout, t as $$PageHeading } from "./PageHeading_DRuvX4uc.mjs";
// src/pages/resumen-musica.astro
var resumen_musica_exports = /* @__PURE__ */ __exportAll({
	default: () => $$ResumenMusica,
	file: () => $$file,
	url: () => $$url
});
var $$ResumenMusica = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Resumen musical | Karaoke & Bar" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<a class="back-link" href="/canciones">← Volver al catálogo</a>${renderComponent($$result, "PageHeading", $$PageHeading, {
		"eyebrow": "CASI LISTO",
		"title": "Tu pedido musical.",
		"description": "Revisa tu selección antes de enviarla al DJ."
	})}<div class="summary-card"><div class="summary-card-head"><strong>🎤 Canciones elegidas</strong><span id="music-summary-count">0 de 2 canciones seleccionadas</span></div><div id="music-summary-list"></div></div><label class="field-label" for="music-note">Dedicatoria o nota <span>Opcional</span></label><textarea id="music-note" class="textarea" rows="3" placeholder="Ej. Esta canción va para mis amigos de la mesa..."></textarea><div class="notice">El DJ recibirá tu pedido con la ubicación seleccionada. El orden de reproducción dependerá de la cola musical.</div><button class="btn btn-whatsapp btn-full" id="send-music">Enviar pedido de música por WhatsApp <span>↗</span></button>${renderScript($$result, "E:/zkaraoke/src/pages/resumen-musica.astro?astro&type=script&index=0&lang.ts")}` })}`;
}, "E:/zkaraoke/src/pages/resumen-musica.astro", void 0);
var $$file = "E:/zkaraoke/src/pages/resumen-musica.astro";
var $$url = "/resumen-musica";
// \0virtual:astro:page:src/pages/resumen-musica@_@astro
var page = () => resumen_musica_exports;
export { page };
