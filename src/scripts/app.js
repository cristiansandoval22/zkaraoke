import { MAX_SONGS } from "./config.js";

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [
  ...scope.querySelectorAll(selector),
];
const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const money = (value) => `S/ ${Number(value).toFixed(2)}`;
const locationName = () => read("kb_location", "");
let publicSettings = { whatsappNumber: "", whatsappBar: "" };
let settingsRequest;
function loadPublicSettings() {
  if (!settingsRequest) {
    settingsRequest = fetch("/api/settings/public.json")
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error("No se pudo cargar la configuración.")),
      )
      .then((settings) => {
        publicSettings = settings;
      })
      .catch((error) =>
        console.error("No se pudo cargar la configuración del negocio:", error),
      );
  }
  return settingsRequest;
}
function updateLocation() {
  const node = $("#current-location");
  if (node) node.textContent = locationName() || "Sin seleccionar";
}
function toast(message) {
  let el = $("#toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.append(el);
  }
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}
async function wa(message, receiver = "main") {
  await loadPublicSettings();
  const configuredNumber =
    receiver === "bar"
      ? publicSettings.whatsappBar || publicSettings.whatsappNumber
      : publicSettings.whatsappNumber;
  const number = configuredNumber.replace(/\D/g, "");
  if (number.length < 10) {
    toast("Configura el número de WhatsApp en el panel de administración.");
    return;
  }
  window.open(
    `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
    "_blank",
    "noopener",
  );
}
loadPublicSettings();

// Mesa / barra: la selección guardada debe seguir existiendo entre los espacios activos.
const locationSelection = $("[data-location-selection]");
if (locationSelection) {
  const locationButtons = $$("[data-location]", locationSelection);
  const continueLocation = $("#continue-location");
  let selectedLocation = locationName();

  if (
    !locationButtons.some(
      (button) => button.dataset.location === selectedLocation,
    )
  ) {
    localStorage.removeItem("kb_location");
    selectedLocation = "";
  }

  locationButtons.forEach((button) => {
    if (button.dataset.location === selectedLocation)
      button.classList.add("selected");
    button.addEventListener("click", () => {
      selectedLocation = button.dataset.location;
      write("kb_location", selectedLocation);
      locationButtons.forEach((item) =>
        item.classList.toggle("selected", item === button),
      );
      if (continueLocation) continueLocation.disabled = false;
      toast(`${selectedLocation} seleccionada`);
    });
  });

  if (continueLocation) {
    continueLocation.disabled = !selectedLocation;
    continueLocation.addEventListener("click", () => {
      if (selectedLocation) window.location.assign("/menu");
    });
  }
}
updateLocation();

// Carrito musical: Astro genera las tarjetas; aquí solo se guarda la selección.
let selectedSongs = read("kb_songs", []);
let maxSongsPerOrder = MAX_SONGS;

function renderSongCount() {
  const count = $("#song-count");
  if (count) count.textContent = `${selectedSongs.length}/${maxSongsPerOrder}`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}

async function loadSongFilters() {
  const response = await fetch("/api/songs/filters.json");
  if (!response.ok)
    throw new Error("No se pudieron cargar los filtros del repertorio.");
  const filters = await response.json();
  maxSongsPerOrder =
    Number(filters.maxSongsPerOrder) > 0
      ? Number(filters.maxSongsPerOrder)
      : MAX_SONGS;

  renderSongCount();
}

function updateSongCardButtons() {
  const songList = $("#song-list");
  if (!songList) return;

  maxSongsPerOrder = Number(songList.dataset.maxSongs) || MAX_SONGS;
  $$("[data-song-card]", songList).forEach((card) => {
    const button = $("[data-add-song]", card);
    const alreadySelected = selectedSongs.some(
      (song) => String(song.id) === button.dataset.addSong,
    );
    button.disabled = alreadySelected;
    button.textContent = alreadySelected ? "Añadida" : "Pedir";
    button.classList.toggle("btn-added", alreadySelected);
    button.classList.toggle("btn-outline", !alreadySelected);
  });
  renderSongCount();
}

$("#song-list")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-song]");
  if (!button || button.disabled) return;

  const card = button.closest("[data-song-card]");
  if (!card) return;

  if (selectedSongs.length >= maxSongsPerOrder) {
    toast(`Máximo ${maxSongsPerOrder} canciones por pedido`);
    return;
  }

  const song = JSON.parse(card.dataset.song);
  selectedSongs.push(song);
  write("kb_songs", selectedSongs);
  updateSongCardButtons();
  toast("Canción agregada a tu pedido");
});

updateSongCardButtons();

// Búsqueda progresiva: Astro entrega cada página con las tarjetas ya renderizadas.
const songSearchForm = $("#song-search")?.form;
let songSearchTimer;
$("#song-search")?.addEventListener("input", () => {
  clearTimeout(songSearchTimer);
  songSearchTimer = setTimeout(() => songSearchForm?.requestSubmit(), 350);
});
$("#genre-filter")?.addEventListener("change", () => songSearchForm?.requestSubmit());
$("#language-filter")?.addEventListener("change", () => songSearchForm?.requestSubmit());

if ($("#music-summary-list")) {
  loadSongFilters()
    .then(renderMusicSummary)
    .catch((error) =>
      console.error("No se pudo cargar el límite de canciones:", error),
    );
}

// Resumen de música
function renderMusicSummary() {
  const list = $("#music-summary-list");
  if (!list) return;
  list.innerHTML = selectedSongs.length
    ? selectedSongs
        .map((song, index) => {
          const artist = song.artists?.length
            ? song.artists.map((item) => item.name).filter(Boolean).join(", ")
            : song.artist?.name || song.artist || "Artista no registrado";
          const genre =
            song.genre?.name || song.genre || "Género no registrado";
          return `
    <div class="summary-line"><div><strong>${escapeHtml(index + 1)}. ${escapeHtml(song.title)}</strong><small>${escapeHtml(artist)} · ${escapeHtml(genre)}</small></div>
      <button class="remove-btn" data-remove-song="${escapeHtml(song.id)}" aria-label="Quitar canción">×</button></div>`;
        })
        .join("")
    : '<div class="empty-state">Aún no has agregado canciones.</div>';
  const count = $("#music-summary-count");
  if (count)
    count.textContent = `${selectedSongs.length} de ${maxSongsPerOrder} canciones seleccionadas`;
  $$("[data-remove-song]", list).forEach((button) =>
    button.addEventListener("click", () => {
      selectedSongs = selectedSongs.filter(
        (song) => String(song.id) !== button.dataset.removeSong,
      );
      write("kb_songs", selectedSongs);
      renderMusicSummary();
    }),
  );
}
renderMusicSummary();
const sendMusic = $("#send-music");
if (sendMusic)
  sendMusic.addEventListener("click", () => {
    if (!selectedSongs.length) {
      toast("Agrega al menos una canción");
      return;
    }
    if (selectedSongs.length > maxSongsPerOrder) {
      toast(`El máximo actual es ${maxSongsPerOrder} canciones por pedido`);
      return;
    }
    const note = $("#music-note")?.value.trim();
    const message = `🎤 *PEDIDO DE MÚSICA — KARAOKE & BAR*\n📍 Ubicación: ${locationName() || "No indicada"}\n\n${selectedSongs.map((song, index) => `${index + 1}. ${song.title} — ${song.artists?.length ? song.artists.map((artist) => artist.name).filter(Boolean).join(", ") : song.artist?.name || song.artist || "Artista no registrado"}`).join("\n")}${note ? `\n\n💌 Dedicatoria: ${note}` : ""}`;
    wa(message);
  });

// Carta / productos
let products = [];
let cart = read("kb_cart", {});
let activeCategory = "all";

function cartItems() {
  return Object.entries(cart)
    .map(([id, qty]) => ({
      product: products.find((item) => String(item.id) === String(id)),
      qty,
    }))
    .filter((item) => item.product && item.qty > 0);
}

function cartTotal() {
  return cartItems().reduce(
    (sum, item) => sum + item.product.price * item.qty,
    0,
  );
}

function initializeMenuCategories() {
  const tabs = $("#menu-category-tabs");
  if (!tabs) return;

  $$("[data-category]", tabs).forEach((button) =>
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      $$("[data-category]", tabs).forEach((tab) => {
        const isActive = tab === button;
        tab.classList.toggle("active", isActive);
        tab.setAttribute("aria-pressed", String(isActive));
      });
      filterProductCards();
    }),
  );
}

function filterProductCards() {
  const list = $("#product-list");
  if (!list) return;

  const term = $("#product-search")?.value.toLowerCase().trim() || "";
  let visibleCount = 0;
  $$(".product-card[data-product-id]", list).forEach((card) => {
    const matchesCategory =
      activeCategory === "all" ||
      card.dataset.productCategoryId === activeCategory;
    const matchesSearch = card.dataset.productSearch.includes(term);
    card.hidden = !matchesCategory || !matchesSearch;
    if (!card.hidden) visibleCount++;
  });

  const emptyState = $("#product-empty-state", list);
  if (emptyState) emptyState.hidden = visibleCount > 0;
}

function updateProductQuantities() {
  $$(".product-card[data-product-id]").forEach((card) => {
    const quantity = Number(cart[card.dataset.productId] || 0);
    const addButton = $("[data-product-add]", card);
    const quantityControl = $("[data-product-quantity]", card);

    addButton.hidden = quantity > 0;
    quantityControl.hidden = quantity === 0;
    $("[data-product-quantity-value]", quantityControl).textContent = quantity;
  });
}

$("#product-list")?.addEventListener("click", (event) => {
  const button = event.target.closest(
    "[data-product-add], [data-product-minus], [data-product-plus]",
  );
  if (!button || button.disabled) return;
  const card = button.closest("[data-product-id]");
  if (!card) return;
  changeQty(
    card.dataset.productId,
    button.hasAttribute("data-product-minus") ? -1 : 1,
  );
});
function changeQty(id, delta) {
  cart[id] = Math.max(0, (cart[id] || 0) + delta);
  if (!cart[id]) delete cart[id];
  write("kb_cart", cart);
  updateProductQuantities();
  renderCartTotals();
  renderFoodSummary();
}
function renderCartTotals() {
  const count = cartItems().reduce((sum, item) => sum + item.qty, 0);
  const countNode = $("#food-count");
  if (countNode)
    countNode.textContent = `${count} ${count === 1 ? "producto" : "productos"}`;
  const totalNode = $("#food-total");
  if (totalNode) totalNode.textContent = money(cartTotal());
}

async function loadMenuCatalog() {
  const list = $("#product-list");
  const summaryList = $("#food-summary-list");
  if (!list && !summaryList) return;

  try {
    if (list?.dataset.catalogReady === "true") {
      // La carta ya llegó renderizada por Astro; aquí solo leemos sus datos.
      products = $$(".product-card[data-product-id]", list).map((card) => ({
        id: card.dataset.productId,
        name: card.dataset.productName,
        price: Number(card.dataset.productPrice),
        category_id: card.dataset.productCategoryId,
        available: card.dataset.productAvailable === "true",
      }));
    } else {
      // El resumen necesita los nombres y precios del carrito local.
      const response = await fetch("/api/menu/catalog.json");
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "No se pudo cargar la carta.");

      products = (result.products || []).map((product) => ({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        category_id: product.category_id,
        available: product.available,
      }));
    }

    // Quita del carrito local productos que ya no existen o están agotados.
    const productIds = new Set(
      products
        .filter((product) => product.available)
        .map((product) => String(product.id)),
    );
    cart = Object.fromEntries(
      Object.entries(cart).filter(([id]) => productIds.has(String(id))),
    );
    write("kb_cart", cart);

    initializeMenuCategories();
    filterProductCards();
    updateProductQuantities();
    renderCartTotals();
    renderFoodSummary();
  } catch (error) {
    const emptyState = $("#product-empty-state", list || document);
    if (emptyState) {
      emptyState.textContent = error.message;
      emptyState.hidden = false;
    }
    if (summaryList)
      summaryList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  }
}

$("#product-search")?.addEventListener("input", filterProductCards);
loadMenuCatalog();
function renderFoodSummary() {
  const list = $("#food-summary-list");
  if (!list) return;
  const items = cartItems();
  list.innerHTML = items.length
    ? items
        .map(
          ({ product, qty }) => `
    <article class="food-summary-item">
      <div class="food-summary-product">
        <div><strong>${escapeHtml(product.name)}</strong><small>${qty} × ${money(product.price)}</small></div>
        <strong class="food-summary-subtotal">${money(qty * product.price)}</strong>
      </div>
      <div class="food-summary-actions">
        <div class="food-summary-quantity" aria-label="Cantidad de ${escapeHtml(product.name)}">
          <button type="button" data-food-minus="${escapeHtml(product.id)}" aria-label="Quitar una unidad de ${escapeHtml(product.name)}">−</button>
          <span aria-live="polite">${qty}</span>
          <button type="button" data-food-plus="${escapeHtml(product.id)}" aria-label="Agregar una unidad más de ${escapeHtml(product.name)}">+</button>
        </div>
        <button type="button" class="food-remove-button" data-food-remove="${escapeHtml(product.id)}">Quitar producto</button>
      </div>
    </article>`,
        )
        .join("")
    : '<div class="empty-state">Tu carrito está vacío.</div>';
  const total = $("#food-grand-total");
  if (total) total.textContent = money(cartTotal());
  const submit = $("#send-food");
  if (submit) submit.disabled = !items.length;
}
renderFoodSummary();
const foodSummaryList = $("#food-summary-list");
if (foodSummaryList) {
  foodSummaryList.addEventListener("click", (event) => {
    const button = event.target.closest(
      "[data-food-minus], [data-food-plus], [data-food-remove]",
    );
    if (!button) return;

    const productId =
      button.dataset.foodMinus ||
      button.dataset.foodPlus ||
      button.dataset.foodRemove;
    if (button.hasAttribute("data-food-remove")) {
      delete cart[productId];
      write("kb_cart", cart);
      renderFoodSummary();
      renderCartTotals();
      return;
    }

    changeQty(productId, button.hasAttribute("data-food-plus") ? 1 : -1);
  });
}
const sendFood = $("#send-food");
if (sendFood)
  sendFood.addEventListener("click", () => {
    const items = cartItems();
    if (!items.length) {
      toast("Agrega productos antes de enviar");
      return;
    }
    const payment = $('input[name="payment"]:checked')?.value || "Efectivo";
    const note = $("#food-note")?.value.trim();
    const detail = items
      .map(
        ({ product, qty }) =>
          `• ${product.name} — ${qty} x ${money(product.price)} = ${money(qty * product.price)}`,
      )
      .join("\n");
    const message = `🍻 *PEDIDO DE CARTA — KARAOKE & BAR*\n📍 Ubicación: ${locationName() || "No indicada"}\n💳 Pago: ${payment}\n\n${detail}\n\n*TOTAL: ${money(cartTotal())}*${note ? `\n\n📝 Indicaciones: ${note}` : ""}`;
    wa(message, "bar");
  });
