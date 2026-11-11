import { supabase } from './supabase.js';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const state = {
  user: null, settings: null, genres: [], languages: [], artists: [], categories: [],
  songPage: 0, songPageSize: 30, songTotal: 0, songSearchTimer: null, currentView: 'overview'
};
const money = v => `S/ ${Number(v || 0).toFixed(2)}`;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function toast(message, type = 'ok') {
  const node = $('#toast'); node.textContent = message; node.className = `toast show ${type}`;
  clearTimeout(window.__adminToast); window.__adminToast = setTimeout(() => node.classList.remove('show'), 3000);
}
function errorMessage(error) {
  const text = error?.message || 'Ocurrió un error inesperado.';
  if (/row-level security|permission denied|not allowed/i.test(text)) return 'Supabase bloqueó esta operación. Verifica que tu usuario sea administrador y las políticas RLS.';
  return text;
}
// Vacía la versión pública guardada para que los cambios del panel se vean pronto.
async function revalidatePublicCache(tags) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return false;

  try {
    const response = await fetch('/api/cache/revalidate.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ tags }),
    });
    return response.ok;
  } catch (error) {
    console.error('No se pudo actualizar la caché pública:', error);
    return false;
  }
}
function cacheUpdateMessage() {
  return 'Se guardó el cambio, pero no se pudo actualizar la caché. El contenido público puede tardar en renovarse.';
}
function showLogin(message = '') {
  $('#login-screen').hidden = false; $('#admin-app').hidden = true;
  $('#login-error').textContent = message;
}
function showApp() {
  $('#login-screen').hidden = true; $('#admin-app').hidden = false;
  $('#admin-email').textContent = state.user?.email || 'Administrador';
  $('#today-date').textContent = new Intl.DateTimeFormat('es-PE', { dateStyle: 'full' }).format(new Date());
}
async function verifyAdmin(user) {
  const { data, error } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}
async function boot() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return showLogin();
  try {
    const allowed = await verifyAdmin(session.user);
    if (!allowed) {
      await supabase.auth.signOut();
      return showLogin('Esta cuenta no tiene permisos de administrador.');
    }
    state.user = session.user; showApp(); await loadAll();
  } catch (error) {
    showLogin(`No se pudo validar el acceso: ${errorMessage(error)}`);
  }
}
$('#login-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const button = $('#login-submit'); button.disabled = true; button.textContent = 'Verificando…';
  $('#login-error').textContent = '';
  const { data, error } = await supabase.auth.signInWithPassword({ email: form.get('email'), password: form.get('password') });
  button.disabled = false; button.innerHTML = 'Iniciar sesión <span>→</span>';
  if (error) return $('#login-error').textContent = errorMessage(error);
  try {
    const allowed = await verifyAdmin(data.user);
    if (!allowed) {
      await supabase.auth.signOut();
      return $('#login-error').textContent = 'Tu cuenta inició sesión, pero no está registrada en admin_users.';
    }
    state.user = data.user; showApp(); await loadAll();
  } catch (err) { $('#login-error').textContent = errorMessage(err); }
});
$('#logout-btn').addEventListener('click', async () => { await supabase.auth.signOut(); state.user = null; showLogin(); });
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') showLogin();
  if (event === 'TOKEN_REFRESHED' && session) state.user = session.user;
});

async function loadAll() {
  await Promise.allSettled([loadOverview(), loadReferences(), loadSongs(), loadProducts(), loadCategories(), loadTables(), loadSettings()]);
}
async function countRows(table, filter) {
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filter) q = filter(q);
  const { count, error } = await q; if (error) throw error; return count || 0;
}
async function loadOverview() {
  const results = await Promise.all([
    countRows('songs'), countRows('artists'), countRows('menu_items'), countRows('tables', q => q.eq('active', true))
  ]);
  ['stat-songs', 'stat-artists', 'stat-products', 'stat-tables'].forEach((id, i) => { const node = document.getElementById(id); if (node) node.textContent = results[i].toLocaleString('es-PE'); });
  const { data } = await supabase.from('settings').select('*').eq('id', true).maybeSingle();
  if (data) {
    state.settings = data;
    $('#business-status').textContent = data.is_open ? 'Local abierto' : 'Local cerrado';
    $('#info-business').textContent = data.business_name || '—';
    $('#info-whatsapp').textContent = data.whatsapp_number || 'Sin configurar';
    $('#info-limit').textContent = `${data.max_songs_per_order} canciones`;
    $('#info-schedule').textContent = data.schedule || 'Sin configurar';
    $('.status-pill').classList.toggle('closed', !data.is_open);
  }
}
async function loadReferences() {
  const [g, l, a, c] = await Promise.all([
    supabase.from('genres').select('id,name').order('name'),
    supabase.from('languages').select('id,name').order('name'),
    supabase.from('artists').select('id,name').order('name').limit(5000),
    supabase.from('menu_categories').select('id,name,icon,display_order').order('display_order')
  ]);
  for (const result of [g, l, a, c]) if (result.error) throw result.error;
  state.genres = g.data || []; state.languages = l.data || []; state.artists = a.data || []; state.categories = c.data || [];
  fillSelect($('#song-genre-filter'), state.genres, 'Todos los géneros');
  fillSelect($('#song-language-filter'), state.languages, 'Todos los idiomas');
  fillSelect($('#product-category-filter'), state.categories, 'Todas las categorías');
}
function fillSelect(node, rows, placeholder, selected = '') {
  if (!node) return;
  const old = selected || node.value;
  node.innerHTML = `<option value="">${esc(placeholder)}</option>` + rows.map(r => `<option value="${esc(r.id)}">${esc(r.name)}</option>`).join('');
  if (old) node.value = old;
}
function debounceSongSearch() {
  clearTimeout(state.songSearchTimer);
  state.songSearchTimer = setTimeout(() => { state.songPage = 0; loadSongs(); }, 350);
}
async function loadSongs() {
  const tbody = $('#songs-tbody'); if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" class="table-message">Cargando canciones…</td></tr>';
  let q = supabase.from('songs').select('id,title,artist_id,genre_id,language_id,artists(name),genres(name),languages(name)', { count: 'exact' });
  const term = $('#song-search-admin')?.value.trim();
  const genre = $('#song-genre-filter')?.value;
  const language = $('#song-language-filter')?.value;
  if (term) {
    const matchingArtistIds = state.artists
      .filter(artist => artist.name.toLowerCase().includes(term.toLowerCase()))
      .map(artist => artist.id);
    const safeTerm = term.replace(/[,%()]/g, ' ').trim();
    const artistClause = matchingArtistIds.length
      ? `,artist_id.in.(${matchingArtistIds.join(',')})`
      : '';
    q = q.or(`title.ilike.%${safeTerm}%${artistClause}`);
  }
  if (genre) q = q.eq('genre_id', genre);
  if (language) q = q.eq('language_id', language);
  const from = state.songPage * state.songPageSize;
  const { data, error, count } = await q.order('title').range(from, from + state.songPageSize - 1);
  if (error) { tbody.innerHTML = `<tr><td colspan="5" class="table-message error-text">${esc(errorMessage(error))}</td></tr>`; return; }
  state.songTotal = count || 0;
  tbody.innerHTML = data.length ? data.map(song => `<tr>
    <td><div class="primary-cell"><span class="song-symbol">♫</span><strong>${esc(song.title)}</strong></div></td>
    <td>${esc(song.artists?.name || '—')}</td><td><span class="soft-tag">${esc(song.genres?.name || '—')}</span></td><td>${esc(song.languages?.name || '—')}</td>
    <td class="align-right"><button class="row-action" data-edit-song="${song.id}">Editar</button><button class="row-action danger" data-delete-song="${song.id}" data-delete-title="${esc(song.title)}">Eliminar</button></td>
  </tr>`).join('') : '<tr><td colspan="5" class="table-message">No se encontraron canciones.</td></tr>';
  $('#songs-pagination-info').textContent = `${state.songTotal.toLocaleString('es-PE')} canciones · Página ${state.songPage + 1} de ${Math.max(1, Math.ceil(state.songTotal / state.songPageSize))}`;
  $('#songs-prev').disabled = state.songPage === 0;
  $('#songs-next').disabled = from + state.songPageSize >= state.songTotal;
}
async function loadProducts() {
  const grid = $('#products-grid'); if (!grid) return;
  grid.innerHTML = '<p class="table-message">Cargando carta…</p>';
  let q = supabase.from('menu_items').select('id,name,description,price,category_id,image_url,available,menu_categories(name,icon)').order('name');
  const term = $('#product-search-admin')?.value.trim();
  const category = $('#product-category-filter')?.value;
  const available = $('#product-status-filter')?.value;
  if (term) q = q.ilike('name', `%${term}%`);
  if (category) q = q.eq('category_id', category);
  if (available) q = q.eq('available', available === 'true');
  const { data, error } = await q;
  if (error) { grid.innerHTML = `<p class="table-message error-text">${esc(errorMessage(error))}</p>`; return; }
  grid.innerHTML = data.length ? data.map(p => `<article class="admin-product-card">
    <div class="admin-product-image" style="background-image:url('${esc(p.image_url || '')}')">${p.image_url ? '' : '<span>Sin imagen</span>'}<span class="product-state ${p.available ? 'on' : 'off'}">${p.available ? 'Disponible' : 'Agotado'}</span></div>
    <div class="admin-product-body"><small>${esc(p.menu_categories?.icon || '•')} ${esc(p.menu_categories?.name || 'Sin categoría')}</small><h3>${esc(p.name)}</h3><p>${esc(p.description || 'Sin descripción')}</p><div class="admin-product-footer"><strong>${money(p.price)}</strong><div><button class="row-action" data-edit-product="${p.id}">Editar</button><button class="row-action danger" data-delete-product="${p.id}" data-delete-title="${esc(p.name)}">Eliminar</button></div></div></div>
  </article>`).join('') : '<div class="empty-box">No hay productos con estos filtros.</div>';
}
async function loadCategories() {
  const { data, error } = await supabase.from('menu_categories').select('*').order('display_order');
  if (error) return toast(errorMessage(error), 'error');
  state.categories = data || []; fillSelect($('#product-category-filter'), state.categories, 'Todas las categorías');
  $('#categories-grid').innerHTML = state.categories.map(c => `<article class="category-card"><div class="category-emoji">${esc(c.icon || '•')}</div><div><strong>${esc(c.name)}</strong><small>Orden de aparición: ${c.display_order}</small></div><div class="category-actions"><button class="row-action" data-edit-category="${c.id}">Editar</button><button class="row-action danger" data-delete-category="${c.id}" data-delete-title="${esc(c.name)}">Eliminar</button></div></article>`).join('') || '<div class="empty-box">No hay categorías.</div>';
}
async function loadTables() {
  const { data, error } = await supabase.from('tables').select('*').order('name');
  if (error) return toast(errorMessage(error), 'error');
  $('#tables-grid').innerHTML = (data || []).map(t => `<article class="table-space-card"><div class="space-icon">▦</div><div class="space-details"><strong>${esc(t.name)}</strong><small>Capacidad: ${t.capacity} ${t.capacity === 1 ? 'persona' : 'personas'}</small><span class="product-state ${t.active ? 'on' : 'off'}">${t.active ? 'Activo' : 'Inactivo'}</span></div><div class="category-actions"><button class="row-action" data-edit-table="${t.id}">Editar</button><button class="row-action danger" data-delete-table="${t.id}" data-delete-title="${esc(t.name)}">Eliminar</button></div></article>`).join('') || '<div class="empty-box">No hay espacios registrados.</div>';
}
async function loadSettings() {
  const { data, error } = await supabase.from('settings').select('*').eq('id', true).maybeSingle();
  if (error) return toast(errorMessage(error), 'error');
  if (!data) return;
  state.settings = data;
  const form = $('#settings-form');
  for (const [key, value] of Object.entries(data)) {
    const input = form.elements.namedItem(key);
    if (!input) continue;
    if (input.type === 'checkbox') input.checked = Boolean(value); else input.value = value ?? '';
  }
  renderLogoPreview(data.logo_url);
  $('#business-status').textContent = data.is_open ? 'Local abierto' : 'Local cerrado';
  $('.status-pill').classList.toggle('closed', !data.is_open);
  $('#info-business').textContent = data.business_name || '—'; $('#info-whatsapp').textContent = data.whatsapp_number || 'Sin configurar';
  $('#info-limit').textContent = `${data.max_songs_per_order} canciones`; $('#info-schedule').textContent = data.schedule || 'Sin configurar';
}
function renderLogoPreview(url) {
  $('#logo-preview').innerHTML = url ? `<img src="${esc(url)}" alt="Logo actual" /><span>Vista previa del logotipo</span>` : '<span>No hay logotipo configurado.</span>';
}
function setView(view) {
  state.currentView = view;
  $$('.view-section').forEach(s => s.classList.toggle('active', s.id === `view-${view}`));
  $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  const labels = { overview: 'Resumen', songs: 'Canciones', products: 'Carta / Productos', categories: 'Categorías', tables: 'Mesas y barra', settings: 'Configuración' };
  $('#breadcrumb-current').textContent = labels[view] || 'Panel';
  $('#sidebar').classList.remove('open');
  if (view === 'songs') loadSongs(); if (view === 'products') loadProducts(); if (view === 'categories') loadCategories(); if (view === 'tables') loadTables(); if (view === 'settings') loadSettings();
}
$$('[data-view]').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
$$('[data-go]').forEach(b => b.addEventListener('click', () => setView(b.dataset.go)));
$('#mobile-menu').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
$('#song-search-admin').addEventListener('input', debounceSongSearch);
$('#song-genre-filter').addEventListener('change', () => { state.songPage = 0; loadSongs(); });
$('#song-language-filter').addEventListener('change', () => { state.songPage = 0; loadSongs(); });
$('#song-refresh').addEventListener('click', loadSongs);
$('#songs-prev').addEventListener('click', () => { state.songPage = Math.max(0, state.songPage - 1); loadSongs(); });
$('#songs-next').addEventListener('click', () => { state.songPage++; loadSongs(); });
$('#product-search-admin').addEventListener('input', () => loadProducts());
['product-category-filter', 'product-status-filter'].forEach(id => document.getElementById(id).addEventListener('change', loadProducts));
$('#product-refresh').addEventListener('click', loadProducts);

const backdrop = $('#modal-backdrop'), modalForm = $('#record-form');
function openModal(title, fields, record = {}, onSave) {
  $('#modal-title').textContent = title; $('#modal-eyebrow').textContent = 'GESTIÓN DE CATÁLOGO';
  $('#modal-fields').innerHTML = fields.map(field => {
    const value = record[field.name] ?? field.value ?? '';
    if (field.type === 'select') return `<label class="${field.full ? 'full' : ''}">${field.label}<select name="${field.name}" ${field.required ? 'required' : ''}>${field.options.map(o => `<option value="${esc(o.value)}" ${String(o.value) === String(value) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select></label>`;
    if (field.type === 'textarea') return `<label class="full">${field.label}<textarea name="${field.name}" rows="3" ${field.required ? 'required' : ''}>${esc(value)}</textarea></label>`;
    if (field.type === 'checkbox') return `<label class="checkbox-label full"><input type="checkbox" name="${field.name}" ${value ? 'checked' : ''}/> ${field.label}</label>`;
    if (field.type === 'file') return `<label class="full">${field.label}<input type="file" name="${field.name}" accept="image/*" /></label>`;
    return `<label class="${field.full ? 'full' : ''}">${field.label}<input name="${field.name}" type="${field.type || 'text'}" value="${esc(value)}" ${field.required ? 'required' : ''} ${field.min !== undefined ? `min="${field.min}"` : ''} ${field.step ? `step="${field.step}"` : ''} placeholder="${esc(field.placeholder || '')}" /></label>`;
  }).join('');
  modalForm.onsubmit = async event => {
    event.preventDefault(); const submit = $('#modal-save'); submit.disabled = true; submit.textContent = 'Guardando…';
    const fd = new FormData(modalForm); const values = {};
    fields.forEach(f => { if (f.type === 'file') values[f.name] = fd.get(f.name); else if (f.type === 'checkbox') values[f.name] = fd.has(f.name); else values[f.name] = fd.get(f.name); });
    try {
      const cacheCleared = await onSave(values);
      closeModal();
      toast(cacheCleared === false ? cacheUpdateMessage() : 'Cambios guardados correctamente.');
    }
    catch (error) { toast(errorMessage(error), 'error'); }
    finally { submit.disabled = false; submit.textContent = 'Guardar cambios'; }
  };
  backdrop.hidden = false; document.body.classList.add('modal-open');
}
function closeModal() { backdrop.hidden = true; document.body.classList.remove('modal-open'); modalForm.onsubmit = null; }
$('#modal-close').addEventListener('click', closeModal); $('#modal-cancel').addEventListener('click', closeModal);
backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !backdrop.hidden) closeModal(); });

async function songModal(id = null) {
  const { data: existing } = id ? await supabase.from('songs').select('*').eq('id', id).single() : { data: {} };
  const artistOptions = state.artists.map(a => ({ value: a.id, label: a.name }));
  const fields = [
    { name: 'title', label: 'Título de la canción', required: true, full: true },
    { name: 'artist_id', label: 'Artista', type: 'select', options: [{ value: '', label: 'Seleccionar artista' }, ...artistOptions] },
    { name: 'genre_id', label: 'Género', type: 'select', options: [{ value: '', label: 'Sin género' }, ...state.genres.map(x => ({ value: x.id, label: x.name }))] },
    { name: 'language_id', label: 'Idioma', type: 'select', options: [{ value: '', label: 'Sin idioma' }, ...state.languages.map(x => ({ value: x.id, label: x.name }))] }
  ];
  openModal(id ? 'Editar canción' : 'Agregar canción', fields, existing || {}, async v => {
    const payload = { title: v.title.trim(), artist_id: v.artist_id || null, genre_id: v.genre_id || null, language_id: v.language_id || null, updated_at: new Date().toISOString() };
    const result = id ? await supabase.from('songs').update(payload).eq('id', id) : await supabase.from('songs').insert(payload);
    if (result.error) throw result.error;
    const cacheCleared = await revalidatePublicCache(['songs']);
    await loadSongs(); await loadOverview();
    return cacheCleared;
  });
}
async function productModal(id = null) {
  const { data: existing } = id ? await supabase.from('menu_items').select('*').eq('id', id).single() : { data: {} };
  const fields = [
    { name: 'name', label: 'Nombre del producto', required: true, full: true },
    { name: 'description', label: 'Descripción', type: 'textarea', full: true },
    { name: 'price', label: 'Precio (S/)', type: 'number', required: true, min: 0, step: '0.01' },
    { name: 'category_id', label: 'Categoría', type: 'select', options: [{ value: '', label: 'Seleccionar categoría' }, ...state.categories.map(x => ({ value: x.id, label: x.name }))] },
    { name: 'available', label: 'Producto disponible', type: 'checkbox' },
    { name: 'image_file', label: 'Imagen del producto', type: 'file' }
  ];
  openModal(id ? 'Editar producto' : 'Nuevo producto', fields, { ...existing, available: existing?.available ?? true }, async v => {
    let imageUrl = existing?.image_url || null;
    if (v.image_file?.size) {
      const ext = v.image_file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const path = `products/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('menu-images').upload(path, v.image_file, { contentType: v.image_file.type, upsert: false });
      if (uploadError) throw uploadError;
      imageUrl = supabase.storage.from('menu-images').getPublicUrl(path).data.publicUrl;
    }
    const payload = { name: v.name.trim(), description: v.description || null, price: Number(v.price), category_id: v.category_id || null, available: v.available, image_url: imageUrl, updated_at: new Date().toISOString() };
    const result = id ? await supabase.from('menu_items').update(payload).eq('id', id) : await supabase.from('menu_items').insert(payload);
    if (result.error) throw result.error;
    const cacheCleared = await revalidatePublicCache(['menu']);
    await loadProducts(); await loadOverview();
    return cacheCleared;
  });
}
async function categoryModal(id = null) {
  const { data: existing } = id ? await supabase.from('menu_categories').select('*').eq('id', id).single() : { data: {} };
  openModal(id ? 'Editar categoría' : 'Nueva categoría', [
    { name: 'name', label: 'Nombre', required: true }, { name: 'icon', label: 'Emoji / icono', placeholder: '🍹' },
    { name: 'display_order', label: 'Orden', type: 'number', min: 0 }
  ], existing || { display_order: state.categories.length + 1 }, async v => {
    const payload = { name: v.name.trim(), icon: v.icon || null, display_order: Number(v.display_order || 0) };
    const result = id ? await supabase.from('menu_categories').update(payload).eq('id', id) : await supabase.from('menu_categories').insert(payload);
    if (result.error) throw result.error;
    const cacheCleared = await revalidatePublicCache(['menu']);
    await loadCategories(); await loadReferences();
    return cacheCleared;
  });
}
async function tableModal(id = null) {
  const { data: existing } = id ? await supabase.from('tables').select('*').eq('id', id).single() : { data: {} };
  openModal(id ? 'Editar espacio' : 'Nuevo espacio', [
    { name: 'name', label: 'Nombre del espacio', required: true, placeholder: 'Mesa 10 o Barra 02' },
    { name: 'capacity', label: 'Capacidad (personas)', type: 'number', min: 1 },
    { name: 'active', label: 'Espacio activo', type: 'checkbox' }
  ], { ...existing, capacity: existing?.capacity ?? 4, active: existing?.active ?? true }, async v => {
    const payload = { name: v.name.trim(), capacity: Number(v.capacity), active: v.active, updated_at: new Date().toISOString() };
    const result = id ? await supabase.from('tables').update(payload).eq('id', id) : await supabase.from('tables').insert(payload);
    if (result.error) throw result.error;
    const cacheCleared = await revalidatePublicCache(['tables']);
    await loadTables(); await loadOverview();
    return cacheCleared;
  });
}
function confirmDelete(label, callback) {
  if (!confirm(`¿Eliminar "${label}"? Esta acción no se puede deshacer.`)) return;
  callback()
    .then(cacheCleared => toast(cacheCleared === false ? cacheUpdateMessage() : 'Registro eliminado.'))
    .catch(error => toast(errorMessage(error), 'error'));
}
document.addEventListener('click', event => {
  const b = event.target.closest('button'); 
  if (!b) return;
  if (b.dataset.action === 'new-song') songModal();
  if (b.dataset.action === 'new-product') productModal();
  if (b.dataset.action === 'new-category') categoryModal();
  if (b.dataset.action === 'new-table') tableModal();
  if (b.dataset.editSong) songModal(b.dataset.editSong);
  if (b.dataset.editProduct) productModal(b.dataset.editProduct);
  if (b.dataset.editCategory) categoryModal(b.dataset.editCategory);
  if (b.dataset.editTable) tableModal(b.dataset.editTable);
  if (b.dataset.deleteSong) confirmDelete(b.dataset.deleteTitle, async () => { const { error } = await supabase.from('songs').delete().eq('id', b.dataset.deleteSong); if (error) throw error; const cleared = await revalidatePublicCache(['songs']); await loadSongs(); await loadOverview(); return cleared; });
  if (b.dataset.deleteProduct) confirmDelete(b.dataset.deleteTitle, async () => { const { error } = await supabase.from('menu_items').delete().eq('id', b.dataset.deleteProduct); if (error) throw error; const cleared = await revalidatePublicCache(['menu']); await loadProducts(); await loadOverview(); return cleared; });
  if (b.dataset.deleteCategory) confirmDelete(b.dataset.deleteTitle, async () => { const { error } = await supabase.from('menu_categories').delete().eq('id', b.dataset.deleteCategory); if (error) throw error; const cleared = await revalidatePublicCache(['menu']); await loadCategories(); await loadReferences(); return cleared; });
  if (b.dataset.deleteTable) confirmDelete(b.dataset.deleteTitle, async () => { const { error } = await supabase.from('tables').delete().eq('id', b.dataset.deleteTable); if (error) throw error; const cleared = await revalidatePublicCache(['tables']); await loadTables(); await loadOverview(); return cleared; });
});
$('#settings-form').addEventListener('submit', async event => {
  event.preventDefault(); const form = event.currentTarget; const fd = new FormData(form);
  const payload = {
    business_name: fd.get('business_name').trim(), address: fd.get('address') || null,
    whatsapp_number: fd.get('whatsapp_number') || null, whatsapp_bar: fd.get('whatsapp_bar') || null,
    schedule: fd.get('schedule') || '', max_songs_per_order: Number(fd.get('max_songs_per_order')),
    logo_url: fd.get('logo_url') || null, is_open: fd.has('is_open'), updated_at: new Date().toISOString()
  };
  const feedback = $('#settings-feedback'); feedback.textContent = 'Guardando…';
  const { error } = await supabase.from('settings').update(payload).eq('id', true);
  if (error) { feedback.textContent = errorMessage(error); return toast(errorMessage(error), 'error'); }
  const cacheCleared = await revalidatePublicCache(['songs']);
  feedback.textContent = cacheCleared ? 'Configuración actualizada.' : cacheUpdateMessage();
  await loadSettings(); await loadOverview(); toast(feedback.textContent);
});
$('#settings-form').elements.logo_url.addEventListener('input', e => renderLogoPreview(e.target.value));
boot();
