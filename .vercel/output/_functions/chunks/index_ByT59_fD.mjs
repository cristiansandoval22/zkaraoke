import { t as __exportAll } from "./rolldown-runtime_D8jQpDG7.mjs";
import { d as renderHead, h as addAttribute, l as renderTemplate, o as renderSlot, r as renderComponent, u as maybeRenderHead } from "./server_Dflk56LB.mjs";
import { t as createComponent } from "./astro-component_Muq-HobA.mjs";
import { t as createAstro } from "./astro-global_DHcZqO7I.mjs";
import { t as renderScript } from "./script_DpONasWa.mjs";
import "./compiler_hRCWSfR6.mjs";
// src/layouts/AdminLayout.astro
var $$AdminLayout = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#11111b"><title>Z-Karaoke | Administración</title>${renderHead($$result)}</head><body>${renderSlot($$result, $$slots["default"])}</body></html>`;
}, "E:/zkaraoke/src/layouts/AdminLayout.astro", void 0);
// src/components/AdminSidebar.astro
var $$AdminSidebar = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${maybeRenderHead($$result)}<aside class="sidebar" id="sidebar"><a class="admin-brand" href="/admin"><span class="brand-symbol">Z</span><span><strong>Z-KARAOKE</strong><small>ADMIN PANEL</small></span></a><div class="nav-caption">GENERAL</div><nav class="admin-nav"><button class="nav-item active" data-view="overview"><span>▦</span>Resumen</button></nav><div class="nav-caption">GESTIÓN DEL CATÁLOGO</div><nav class="admin-nav"><button class="nav-item" data-view="songs"><span>♫</span> Canciones</button><!-- <button class="nav-item" data-view="artists">
      <span>♬</span> Artistas
    </button> --><button class="nav-item" data-view="products"><span>▣</span> Carta / Productos</button><button class="nav-item" data-view="categories"><span>▤</span> Categorías</button><button class="nav-item" data-view="tables"><span>▦</span> Mesas y barra</button></nav><div class="nav-caption">SISTEMA</div><nav class="admin-nav"><button class="nav-item" data-view="settings"><span>⚙</span>Configuración</button></nav><div class="sidebar-bottom"><div class="profile-chip"><span class="avatar">Z</span><span><strong id="admin-email">Administrador</strong><small>Acceso autorizado</small></span></div><button class="logout-btn" id="logout-btn">↪ Cerrar sesión</button></div></aside>`;
}, "E:/zkaraoke/src/components/AdminSidebar.astro", void 0);
// src/components/StatCard.astro
createAstro("https://astro.build");
var $$StatCard = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$StatCard;
	const { label, value, detail, icon, tone = "violet", id } = Astro.props;
	return renderTemplate`${maybeRenderHead($$result)}<article${addAttribute(`stat-card ${tone}`, "class")}><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon}</span></div><strong class="stat-value"${addAttribute(id, "id")}>${value}</strong><small>${detail}</small></article>`;
}, "E:/zkaraoke/src/components/StatCard.astro", void 0);
// src/components/Modal.astro
var $$Modal = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${maybeRenderHead($$result)}<div class="modal-backdrop" id="modal-backdrop" hidden><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><div class="modal-title-group"><div class="modal-song-icon" aria-hidden="true">♫</div><div><p class="eyebrow" id="modal-eyebrow">GESTIÓN</p><h2 id="modal-title">Nuevo registro</h2><p class="modal-subtitle" id="modal-subtitle"></p></div></div><button class="icon-btn" id="modal-close" aria-label="Cerrar">×</button></div><form id="record-form"><div id="modal-fields" class="form-grid"></div><div class="modal-actions"><button type="button" class="btn btn-ghost" id="modal-cancel">Cancelar</button><button class="btn btn-primary" id="modal-save" type="submit">Guardar cambios</button></div></form></section></div>`;
}, "E:/zkaraoke/src/components/Modal.astro", void 0);
// src/pages/admin/index.astro
var admin_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	url: () => $$url
});
var $$Index = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, {}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="login-screen" id="login-screen"><div class="login-card"><div class="login-logo">Z</div><p class="eyebrow">Z-KARAOKE · ADMINISTRACIÓN</p><h1>Bienvenido de nuevo</h1><p class="login-subtitle">Ingresa con tu cuenta autorizada para administrar el local.</p><form id="login-form"><label>Correo electrónico<input type="email" name="email" placeholder="admin@zkaraoke.com" autocomplete="username" required></label><label>Contraseña<input type="password" name="password" placeholder="••••••••" autocomplete="current-password" required></label><p class="form-error" id="login-error" aria-live="polite"></p><button class="btn btn-primary btn-block" type="submit" id="login-submit">Iniciar sesión <span>→</span></button></form><small class="login-foot">Acceso privado · Protegido por Supabase Auth + RLS</small></div></div><div class="admin-app" id="admin-app" hidden>${renderComponent($$result, "AdminSidebar", $$AdminSidebar, {})}<div class="main-area"><header class="topbar"><button class="mobile-menu" id="mobile-menu" aria-label="Abrir menú">☰</button><div class="breadcrumb"><span>Panel</span><b>/</b><strong id="breadcrumb-current">Resumen</strong></div><div class="topbar-right"><span class="status-pill"><i></i><span id="business-status">Comprobando</span></span><span class="top-avatar">Z</span></div></header><main class="content"><section class="view-section active" id="view-overview"><div class="page-title-row"><div><p class="eyebrow">VISTA GENERAL</p><h1>Resumen del negocio</h1><p class="subheading">Controla el catálogo y la configuración de Z-Karaoke desde un solo lugar.</p></div><span class="date-chip" id="today-date"></span></div><div class="stats-grid">${renderComponent($$result, "StatCard", $$StatCard, {
		"label": "Canciones registradas",
		"value": "—",
		"detail": "Catálogo musical",
		"icon": "♫",
		"id": "stat-songs"
	})}${renderComponent($$result, "StatCard", $$StatCard, {
		"label": "Artistas",
		"value": "—",
		"detail": "Biblioteca de artistas",
		"icon": "♬",
		"tone": "blue",
		"id": "stat-artists"
	})}${renderComponent($$result, "StatCard", $$StatCard, {
		"label": "Productos en carta",
		"value": "—",
		"detail": "Productos registrados",
		"icon": "▣",
		"tone": "orange",
		"id": "stat-products"
	})}${renderComponent($$result, "StatCard", $$StatCard, {
		"label": "Mesas activas",
		"value": "—",
		"detail": "Mesas y espacios habilitados",
		"icon": "▦",
		"tone": "green",
		"id": "stat-tables"
	})}</div><div class="dashboard-grid"><article class="panel-card welcome-card"><div><p class="eyebrow">CENTRO DE CONTROL</p><h2>Tu local, bajo control.</h2><p>Administra las canciones que tus clientes pueden pedir, actualiza la carta y mantén los datos del negocio al día.</p><button class="btn btn-primary" data-go="songs">Administrar canciones <span>→</span></button></div><div class="welcome-art">♫</div></article><article class="panel-card quick-panel"><div class="panel-heading"><div><h3>Accesos rápidos</h3><p>Acciones frecuentes</p></div></div><button class="quick-link" data-action="new-song"><span class="quick-icon purple">♫</span><span><strong>Agregar canción</strong><small>Incorpora un nuevo tema</small></span><b>↗</b></button><button class="quick-link" data-action="new-product"><span class="quick-icon orange">▣</span><span><strong>Nuevo producto</strong><small>Actualiza tu carta</small></span><b>↗</b></button><button class="quick-link" data-go="settings"><span class="quick-icon green">⚙</span><span><strong>Datos del negocio</strong><small>Horario y WhatsApp</small></span><b>↗</b></button></article></div><article class="panel-card info-panel"><div class="panel-heading"><div><h3>Estado de configuración</h3><p>Información recuperada de Supabase</p></div><button class="text-button" data-go="settings">Editar configuración →</button></div><div class="info-grid"><div><small>Nombre comercial</small><strong id="info-business">—</strong></div><div><small>WhatsApp</small><strong id="info-whatsapp">—</strong></div><div><small>Límite de canciones</small><strong id="info-limit">—</strong></div><div><small>Horario</small><strong id="info-schedule">—</strong></div></div></article></section><section class="view-section" id="view-songs"><div class="page-title-row"><div><p class="eyebrow">BIBLIOTECA MUSICAL</p><h1>Canciones</h1><p class="subheading">Administra el catálogo que aparece en el módulo de pedidos de música.</p></div><button class="btn btn-primary" data-action="new-song">＋ Nueva canción</button></div><div class="toolbar"><label class="search-box">⌕${" "}<input id="song-search-admin" placeholder="Buscar título o artista..."></label><select id="song-genre-filter"><option value="">Todos los géneros</option></select><select id="song-language-filter"><option value="">Todos los idiomas</option></select><button class="btn btn-ghost" id="song-refresh">↻ Actualizar</button></div><div class="table-wrap"><table><thead><tr><th>CANCIÓN</th><th>ARTISTA</th><th>GÉNERO</th><th>IDIOMA</th><th class="align-right">ACCIONES</th></tr></thead><tbody id="songs-tbody"><tr><td colspan="5" class="table-message">Cargando canciones…</td></tr></tbody></table></div><div class="pagination"><span id="songs-pagination-info">—</span><div><button class="btn btn-ghost btn-small" id="songs-prev">← Anterior</button><button class="btn btn-ghost btn-small" id="songs-next">Siguiente →</button></div></div></section><!-- <ArtistManager /> --><section class="view-section" id="view-products"><div class="page-title-row"><div><p class="eyebrow">MENÚ DEL LOCAL</p><h1>Carta / Productos</h1><p class="subheading">Edita precios, imágenes y disponibilidad de los productos.</p></div><button class="btn btn-primary" data-action="new-product">＋ Nuevo producto</button></div><div class="toolbar"><label class="search-box">⌕${" "}<input id="product-search-admin" placeholder="Buscar producto..."></label><select id="product-category-filter"><option value="">Todas las categorías</option></select><select id="product-status-filter"><option value="">Todos los estados</option><option value="true">Disponibles</option><option value="false">Agotados</option></select><button class="btn btn-ghost" id="product-refresh">↻ Actualizar</button></div><div class="products-grid" id="products-grid"><div class="table-message">Cargando productos…</div></div></section><section class="view-section" id="view-categories"><div class="page-title-row"><div><p class="eyebrow">ORGANIZACIÓN DE CARTA</p><h1>Categorías</h1><p class="subheading">Organiza los productos que se muestran en la carta.</p></div><button class="btn btn-primary" data-action="new-category">＋ Nueva categoría</button></div><div class="category-grid" id="categories-grid"></div></section><section class="view-section" id="view-tables"><div class="page-title-row"><div><p class="eyebrow">DISTRIBUCIÓN DEL LOCAL</p><h1>Mesas y barra</h1><p class="subheading">Configura los espacios disponibles para que los clientes seleccionen su ubicación.</p></div><button class="btn btn-primary" data-action="new-table">＋ Nuevo espacio</button></div><div class="tables-grid" id="tables-grid"></div></section><section class="view-section" id="view-settings"><div class="page-title-row"><div><p class="eyebrow">PERSONALIZACIÓN</p><h1>Configuración</h1><p class="subheading">Actualiza la información que utiliza el frontend de clientes.</p></div></div><form class="settings-form panel-card" id="settings-form"><div class="settings-section"><h3>Información del negocio</h3><p>Datos principales que verá el cliente.</p><div class="form-grid"><label>Nombre comercial<input name="business_name" required></label><label>Dirección<input name="address" placeholder="Dirección del local"></label><label>WhatsApp principal<input name="whatsapp_number" inputmode="tel" placeholder="519XXXXXXXX"></label><label>WhatsApp de barra / caja<input name="whatsapp_bar" inputmode="tel" placeholder="519XXXXXXXX"></label><label>Horario de atención<input name="schedule" placeholder="Lunes a domingo desde las 6pm"></label><label>Máximo de canciones por pedido<input name="max_songs_per_order" type="number" min="1" max="20" required></label></div></div><div class="settings-section"><h3>Identidad y disponibilidad</h3><p>Logo y estado de atención del local.</p><div class="form-grid"><label>URL del logotipo<input name="logo_url" type="url" placeholder="https://..."></label><label class="toggle-field">Local abierto para pedidos${" "}<input name="is_open" type="checkbox"><span>Permite que el frontend indique que el local está atendiendo.</span></label></div><div class="logo-preview" id="logo-preview"></div></div><div class="settings-actions"><span id="settings-feedback" class="inline-feedback"></span><button class="btn btn-primary" type="submit">Guardar configuración</button></div></form></section></main></div></div>${renderComponent($$result, "Modal", $$Modal, {})}<div class="toast" id="toast" role="status" aria-live="polite"></div>${renderScript($$result, "E:/zkaraoke/src/pages/admin/index.astro?astro&type=script&index=0&lang.ts")}` })}`;
}, "E:/zkaraoke/src/pages/admin/index.astro", void 0);
var $$file = "E:/zkaraoke/src/pages/admin/index.astro";
var $$url = "/admin";
// \0virtual:astro:page:src/pages/admin/index@_@astro
var page = () => admin_exports;
export { page };
