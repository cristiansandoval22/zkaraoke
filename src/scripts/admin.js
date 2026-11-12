import { supabase } from "./supabase.js";

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const state = {
  user: null,
  settings: null,
  genres: [],
  languages: [],
  artists: [],
  categories: [],
  songPage: 0,
  songPageSize: 30,
  songTotal: 0,
  songSearchTimer: null,
  artistPage: 0,
  artistPageSize: 30,
  artistTotal: 0,
  artistSearchTimer: null,
  currentView: "overview",
};
const money = (v) => `S/ ${Number(v || 0).toFixed(2)}`;
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function toast(message, type = "ok") {
  const node = $("#toast");
  node.textContent = message;
  node.className = `toast show ${type}`;
  clearTimeout(window.__adminToast);
  window.__adminToast = setTimeout(() => node.classList.remove("show"), 3000);
}
function errorMessage(error) {
  const text = error?.message || "Ocurrió un error inesperado.";
  if (/row-level security|permission denied|not allowed/i.test(text))
    return "Supabase bloqueó esta operación. Verifica que tu usuario sea administrador y las políticas RLS.";
  return text;
}
// Vacía la versión pública guardada para que los cambios del panel se vean pronto.
async function revalidatePublicCache(tags) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return false;

  try {
    const response = await fetch("/api/cache/revalidate.json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ tags }),
    });
    return response.ok;
  } catch (error) {
    console.error("No se pudo actualizar la caché pública:", error);
    return false;
  }
}
function cacheUpdateMessage() {
  return "Se guardó el cambio, pero no se pudo actualizar la caché. El contenido público puede tardar en renovarse.";
}
function showLogin(message = "") {
  $("#login-screen").hidden = false;
  $("#admin-app").hidden = true;
  $("#login-error").textContent = message;
}
function showApp() {
  $("#login-screen").hidden = true;
  $("#admin-app").hidden = false;
  $("#admin-email").textContent = state.user?.email || "Administrador";
  $("#today-date").textContent = new Intl.DateTimeFormat("es-PE", {
    dateStyle: "full",
  }).format(new Date());
}
async function verifyAdmin(user) {
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}
async function boot() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return showLogin();
  try {
    const allowed = await verifyAdmin(session.user);
    if (!allowed) {
      await supabase.auth.signOut();
      return showLogin("Esta cuenta no tiene permisos de administrador.");
    }
    state.user = session.user;
    showApp();
    await loadAll();
  } catch (error) {
    showLogin(`No se pudo validar el acceso: ${errorMessage(error)}`);
  }
}
$("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const button = $("#login-submit");
  button.disabled = true;
  button.textContent = "Verificando…";
  $("#login-error").textContent = "";
  const { data, error } = await supabase.auth.signInWithPassword({
    email: form.get("email"),
    password: form.get("password"),
  });
  button.disabled = false;
  button.innerHTML = "Iniciar sesión <span>→</span>";
  if (error) return ($("#login-error").textContent = errorMessage(error));
  try {
    const allowed = await verifyAdmin(data.user);
    if (!allowed) {
      await supabase.auth.signOut();
      return ($("#login-error").textContent =
        "Tu cuenta inició sesión, pero no está registrada en admin_users.");
    }
    state.user = data.user;
    showApp();
    await loadAll();
  } catch (err) {
    $("#login-error").textContent = errorMessage(err);
  }
});
$("#logout-btn").addEventListener("click", async () => {
  await supabase.auth.signOut();
  state.user = null;
  showLogin();
});
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") showLogin();
  if (event === "TOKEN_REFRESHED" && session) state.user = session.user;
});

async function loadAll() {
  await Promise.allSettled([
    loadOverview(),
    loadReferences(),
    loadSongs(),
    loadProducts(),
    loadCategories(),
    loadTables(),
    loadSettings(),
  ]);
}
async function countRows(table, filter) {
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count, error } = await q;
  if (error) throw error;
  return count || 0;
}
async function loadOverview() {
  const results = await Promise.all([
    countRows("songs"),
    countRows("artists"),
    countRows("menu_items"),
    countRows("tables", (q) => q.eq("active", true)),
  ]);
  ["stat-songs", "stat-artists", "stat-products", "stat-tables"].forEach(
    (id, i) => {
      const node = document.getElementById(id);
      if (node) node.textContent = results[i].toLocaleString("es-PE");
    },
  );
  const { data } = await supabase
    .from("settings")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  if (data) {
    state.settings = data;
    $("#business-status").textContent = data.is_open
      ? "Local abierto"
      : "Local cerrado";
    $("#info-business").textContent = data.business_name || "—";
    $("#info-whatsapp").textContent = data.whatsapp_number || "Sin configurar";
    $("#info-limit").textContent = `${data.max_songs_per_order} canciones`;
    $("#info-schedule").textContent = data.schedule || "Sin configurar";
    $(".status-pill").classList.toggle("closed", !data.is_open);
  }
}
async function loadReferences() {
  const [g, l, a, c] = await Promise.all([
    supabase.from("genres").select("id,name").order("name"),
    supabase.from("languages").select("id,name").order("name"),
    supabase.from("artists").select("id,name").order("name").limit(5000),
    supabase
      .from("menu_categories")
      .select("id,name,icon,display_order")
      .order("display_order"),
  ]);
  for (const result of [g, l, a, c]) if (result.error) throw result.error;
  state.genres = g.data || [];
  state.languages = l.data || [];
  state.artists = a.data || [];
  state.categories = c.data || [];
  fillSelect($("#song-genre-filter"), state.genres, "Todos los géneros");
  fillSelect($("#song-language-filter"), state.languages, "Todos los idiomas");
  fillSelect(
    $("#product-category-filter"),
    state.categories,
    "Todas las categorías",
  );
}
function fillSelect(node, rows, placeholder, selected = "") {
  if (!node) return;
  const old = selected || node.value;
  node.innerHTML =
    `<option value="">${esc(placeholder)}</option>` +
    rows
      .map((r) => `<option value="${esc(r.id)}">${esc(r.name)}</option>`)
      .join("");
  if (old) node.value = old;
}
function debounceSongSearch() {
  clearTimeout(state.songSearchTimer);
  state.songSearchTimer = setTimeout(() => {
    state.songPage = 0;
    loadSongs();
  }, 350);
}
async function loadSongs() {
  const tbody = $("#songs-tbody");
  if (!tbody) return;
  tbody.innerHTML =
    '<tr><td colspan="5" class="table-message">Cargando canciones…</td></tr>';
  let q = supabase
    .from("songs")
    .select(
      "id,title,artist_id,genre_id,language_id,artists(name),genres(name),languages(name)",
      { count: "exact" },
    );
  const term = $("#song-search-admin")?.value.trim();
  const genre = $("#song-genre-filter")?.value;
  const language = $("#song-language-filter")?.value;
  if (term) {
    const matchingArtistIds = state.artists
      .filter((artist) =>
        artist.name.toLowerCase().includes(term.toLowerCase()),
      )
      .map((artist) => artist.id);
    const safeTerm = term.replace(/[,%()]/g, " ").trim();
    const artistClause = matchingArtistIds.length
      ? `,artist_id.in.(${matchingArtistIds.join(",")})`
      : "";
    q = q.or(`title.ilike.%${safeTerm}%${artistClause}`);
  }
  if (genre) q = q.eq("genre_id", genre);
  if (language) q = q.eq("language_id", language);
  const from = state.songPage * state.songPageSize;
  const { data, error, count } = await q
    .order("title")
    .range(from, from + state.songPageSize - 1);
  if (error) {
    tbody.innerHTML = `<tr><td colspan="5" class="table-message error-text">${esc(errorMessage(error))}</td></tr>`;
    return;
  }
  state.songTotal = count || 0;
  tbody.innerHTML = data.length
    ? data
        .map(
          (song) => `<tr>
    <td><div class="primary-cell"><span class="song-symbol">♫</span><strong>${esc(song.title)}</strong></div></td>
    <td>${esc(song.artists?.name || "—")}</td><td><span class="soft-tag">${esc(song.genres?.name || "—")}</span></td><td>${esc(song.languages?.name || "—")}</td>
    <td class="align-right"><button class="row-action" data-edit-song="${song.id}">Editar</button><button class="row-action danger" data-delete-song="${song.id}" data-delete-title="${esc(song.title)}">Eliminar</button></td>
  </tr>`,
        )
        .join("")
    : '<tr><td colspan="5" class="table-message">No se encontraron canciones.</td></tr>';
  $("#songs-pagination-info").textContent =
    `${state.songTotal.toLocaleString("es-PE")} canciones · Página ${state.songPage + 1} de ${Math.max(1, Math.ceil(state.songTotal / state.songPageSize))}`;
  $("#songs-prev").disabled = state.songPage === 0;
  $("#songs-next").disabled = from + state.songPageSize >= state.songTotal;
}
async function loadArtists() {
  const grid = $("#artists-grid");
  if (!grid) return;
  grid.innerHTML = '<p class="table-message">Cargando artistas…</p>';
  const term = $("#artist-search-admin")?.value.trim().replace(/[%_,]/g, " ");
  const from = state.artistPage * state.artistPageSize;
  let query = supabase
    .from("artists")
    .select("id,name,image_url", { count: "exact" })
    .order("name")
    .range(from, from + state.artistPageSize - 1);
  if (term) query = query.ilike("name", `%${term}%`);
  const { data, error, count } = await query;
  if (error) {
    grid.innerHTML = `<p class="table-message error-text">${esc(errorMessage(error))}</p>`;
    return;
  }
  state.artistTotal = count || 0;
  grid.innerHTML = data.length
    ? data.map((artist) => {
        let imageUrl = "";
        try {
          const parsed = new URL(artist.image_url || "");
          if (parsed.protocol === "https:") imageUrl = parsed.href;
        } catch {}
        const portrait = imageUrl
          ? `<img src="${esc(imageUrl)}" alt="" loading="lazy" />`
          : "♫";
        return `<article class="artist-admin__card">
          <div class="artist-admin__portrait">${portrait}</div>
          <h2 class="artist-admin__name" title="${esc(artist.name)}">${esc(artist.name)}</h2>
          <div class="artist-admin__actions"><button class="row-action" data-edit-artist="${artist.id}">Editar</button></div>
        </article>`;
      }).join("")
    : '<p class="table-message">No se encontraron artistas.</p>';
  $("#artists-pagination-info").textContent =
    `${state.artistTotal.toLocaleString("es-PE")} artistas · Página ${state.artistPage + 1} de ${Math.max(1, Math.ceil(state.artistTotal / state.artistPageSize))}`;
  $("#artists-prev").disabled = state.artistPage === 0;
  $("#artists-next").disabled = from + state.artistPageSize >= state.artistTotal;
}
async function loadProducts() {
  const grid = $("#products-grid");
  if (!grid) return;
  grid.innerHTML = '<p class="table-message">Cargando carta…</p>';
  let q = supabase
    .from("menu_items")
    .select(
      "id,name,description,price,category_id,image_url,available,menu_categories(name,icon)",
    )
    .order("name");
  const term = $("#product-search-admin")?.value.trim();
  const category = $("#product-category-filter")?.value;
  const available = $("#product-status-filter")?.value;
  if (term) q = q.ilike("name", `%${term}%`);
  if (category) q = q.eq("category_id", category);
  if (available) q = q.eq("available", available === "true");
  const { data, error } = await q;
  if (error) {
    grid.innerHTML = `<p class="table-message error-text">${esc(errorMessage(error))}</p>`;
    return;
  }
  grid.innerHTML = data.length
    ? data
        .map(
          (p) => `<article class="admin-product-card">
    <div class="admin-product-image" style="background-image:url('${esc(p.image_url || "")}')">${p.image_url ? "" : "<span>Sin imagen</span>"}<span class="product-state ${p.available ? "on" : "off"}">${p.available ? "Disponible" : "Agotado"}</span></div>
    <div class="admin-product-body"><small>${esc(p.menu_categories?.icon || "•")} ${esc(p.menu_categories?.name || "Sin categoría")}</small><h3>${esc(p.name)}</h3><p>${esc(p.description || "Sin descripción")}</p><div class="admin-product-footer"><strong>${money(p.price)}</strong><div><button class="row-action" data-edit-product="${p.id}">Editar</button><button class="row-action danger" data-delete-product="${p.id}" data-delete-title="${esc(p.name)}">Eliminar</button></div></div></div>
  </article>`,
        )
        .join("")
    : '<div class="empty-box">No hay productos con estos filtros.</div>';
}
async function loadCategories() {
  const { data, error } = await supabase
    .from("menu_categories")
    .select("*")
    .order("display_order");
  if (error) return toast(errorMessage(error), "error");
  state.categories = data || [];
  fillSelect(
    $("#product-category-filter"),
    state.categories,
    "Todas las categorías",
  );
  $("#categories-grid").innerHTML =
    state.categories
      .map(
        (c) =>
          `<article class="category-card"><div class="category-emoji">${esc(c.icon || "•")}</div><div><strong>${esc(c.name)}</strong><small>Orden de aparición: ${c.display_order}</small></div><div class="category-actions"><button class="row-action" data-edit-category="${c.id}">Editar</button><button class="row-action danger" data-delete-category="${c.id}" data-delete-title="${esc(c.name)}">Eliminar</button></div></article>`,
      )
      .join("") || '<div class="empty-box">No hay categorías.</div>';
}
async function loadTables() {
  const { data, error } = await supabase
    .from("tables")
    .select("*")
    .order("name");
  if (error) return toast(errorMessage(error), "error");
  $("#tables-grid").innerHTML =
    (data || [])
      .map(
        (t) =>
          `<article class="table-space-card"><div class="space-icon">▦</div><div class="space-details"><strong>${esc(t.name)}</strong><small>Capacidad: ${t.capacity} ${t.capacity === 1 ? "persona" : "personas"}</small><span class="product-state ${t.active ? "on" : "off"}">${t.active ? "Activo" : "Inactivo"}</span></div><div class="category-actions"><button class="row-action" data-edit-table="${t.id}">Editar</button><button class="row-action danger" data-delete-table="${t.id}" data-delete-title="${esc(t.name)}">Eliminar</button></div></article>`,
      )
      .join("") || '<div class="empty-box">No hay espacios registrados.</div>';
}
async function loadSettings() {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  if (error) return toast(errorMessage(error), "error");
  if (!data) return;
  state.settings = data;
  const form = $("#settings-form");
  for (const [key, value] of Object.entries(data)) {
    const input = form.elements.namedItem(key);
    if (!input) continue;
    if (input.type === "checkbox") input.checked = Boolean(value);
    else input.value = value ?? "";
  }
  renderLogoPreview(data.logo_url);
  $("#business-status").textContent = data.is_open
    ? "Local abierto"
    : "Local cerrado";
  $(".status-pill").classList.toggle("closed", !data.is_open);
  $("#info-business").textContent = data.business_name || "—";
  $("#info-whatsapp").textContent = data.whatsapp_number || "Sin configurar";
  $("#info-limit").textContent = `${data.max_songs_per_order} canciones`;
  $("#info-schedule").textContent = data.schedule || "Sin configurar";
}
function renderLogoPreview(url) {
  $("#logo-preview").innerHTML = url
    ? `<img src="${esc(url)}" alt="Logo actual" /><span>Vista previa del logotipo</span>`
    : "<span>No hay logotipo configurado.</span>";
}
function setView(view) {
  state.currentView = view;
  $$(".view-section").forEach((s) =>
    s.classList.toggle("active", s.id === `view-${view}`),
  );
  $$(".nav-item").forEach((b) =>
    b.classList.toggle("active", b.dataset.view === view),
  );
  const labels = {
    overview: "Resumen",
    songs: "Canciones",
    artists: "Artistas",
    products: "Carta / Productos",
    categories: "Categorías",
    tables: "Mesas y barra",
    settings: "Configuración",
  };
  $("#breadcrumb-current").textContent = labels[view] || "Panel";
  $("#sidebar").classList.remove("open");
  if (view === "songs") loadSongs();
  if (view === "artists") loadArtists();
  if (view === "products") loadProducts();
  if (view === "categories") loadCategories();
  if (view === "tables") loadTables();
  if (view === "settings") loadSettings();
}
$$("[data-view]").forEach((b) =>
  b.addEventListener("click", () => setView(b.dataset.view)),
);
$$("[data-go]").forEach((b) =>
  b.addEventListener("click", () => setView(b.dataset.go)),
);
$("#mobile-menu").addEventListener("click", () =>
  $("#sidebar").classList.toggle("open"),
);
$("#song-search-admin").addEventListener("input", debounceSongSearch);
$("#artist-search-admin")?.addEventListener("input", () => {
  clearTimeout(state.artistSearchTimer);
  state.artistSearchTimer = setTimeout(() => {
    state.artistPage = 0;
    loadArtists();
  }, 300);
});
$("#artist-refresh")?.addEventListener("click", loadArtists);
$("#artists-prev")?.addEventListener("click", () => {
  state.artistPage = Math.max(0, state.artistPage - 1);
  loadArtists();
});
$("#artists-next")?.addEventListener("click", () => {
  state.artistPage++;
  loadArtists();
});
$("#song-genre-filter").addEventListener("change", () => {
  state.songPage = 0;
  loadSongs();
});
$("#song-language-filter").addEventListener("change", () => {
  state.songPage = 0;
  loadSongs();
});
$("#song-refresh").addEventListener("click", loadSongs);
$("#songs-prev").addEventListener("click", () => {
  state.songPage = Math.max(0, state.songPage - 1);
  loadSongs();
});
$("#songs-next").addEventListener("click", () => {
  state.songPage++;
  loadSongs();
});
$("#product-search-admin").addEventListener("input", () => loadProducts());
["product-category-filter", "product-status-filter"].forEach((id) =>
  document.getElementById(id).addEventListener("change", loadProducts),
);
$("#product-refresh").addEventListener("click", loadProducts);

const backdrop = $("#modal-backdrop"),
  modalForm = $("#record-form");
document.addEventListener("click", (event) => {
  if (event.target.closest(".song-field[data-combobox]")) return;
  $$(".song-field[data-combobox] [data-combobox-options]").forEach((menu) => {
    menu.hidden = true;
  });
  $$(".song-field[data-combobox] [data-combobox-input]").forEach((input) =>
    input.setAttribute("aria-expanded", "false"),
  );
});
function openModal(title, fields, record = {}, onSave) {
  const isSongModal = fields.some(
    (field) => field.type === "combobox" || field.type === "segmented",
  );
  const modal = $(".modal");
  modal.classList.toggle("modal--song", isSongModal);
  $("#modal-title").textContent = title;
  $("#modal-eyebrow").textContent = isSongModal
    ? "REPERTORIO MUSICAL"
    : "GESTIÓN DE CATÁLOGO";
  $("#modal-subtitle").textContent = isSongModal
    ? title.startsWith("Editar")
      ? "Actualiza los datos de esta canción."
      : "Completa los datos para agregarla al repertorio."
    : "";
  $("#modal-fields").innerHTML = fields
    .map((field) => {
      const value = record[field.name] ?? field.value ?? "";
      if (field.type === "song-title") {
        return `<label class="song-field song-field--full"><span class="song-field-label">${field.label}</span>
        <span class="song-input-wrap"><span class="song-input-icon" aria-hidden="true">♫</span>
          <input name="${field.name}" type="text" value="${esc(value)}" placeholder="${esc(field.placeholder || "")}" ${field.required ? "required" : ""} />
        </span></label>`;
      }
      if (field.type === "combobox") {
        const selectedOption = field.options.find(
          (option) => String(option.value) === String(value),
        );
        const selectedLabel = selectedOption?.label || "";
        const options = field.options.filter((option) => option.value !== "");
        const quickOptions = (field.quickOptions || [])
          .map(
            (option) =>
              `<button type="button" class="genre-chip" data-quick-value="${esc(option.value)}">${esc(option.label)}</button>`,
          )
          .join("");
        return `<div class="song-field ${field.full ? "song-field--full" : ""}" data-combobox="${esc(field.name)}">
        <label class="song-field-label" for="search-${esc(field.name)}">${field.label}${field.required ? ' <span class="required-mark">*</span>' : ""}</label>
        ${quickOptions ? `<div class="genre-chips" aria-label="Géneros rápidos">${quickOptions}</div>` : ""}
        <div class="song-input-wrap song-input-wrap--search">
          <span class="song-input-icon" aria-hidden="true">⌕</span>
          <input id="search-${esc(field.name)}" type="search" value="${esc(selectedLabel)}" placeholder="${esc(field.placeholder || "Buscar por nombre...")}" autocomplete="off" aria-autocomplete="list" aria-expanded="false" aria-controls="options-${esc(field.name)}" data-combobox-input />
          <input type="hidden" name="${field.name}" value="${esc(value)}" data-combobox-value />
        </div>
        <div class="song-combobox-menu" id="options-${esc(field.name)}" role="listbox" hidden data-combobox-options></div>
        <small class="song-field-help" data-combobox-help>${selectedLabel ? "Opción seleccionada." : field.help || "Busca y selecciona una opción existente."}</small>
      </div>`;
      }
      if (field.type === "segmented")
        return `<fieldset class="song-field song-field--full song-language-field"><legend class="song-field-label">${field.label}${field.required ? ' <span class="required-mark">*</span>' : ""}</legend><div class="language-options">${field.options.map((option, index) => `<label class="language-option"><input type="radio" name="${field.name}" value="${esc(option.value)}" ${String(option.value) === String(value) || (!value && index === 0) ? "checked" : ""} ${field.required ? "required" : ""}/><span>${esc(option.label)}</span></label>`).join("")}</div></fieldset>`;
      if (field.type === "select")
        return `<label class="${field.full ? "full" : ""}">${field.label}<select name="${field.name}" ${field.required ? "required" : ""}>${field.options.map((o) => `<option value="${esc(o.value)}" ${String(o.value) === String(value) ? "selected" : ""}>${esc(o.label)}</option>`).join("")}</select></label>`;
      if (field.type === "textarea")
        return `<label class="full">${field.label}<textarea name="${field.name}" rows="3" ${field.required ? "required" : ""}>${esc(value)}</textarea></label>`;
      if (field.type === "checkbox")
        return `<label class="checkbox-label full"><input type="checkbox" name="${field.name}" ${value ? "checked" : ""}/> ${field.label}</label>`;
      if (field.type === "file")
        return `<label class="full">${field.label}<input type="file" name="${field.name}" accept="image/*" /></label>`;
      return `<label class="${field.full ? "full" : ""}">${field.label}<input name="${field.name}" type="${field.type || "text"}" value="${esc(value)}" ${field.required ? "required" : ""} ${field.min !== undefined ? `min="${field.min}"` : ""} ${field.step ? `step="${field.step}"` : ""} placeholder="${esc(field.placeholder || "")}" /></label>`;
    })
    .join("");

  // Estos filtros usan los datos ya cargados por el panel; escribir no hace
  // una consulta nueva a Supabase por cada letra.
  $$(".song-field[data-combobox]", $("#modal-fields")).forEach((container) => {
    const fieldName = container.dataset.combobox;
    const field = fields.find((item) => item.name === fieldName);
    const input = $("[data-combobox-input]", container);
    const valueInput = $("[data-combobox-value]", container);
    const menu = $("[data-combobox-options]", container);
    const help = $("[data-combobox-help]", container);
    const options = field.options.filter((option) => option.value !== "");
    const normalize = (text) =>
      text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("es");
    const syncQuickChips = (selectedValue) => {
      container.querySelectorAll("[data-quick-value]").forEach((button) => {
        button.classList.toggle(
          "active",
          button.dataset.quickValue === String(selectedValue),
        );
      });
    };

    const showOptions = () => {
      const query = normalize(input.value.trim());
      const matches = options.filter((option) =>
        normalize(option.label).includes(query),
      );
      const visibleOptions = matches.slice(0, 12);
      menu.innerHTML = visibleOptions.length
        ? visibleOptions
            .map(
              (option) =>
                `<button type="button" class="combobox-option" role="option" data-option-value="${esc(option.value)}">${esc(option.label)}</button>`,
            )
            .join("")
        : '<p class="combobox-empty">No encontramos coincidencias.</p>';
      menu.hidden = false;
      input.setAttribute("aria-expanded", "true");
      help.textContent =
        matches.length > 12
          ? `Mostrando 12 de ${matches.length}. Escribe un poco más para afinar.`
          : `${matches.length} opción${matches.length === 1 ? "" : "es"} encontrada${matches.length === 1 ? "" : "s"}.`;
    };

    input.addEventListener("focus", showOptions);
    input.addEventListener("input", () => {
      valueInput.value = "";
      showOptions();
    });
    menu.addEventListener("click", (event) => {
      const optionButton = event.target.closest("[data-option-value]");
      if (!optionButton) return;
      const chosen = options.find(
        (option) => String(option.value) === optionButton.dataset.optionValue,
      );
      if (!chosen) return;
      valueInput.value = chosen.value;
      input.value = chosen.label;
      syncQuickChips(chosen.value);
      menu.hidden = true;
      input.setAttribute("aria-expanded", "false");
      help.textContent = "Opción seleccionada.";
    });
    container.querySelectorAll("[data-quick-value]").forEach((button) => {
      button.addEventListener("click", () => {
        const chosen = options.find(
          (option) => String(option.value) === button.dataset.quickValue,
        );
        if (!chosen) return;
        valueInput.value = chosen.value;
        input.value = chosen.label;
        menu.hidden = true;
        input.setAttribute("aria-expanded", "false");
        help.textContent = "Opción seleccionada.";
        container
          .querySelectorAll("[data-quick-value]")
          .forEach((chip) => chip.classList.toggle("active", chip === button));
      });
    });
    syncQuickChips(valueInput.value);
  });

  modalForm.onsubmit = async (event) => {
    event.preventDefault();
    const submit = $("#modal-save");
    const fd = new FormData(modalForm);
    const values = {};
    fields.forEach((f) => {
      if (f.type === "file") values[f.name] = fd.get(f.name);
      else if (f.type === "checkbox") values[f.name] = fd.has(f.name);
      else values[f.name] = fd.get(f.name);
    });
    const unselected = fields.find(
      (field) =>
        field.required && field.type === "combobox" && !values[field.name],
    );
    if (unselected) {
      toast(
        `Selecciona una opción existente en "${unselected.label}".`,
        "error",
      );
      $(`[data-combobox="${unselected.name}"] [data-combobox-input]`).focus();
      return;
    }
    submit.disabled = true;
    submit.textContent = "Guardando…";
    try {
      const cacheCleared = await onSave(values);
      closeModal();
      toast(
        cacheCleared === false
          ? cacheUpdateMessage()
          : "Cambios guardados correctamente.",
      );
    } catch (error) {
      toast(errorMessage(error), "error");
    } finally {
      submit.disabled = false;
      submit.textContent = isSongModal ? "Guardar canción" : "Guardar cambios";
    }
  };
  $("#modal-save").textContent = isSongModal
    ? "Guardar canción"
    : "Guardar cambios";
  backdrop.hidden = false;
  document.body.classList.add("modal-open");
}
function closeModal() {
  backdrop.hidden = true;
  document.body.classList.remove("modal-open");
  $(".modal").classList.remove("modal--song");
  modalForm.onsubmit = null;
}
$("#modal-close").addEventListener("click", closeModal);
$("#modal-cancel").addEventListener("click", closeModal);
backdrop.addEventListener("click", (e) => {
  if (e.target === backdrop) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !backdrop.hidden) closeModal();
});

async function artistModal(id = null) {
  const { data: existing, error: loadError } = id
    ? await supabase.from("artists").select("id,name,image_url").eq("id", id).single()
    : { data: {} };
  if (loadError) return toast(errorMessage(loadError), "error");
  openModal(
    id ? "Editar artista" : "Nuevo artista",
    [
      { name: "name", label: "Nombre del artista o banda", required: true, full: true },
      { name: "image_url", label: "URL de imagen", type: "url", placeholder: "https://...", full: true },
    ],
    existing || {},
    async (values) => {
      const rawImageUrl = values.image_url.trim();
      if (rawImageUrl) {
        let parsedImageUrl;
        try {
          parsedImageUrl = new URL(rawImageUrl);
        } catch {
          throw new Error("La URL de imagen no es válida.");
        }
        if (parsedImageUrl.protocol !== "https:") {
          throw new Error("La imagen debe usar una dirección segura HTTPS.");
        }
      }
      const payload = {
        name: values.name.trim(),
        image_url: rawImageUrl || null,
      };
      const result = id
        ? await supabase.from("artists").update(payload).eq("id", id)
        : await supabase.from("artists").insert(payload);
      if (result.error) throw result.error;
      const cacheCleared = await revalidatePublicCache(["artists"]);
      await Promise.all([loadArtists(), loadReferences(), loadOverview()]);
      return cacheCleared;
    },
  );
}

async function songModal(id = null) {
  const { data: existing } = id
    ? await supabase.from("songs").select("*").eq("id", id).single()
    : { data: {} };
  const artistOptions = state.artists.map((a) => ({
    value: a.id,
    label: a.name,
  }));
  const genreOptions = state.genres.map((genre) => ({
    value: genre.id,
    label: genre.name,
  }));
  const popularGenreNames = ["Rock", "Salsa", "Pop", "Cumbia", "Balada"];
  const quickGenres = popularGenreNames
    .map((name) =>
      genreOptions.find(
        (option) =>
          option.label.toLocaleLowerCase("es") === name.toLocaleLowerCase("es"),
      ),
    )
    .filter(Boolean);
  const languageOptions = state.languages.map((language) => ({
    value: language.id,
    label: language.name,
  }));
  const fields = [
    {
      name: "title",
      label: "Título de la canción",
      type: "song-title",
      placeholder: "Ej. Lamento Boliviano",
      required: true,
      full: true,
    },
    {
      name: "artist_id",
      label: "Artista o banda",
      type: "combobox",
      required: true,
      placeholder: "Buscar artista existente...",
      help: "Escribe para encontrar artistas del repertorio.",
      options: artistOptions,
    },
    {
      name: "genre_id",
      label: "Género musical",
      type: "combobox",
      required: true,
      placeholder: "Buscar un género...",
      quickOptions: quickGenres,
      options: genreOptions,
    },
    {
      name: "language_id",
      label: "Idioma",
      type: "segmented",
      required: true,
      options: languageOptions,
    },
  ];
  openModal(
    id ? "Editar canción" : "Agregar canción",
    fields,
    existing || {},
    async (v) => {
      const payload = {
        title: v.title.trim(),
        artist_id: v.artist_id || null,
        genre_id: v.genre_id || null,
        language_id: v.language_id || null,
        updated_at: new Date().toISOString(),
      };
      const result = id
        ? await supabase.from("songs").update(payload).eq("id", id)
        : await supabase.from("songs").insert(payload);
      if (result.error) throw result.error;
      const cacheCleared = await revalidatePublicCache(["songs", "artists"]);
      await loadSongs();
      await loadOverview();
      return cacheCleared;
    },
  );
}
async function productModal(id = null) {
  const { data: existing } = id
    ? await supabase.from("menu_items").select("*").eq("id", id).single()
    : { data: {} };
  const fields = [
    { name: "name", label: "Nombre del producto", required: true, full: true },
    { name: "description", label: "Descripción", type: "textarea", full: true },
    {
      name: "price",
      label: "Precio (S/)",
      type: "number",
      required: true,
      min: 0,
      step: "0.01",
    },
    {
      name: "category_id",
      label: "Categoría",
      type: "select",
      options: [
        { value: "", label: "Seleccionar categoría" },
        ...state.categories.map((x) => ({ value: x.id, label: x.name })),
      ],
    },
    { name: "available", label: "Producto disponible", type: "checkbox" },
    { name: "image_file", label: "Imagen del producto", type: "file" },
  ];
  openModal(
    id ? "Editar producto" : "Nuevo producto",
    fields,
    { ...existing, available: existing?.available ?? true },
    async (v) => {
      let imageUrl = existing?.image_url || null;
      if (v.image_file?.size) {
        const ext =
          v.image_file.name
            .split(".")
            .pop()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "") || "jpg";
        const path = `products/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("menu-images")
          .upload(path, v.image_file, {
            contentType: v.image_file.type,
            upsert: false,
          });
        if (uploadError) throw uploadError;
        imageUrl = supabase.storage.from("menu-images").getPublicUrl(path)
          .data.publicUrl;
      }
      const payload = {
        name: v.name.trim(),
        description: v.description || null,
        price: Number(v.price),
        category_id: v.category_id || null,
        available: v.available,
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      };
      const result = id
        ? await supabase.from("menu_items").update(payload).eq("id", id)
        : await supabase.from("menu_items").insert(payload);
      if (result.error) throw result.error;
      const cacheCleared = await revalidatePublicCache(["menu"]);
      await loadProducts();
      await loadOverview();
      return cacheCleared;
    },
  );
}
async function categoryModal(id = null) {
  const { data: existing } = id
    ? await supabase.from("menu_categories").select("*").eq("id", id).single()
    : { data: {} };
  openModal(
    id ? "Editar categoría" : "Nueva categoría",
    [
      { name: "name", label: "Nombre", required: true },
      { name: "icon", label: "Emoji / icono", placeholder: "🍹" },
      { name: "display_order", label: "Orden", type: "number", min: 0 },
    ],
    existing || { display_order: state.categories.length + 1 },
    async (v) => {
      const payload = {
        name: v.name.trim(),
        icon: v.icon || null,
        display_order: Number(v.display_order || 0),
      };
      const result = id
        ? await supabase.from("menu_categories").update(payload).eq("id", id)
        : await supabase.from("menu_categories").insert(payload);
      if (result.error) throw result.error;
      const cacheCleared = await revalidatePublicCache(["menu"]);
      await loadCategories();
      await loadReferences();
      return cacheCleared;
    },
  );
}
async function tableModal(id = null) {
  const { data: existing } = id
    ? await supabase.from("tables").select("*").eq("id", id).single()
    : { data: {} };
  openModal(
    id ? "Editar espacio" : "Nuevo espacio",
    [
      {
        name: "name",
        label: "Nombre del espacio",
        required: true,
        placeholder: "Mesa 10 o Barra 02",
      },
      {
        name: "capacity",
        label: "Capacidad (personas)",
        type: "number",
        min: 1,
      },
      { name: "active", label: "Espacio activo", type: "checkbox" },
    ],
    {
      ...existing,
      capacity: existing?.capacity ?? 4,
      active: existing?.active ?? true,
    },
    async (v) => {
      const payload = {
        name: v.name.trim(),
        capacity: Number(v.capacity),
        active: v.active,
        updated_at: new Date().toISOString(),
      };
      const result = id
        ? await supabase.from("tables").update(payload).eq("id", id)
        : await supabase.from("tables").insert(payload);
      if (result.error) throw result.error;
      const cacheCleared = await revalidatePublicCache(["tables"]);
      await loadTables();
      await loadOverview();
      return cacheCleared;
    },
  );
}
function confirmDelete(label, callback) {
  if (!confirm(`¿Eliminar "${label}"? Esta acción no se puede deshacer.`))
    return;
  callback()
    .then((cacheCleared) =>
      toast(
        cacheCleared === false ? cacheUpdateMessage() : "Registro eliminado.",
      ),
    )
    .catch((error) => toast(errorMessage(error), "error"));
}
document.addEventListener("click", (event) => {
  const b = event.target.closest("button");
  if (!b) return;
  if (b.dataset.action === "new-song") songModal();
  if (b.dataset.action === "new-artist") artistModal();
  if (b.dataset.action === "new-product") productModal();
  if (b.dataset.action === "new-category") categoryModal();
  if (b.dataset.action === "new-table") tableModal();
  if (b.dataset.editSong) songModal(b.dataset.editSong);
  if (b.dataset.editArtist) artistModal(b.dataset.editArtist);
  if (b.dataset.editProduct) productModal(b.dataset.editProduct);
  if (b.dataset.editCategory) categoryModal(b.dataset.editCategory);
  if (b.dataset.editTable) tableModal(b.dataset.editTable);
  if (b.dataset.deleteSong)
    confirmDelete(b.dataset.deleteTitle, async () => {
      const { error } = await supabase
        .from("songs")
        .delete()
        .eq("id", b.dataset.deleteSong);
      if (error) throw error;
      const cleared = await revalidatePublicCache(["songs", "artists"]);
      await loadSongs();
      await loadOverview();
      return cleared;
    });
  if (b.dataset.deleteProduct)
    confirmDelete(b.dataset.deleteTitle, async () => {
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", b.dataset.deleteProduct);
      if (error) throw error;
      const cleared = await revalidatePublicCache(["menu"]);
      await loadProducts();
      await loadOverview();
      return cleared;
    });
  if (b.dataset.deleteCategory)
    confirmDelete(b.dataset.deleteTitle, async () => {
      const { error } = await supabase
        .from("menu_categories")
        .delete()
        .eq("id", b.dataset.deleteCategory);
      if (error) throw error;
      const cleared = await revalidatePublicCache(["menu"]);
      await loadCategories();
      await loadReferences();
      return cleared;
    });
  if (b.dataset.deleteTable)
    confirmDelete(b.dataset.deleteTitle, async () => {
      const { error } = await supabase
        .from("tables")
        .delete()
        .eq("id", b.dataset.deleteTable);
      if (error) throw error;
      const cleared = await revalidatePublicCache(["tables"]);
      await loadTables();
      await loadOverview();
      return cleared;
    });
});
$("#settings-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const fd = new FormData(form);
  const payload = {
    business_name: fd.get("business_name").trim(),
    address: fd.get("address") || null,
    whatsapp_number: fd.get("whatsapp_number") || null,
    whatsapp_bar: fd.get("whatsapp_bar") || null,
    schedule: fd.get("schedule") || "",
    max_songs_per_order: Number(fd.get("max_songs_per_order")),
    logo_url: fd.get("logo_url") || null,
    is_open: fd.has("is_open"),
    updated_at: new Date().toISOString(),
  };
  const feedback = $("#settings-feedback");
  feedback.textContent = "Guardando…";
  const { error } = await supabase
    .from("settings")
    .update(payload)
    .eq("id", true);
  if (error) {
    feedback.textContent = errorMessage(error);
    return toast(errorMessage(error), "error");
  }
  const cacheCleared = await revalidatePublicCache(["songs", "settings"]);
  feedback.textContent = cacheCleared
    ? "Configuración actualizada."
    : cacheUpdateMessage();
  await loadSettings();
  await loadOverview();
  toast(feedback.textContent);
});
$("#settings-form").elements.logo_url.addEventListener("input", (e) =>
  renderLogoPreview(e.target.value),
);
boot();
