import { t as __exportAll } from "./rolldown-runtime_D8jQpDG7.mjs";
import { l as renderTemplate, r as renderComponent, u as maybeRenderHead } from "./server_Dflk56LB.mjs";
import { t as createComponent } from "./astro-component_Muq-HobA.mjs";
import { t as renderScript } from "./script_DpONasWa.mjs";
import "./compiler_hRCWSfR6.mjs";
import { n as $$BaseLayout, t as $$PageHeading } from "./PageHeading_DRuvX4uc.mjs";
// src/pages/resumen-carta.astro
var resumen_carta_exports = /* @__PURE__ */ __exportAll({
	default: () => $$ResumenCarta,
	file: () => $$file,
	url: () => $$url
});
var $$ResumenCarta = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Resumen de pedido | Karaoke & Bar" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<a class="back-link" href="/carta">← Volver a la carta</a>${renderComponent($$result, "PageHeading", $$PageHeading, {
		"eyebrow": "TU ORDEN",
		"title": "Revisa tu pedido.",
		"description": "Confirma los productos y dinos cómo realizarás el pago."
	})}<div class="summary-card"><div class="summary-card-head"><strong>🛒 Detalle del pedido</strong><a class="text-link" href="/carta">Editar</a></div><div id="food-summary-list"></div><div class="grand-total"><span>Total</span><strong id="food-grand-total">S/ 0.00</strong></div></div><fieldset class="payment-fieldset"><legend>¿Cómo vas a pagar?</legend><div class="payment-options"><label class="payment-option"><input type="radio" name="payment" value="Yape" checked><span>💜</span><strong>Yape</strong></label><label class="payment-option"><input type="radio" name="payment" value="Plin"><span>💚</span><strong>Plin</strong></label><label class="payment-option"><input type="radio" name="payment" value="Tarjeta"><span>💳</span><strong>Tarjeta</strong></label><label class="payment-option"><input type="radio" name="payment" value="Efectivo"><span>💵</span><strong>Efectivo</strong></label></div></fieldset><label class="field-label" for="food-note">Indicaciones para cocina<span>Opcional</span></label><textarea id="food-note" class="textarea" rows="3" placeholder="Ej. Con ají aparte, sin cebolla..."></textarea><div class="notice">El método de pago es informativo para que el personal pueda acercarse preparado. No se realizará ningún cobro desde esta página.</div><button class="btn btn-whatsapp btn-full" id="send-food">Enviar pedido a caja/barra por WhatsApp<span>↗</span></button>${renderScript($$result, "E:/zkaraoke/src/pages/resumen-carta.astro?astro&type=script&index=0&lang.ts")}` })}`;
}, "E:/zkaraoke/src/pages/resumen-carta.astro", void 0);
var $$file = "E:/zkaraoke/src/pages/resumen-carta.astro";
var $$url = "/resumen-carta";
// \0virtual:astro:page:src/pages/resumen-carta@_@astro
var page = () => resumen_carta_exports;
export { page };
