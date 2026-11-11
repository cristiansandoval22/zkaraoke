import { MAX_SONGS, WHATSAPP_NUMBER } from './config.js';

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const money = value => `S/ ${Number(value).toFixed(2)}`;
const locationName = () => read('kb_location', '');
function updateLocation() {
  const node = $('#current-location');
  if (node) node.textContent = locationName() || 'Sin seleccionar';
}
function toast(message) {
  let el = $('#toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.append(el); }
  el.textContent = message; el.classList.add('show');
  clearTimeout(window.__toastTimer); window.__toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}
function wa(message) {
  const number = WHATSAPP_NUMBER.replace(/\D/g, '');
  if (number.endsWith('XXXXXXXX') || number.length < 10) {
    toast('Configura el número de WhatsApp en src/scripts/config.js');
    return;
  }
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
}

// Mesa / barra: la selección guardada debe seguir existiendo entre los espacios activos.
const locationSelection = $('[data-location-selection]');
if (locationSelection) {
  const locationButtons = $$('[data-location]', locationSelection);
  const continueLocation = $('#continue-location');
  let selectedLocation = locationName();

  if (!locationButtons.some(button => button.dataset.location === selectedLocation)) {
    localStorage.removeItem('kb_location');
    selectedLocation = '';
  }

  locationButtons.forEach(button => {
    if (button.dataset.location === selectedLocation) button.classList.add('selected');
    button.addEventListener('click', () => {
      selectedLocation = button.dataset.location;
      write('kb_location', selectedLocation);
      locationButtons.forEach(item => item.classList.toggle('selected', item === button));
      if (continueLocation) continueLocation.disabled = false;
      toast(`${selectedLocation} seleccionada`);
    });
  });

  if (continueLocation) {
    continueLocation.disabled = !selectedLocation;
    continueLocation.addEventListener('click', () => {
      if (selectedLocation) window.location.assign('/menu');
    });
  }
}
updateLocation();

// Menú de canciones: los resultados se consultan en Astro/Supabase por páginas.
let selectedSongs = read('kb_songs', []);
let maxSongsPerOrder = MAX_SONGS;
let visibleSongs = [];
let nextSongCursor = null;
let hasMoreSongs = false;
let loadingSongs = false;
let songSearchTimer = null;
let songRequestVersion = 0;
let activeSongRequest = null;
const songResponseCache = new Map();
const SONG_CACHE_TTL = 20_000;

function renderSongCount() {
  const count = $('#song-count');
  if (count) count.textContent = `${selectedSongs.length}/${maxSongsPerOrder}`;
  const summary = $('#song-summary-link');
  if (summary) summary.href = '/resumen-musica';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function getSongSearchParameters(cursor = null) {
  const params = new URLSearchParams();
  const term = $('#song-search')?.value.trim() || '';
  const genre = $('#genre-filter')?.value || '';
  const language = $('#language-filter')?.value || '';
  if (term) params.set('q', term);
  if (genre) params.set('genre', genre);
  if (language) params.set('language', language);
  if (cursor) {
    params.set('afterTitle', cursor.title);
    params.set('afterId', cursor.id);
  }
  return params;
}

function renderSongs() {
  const list = $('#song-list');
  if (!list) return;
  list.innerHTML = visibleSongs.length ? visibleSongs.map(song => {
    const artist = song.artist?.name || 'Artista no registrado';
    const genre = song.genre?.name || 'Sin género';
    const language = song.language?.name || 'Sin idioma';
    const alreadySelected = selectedSongs.some(selected => selected.id === song.id);
    return `
    <article class="song-card">
      <div class="song-art">♫</div>
      <div class="song-info"><strong>${escapeHtml(song.title)}</strong><span>${escapeHtml(artist)}</span>
        <div class="tag-row"><span class="tag">${escapeHtml(genre)}</span><span class="tag tag-muted">${escapeHtml(language)}</span></div>
      </div>
      <button class="btn btn-small ${alreadySelected ? 'btn-added' : 'btn-outline'}" data-add-song="${escapeHtml(song.id)}" ${alreadySelected ? 'disabled' : ''}>${alreadySelected ? 'Añadida' : 'Pedir'}</button>
    </article>`;
  }).join('') : '<div class="empty-state">No encontramos canciones con esos filtros.</div>';

  const loadMore = $('#song-load-more');
  if (loadMore) loadMore.hidden = !hasMoreSongs;

  $$('[data-add-song]', list).forEach(button => button.addEventListener('click', () => {
    const song = visibleSongs.find(item => item.id === button.dataset.addSong);
    if (!song) return;
    if (selectedSongs.length >= maxSongsPerOrder) { toast(`Máximo ${maxSongsPerOrder} canciones por pedido`); return; }
    selectedSongs.push(song); write('kb_songs', selectedSongs); renderSongs(); renderSongCount();
    toast('Canción agregada a tu pedido');
  }));
}

async function loadSongFilters() {
  const response = await fetch('/api/songs/filters.json');
  if (!response.ok) throw new Error('No se pudieron cargar los filtros del repertorio.');
  const filters = await response.json();
  maxSongsPerOrder = Number(filters.maxSongsPerOrder) > 0 ? Number(filters.maxSongsPerOrder) : MAX_SONGS;

  const genreSelect = $('#genre-filter');
  const languageSelect = $('#language-filter');
  if (genreSelect) {
    genreSelect.innerHTML = '<option value="">Todos los géneros</option>' + (filters.genres || []).map(genre =>
      `<option value="${escapeHtml(genre.id)}">${escapeHtml(genre.name)}</option>`
    ).join('');
  }
  if (languageSelect) {
    languageSelect.innerHTML = '<option value="">Todos los idiomas</option>' + (filters.languages || []).map(language =>
      `<option value="${escapeHtml(language.id)}">${escapeHtml(language.name)}</option>`
    ).join('');
  }
  renderSongCount();
}

async function fetchSongs(cursor = null) {
  const list = $('#song-list');
  if (!list || loadingSongs) return;

  const requestVersion = ++songRequestVersion;
  const loadMoreButton = $('#song-load-more');
  const params = getSongSearchParameters(cursor);
  if (!cursor && params.get('q')?.trim().length === 1) {
    visibleSongs = [];
    nextSongCursor = null;
    hasMoreSongs = false;
    list.innerHTML = '<div class="empty-state">Escribe al menos dos caracteres para buscar.</div>';
    const loadMore = $('#song-load-more');
    if (loadMore) loadMore.hidden = true;
    return;
  }
  const cacheKey = params.toString();
  const cached = songResponseCache.get(cacheKey);
  let result;

  if (cached && cached.expiresAt > Date.now()) {
    result = cached.value;
  } else {
    if (!cursor) list.innerHTML = '<div class="empty-state">Cargando repertorio…</div>';
    const controller = new AbortController();
    activeSongRequest = controller;
    loadingSongs = true;
    if (loadMoreButton) loadMoreButton.disabled = true;
    try {
      const response = await fetch(`/api/songs/search.json?${cacheKey}`, { signal: controller.signal });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'No se pudo cargar el repertorio.');
      result = body;
      songResponseCache.set(cacheKey, { value: body, expiresAt: Date.now() + SONG_CACHE_TTL });
      if (songResponseCache.size > 100) songResponseCache.delete(songResponseCache.keys().next().value);
    } catch (error) {
      if (requestVersion !== songRequestVersion) return;
      if (error.name === 'AbortError') return;
      list.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
      return;
    } finally {
      if (activeSongRequest === controller) {
        activeSongRequest = null;
        loadingSongs = false;
        if (loadMoreButton) loadMoreButton.disabled = false;
      }
    }
  }

  if (requestVersion !== songRequestVersion) return;
  visibleSongs = cursor ? [...visibleSongs, ...result.songs] : result.songs;
  nextSongCursor = result.nextCursor;
  hasMoreSongs = result.hasMore;
  renderSongs();
}

function scheduleSongSearch() {
  clearTimeout(songSearchTimer);
  songRequestVersion += 1;
  activeSongRequest?.abort();
  songSearchTimer = setTimeout(() => {
    visibleSongs = [];
    nextSongCursor = null;
    hasMoreSongs = false;
    fetchSongs();
  }, 300);
}

['song-search', 'genre-filter', 'language-filter'].forEach(id => {
  const node = document.getElementById(id);
  if (node) node.addEventListener(id === 'song-search' ? 'input' : 'change', scheduleSongSearch);
});

$('#song-load-more')?.addEventListener('click', () => {
  if (hasMoreSongs && nextSongCursor) fetchSongs(nextSongCursor);
});

if ($('#song-list')) {
  loadSongFilters()
    .then(() => fetchSongs())
    .catch(error => {
      console.error('No se pudieron cargar los filtros del repertorio:', error);
      fetchSongs();
    });
}

if ($('#music-summary-list')) {
  loadSongFilters()
    .then(renderMusicSummary)
    .catch(error => console.error('No se pudo cargar el límite de canciones:', error));
}

// Resumen de música
function renderMusicSummary() {
  const list = $('#music-summary-list');
  if (!list) return;
  list.innerHTML = selectedSongs.length ? selectedSongs.map((song, index) => {
    const artist = song.artist?.name || song.artist || 'Artista no registrado';
    const genre = song.genre?.name || song.genre || 'Género no registrado';
    return `
    <div class="summary-line"><div><strong>${escapeHtml(index + 1)}. ${escapeHtml(song.title)}</strong><small>${escapeHtml(artist)} · ${escapeHtml(genre)}</small></div>
      <button class="remove-btn" data-remove-song="${escapeHtml(song.id)}" aria-label="Quitar canción">×</button></div>`;
  }).join('') : '<div class="empty-state">Aún no has agregado canciones.</div>';
  const count = $('#music-summary-count');
  if (count) count.textContent = `${selectedSongs.length} de ${maxSongsPerOrder} canciones seleccionadas`;
  $$('[data-remove-song]', list).forEach(button => button.addEventListener('click', () => {
    selectedSongs = selectedSongs.filter(song => String(song.id) !== button.dataset.removeSong);
    write('kb_songs', selectedSongs); renderMusicSummary();
  }));
}
renderMusicSummary();
const sendMusic = $('#send-music');
if (sendMusic) sendMusic.addEventListener('click', () => {
  if (!selectedSongs.length) { toast('Agrega al menos una canción'); return; }
  if (selectedSongs.length > maxSongsPerOrder) { toast(`El máximo actual es ${maxSongsPerOrder} canciones por pedido`); return; }
  const note = $('#music-note')?.value.trim();
  const message = `🎤 *PEDIDO DE MÚSICA — KARAOKE & BAR*\n📍 Ubicación: ${locationName() || 'No indicada'}\n\n${selectedSongs.map((song, index) => `${index + 1}. ${song.title} — ${song.artist?.name || song.artist || 'Artista no registrado'}`).join('\n')}${note ? `\n\n💌 Dedicatoria: ${note}` : ''}`;
  wa(message);
});

// Carta / productos
let products = [];
let cart = read('kb_cart', {});
let activeCategory = 'all';

function cartItems() {
  return Object.entries(cart)
    .map(([id, qty]) => ({ product: products.find(item => String(item.id) === String(id)), qty }))
    .filter(item => item.product && item.qty > 0);
}

function cartTotal() { return cartItems().reduce((sum, item) => sum + item.product.price * item.qty, 0); }

function getSafeImageUrl(value) {
  try {
    const url = new URL(value, window.location.origin);
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

function renderMenuCategories(categories) {
  const tabs = $('#menu-category-tabs');
  if (!tabs) return;

  tabs.innerHTML = '<button type="button" data-category="all" class="active">Todos</button>' +
    categories.map(category =>
      `<button type="button" data-category="${escapeHtml(category.id)}">${escapeHtml(category.name)}</button>`
    ).join('');

  $$('[data-category]', tabs).forEach(button => button.addEventListener('click', () => {
    activeCategory = button.dataset.category;
    $$('[data-category]', tabs).forEach(tab => tab.classList.toggle('active', tab === button));
    renderProducts();
  }));
}

function renderProducts() {
  const list = $('#product-list');
  if (!list) return;
  const term = ($('#product-search')?.value || '').toLowerCase().trim();
  const filtered = products.filter(product =>
    (activeCategory === 'all' || product.category_id === activeCategory) &&
    `${product.name} ${product.description || ''}`.toLowerCase().includes(term)
  );
  list.innerHTML = filtered.map(p => {
    const qty = cart[p.id] || 0;
    const imageUrl = getSafeImageUrl(p.image);
    return `<article class="product-card">
      <div class="product-image" ${imageUrl ? `style="background-image:url('${escapeHtml(imageUrl)}')"` : ''}>${!p.available ? '<span class="unavailable">Agotado</span>' : ''}</div>
      <div class="product-body"><div class="product-meta"><span>${escapeHtml(p.category)}</span><span class="availability ${p.available ? 'is-available' : ''}">${p.available ? 'Disponible' : 'No disponible'}</span></div>
      <h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.description || '')}</p>
      <div class="product-bottom"><strong>${money(p.price)}</strong>
      <div class="quantity-control"><button data-minus="${p.id}" ${qty === 0 ? 'disabled' : ''}>−</button><span>${qty}</span><button data-plus="${p.id}" ${!p.available ? 'disabled' : ''}>+</button></div></div></div></article>`;
  }).join('') || '<div class="empty-state">No hay productos en esta categoría.</div>';
  $$('[data-plus]', list).forEach(b => b.addEventListener('click', () => changeQty(b.dataset.plus, 1)));
  $$('[data-minus]', list).forEach(b => b.addEventListener('click', () => changeQty(b.dataset.minus, -1)));
}
function changeQty(id, delta) {
  cart[id] = Math.max(0, (cart[id] || 0) + delta);
  if (!cart[id]) delete cart[id];
  write('kb_cart', cart); renderProducts(); renderCartTotals(); renderFoodSummary();
}
function renderCartTotals() {
  const count = cartItems().reduce((sum, item) => sum + item.qty, 0);
  const countNode = $('#food-count'); if (countNode) countNode.textContent = `${count} ${count === 1 ? 'producto' : 'productos'}`;
  const totalNode = $('#food-total'); if (totalNode) totalNode.textContent = money(cartTotal());
}

async function loadMenuCatalog() {
  const list = $('#product-list');
  const summaryList = $('#food-summary-list');
  // La carta y el resumen necesitan los mismos productos para mostrar el carrito.
  if (!list && !summaryList) return;

  if (list) list.innerHTML = '<div class="empty-state">Cargando la carta…</div>';
  try {
    const response = await fetch('/api/menu/catalog.json');
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'No se pudo cargar la carta.');

    products = (result.products || []).map(product => ({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: Number(product.price),
      category_id: product.category_id,
      category: product.category?.name || 'Sin categoría',
      image: product.image_url || '',
      available: product.available,
    }));

    // Quita del carrito local productos que ya no existen en la carta.
    const productIds = new Set(products.filter(product => product.available).map(product => String(product.id)));
    cart = Object.fromEntries(Object.entries(cart).filter(([id]) => productIds.has(String(id))));
    write('kb_cart', cart);

    renderMenuCategories(result.categories || []);
    renderProducts();
    renderCartTotals();
    renderFoodSummary();
  } catch (error) {
    if (list) list.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    if (summaryList) summaryList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  }
}

$('#product-search')?.addEventListener('input', renderProducts);
loadMenuCatalog();

function renderFoodSummary() {
  const list = $('#food-summary-list');
  if (!list) return;
  const items = cartItems();
  list.innerHTML = items.length ? items.map(({ product, qty }) => `
    <div class="food-summary-item"><div><strong>${product.name}</strong><small>${qty} × ${money(product.price)}</small></div><strong>${money(qty * product.price)}</strong></div>`).join('') : '<div class="empty-state">Tu carrito está vacío.</div>';
  const total = $('#food-grand-total'); if (total) total.textContent = money(cartTotal());
  const submit = $('#send-food'); if (submit) submit.disabled = !items.length;
}
renderFoodSummary();
const sendFood = $('#send-food');
if (sendFood) sendFood.addEventListener('click', () => {
  const items = cartItems();
  if (!items.length) { toast('Agrega productos antes de enviar'); return; }
  const payment = $('input[name="payment"]:checked')?.value || 'Efectivo';
  const note = $('#food-note')?.value.trim();
  const detail = items.map(({ product, qty }) => `• ${product.name} — ${qty} x ${money(product.price)} = ${money(qty * product.price)}`).join('\n');
  const message = `🍻 *PEDIDO DE CARTA — KARAOKE & BAR*\n📍 Ubicación: ${locationName() || 'No indicada'}\n💳 Pago: ${payment}\n\n${detail}\n\n*TOTAL: ${money(cartTotal())}*${note ? `\n\n📝 Indicaciones: ${note}` : ''}`;
  wa(message);
});
