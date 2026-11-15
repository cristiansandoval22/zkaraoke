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
  currentView: "overview",
};
const money = (v) => `S/ ${Number(v || 0).toFixed(2)}`;
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
  const app = $("#admin-app");
  $("#admin-email").textContent = app.dataset.adminEmail || "Administrador";
  $("#today-date").textContent = new Intl.DateTimeFormat("es-PE", {
    dateStyle: "full",
  }).format(new Date());
  state.currentView = app.dataset.activeView || "overview";
  state.genres = [...$("#song-genre-filter").options]
    .filter((option) => option.value)
    .map((option) => ({ id: option.value, name: option.textContent }));
  state.languages = [...$("#song-language-filter").options]
    .filter((option) => option.value)
    .map((option) => ({ id: option.value, name: option.textContent }));
  state.categories = [...$("#product-category-filter").options]
    .filter((option) => option.value)
    .map((option) => ({ id: option.value, name: option.textContent }));
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
  const arrow = document.createElement("span");
  arrow.textContent = "→";
  button.replaceChildren("Iniciar sesión ", arrow);
  if (error) return ($("#login-error").textContent = errorMessage(error));
  window.location.assign("/admin");
});
$("#logout-btn").addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.assign("/admin");
});

function renderLogoPreview(url) {
  const preview = $("#logo-preview");
  if (!preview) return;

  let imageUrl = "";
  try {
    const parsedUrl = new URL(url || "");
    if (parsedUrl.protocol === "https:") imageUrl = parsedUrl.href;
  } catch {
    imageUrl = "";
  }

  const message = document.createElement("span");
  if (!imageUrl) {
    message.textContent = "No hay logotipo configurado.";
    preview.replaceChildren(message);
    return;
  }

  const image = document.createElement("img");
  image.src = imageUrl;
  image.alt = "Logo actual";
  message.textContent = "Vista previa del logotipo";
  preview.replaceChildren(image, message);
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
  const url = new URL(window.location.href);
  url.searchParams.set("view", view);
  window.history.replaceState(null, "", url);
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
function submitFilterAfterTyping(inputId) {
  const input = $(inputId);
  if (!input) return;
  let timer;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => input.form?.requestSubmit(), 350);
  });
}
submitFilterAfterTyping("#song-search-admin");
submitFilterAfterTyping("#artist-search-admin");
submitFilterAfterTyping("#product-search-admin");
["#song-genre-filter", "#song-language-filter", "#product-category-filter", "#product-status-filter"]
  .forEach((selector) => $(selector)?.addEventListener("change", (event) => event.currentTarget.form?.requestSubmit()));

const backdrop = $("#modal-backdrop");
const modalForm = $("#record-form");
const modal = $(".modal");

function normalizeForSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}

function renderComboboxOptions(menu, options, emptyMessage) {
  if (!options.length) {
    const message = document.createElement("p");
    message.className = "combobox-empty";
    message.textContent = emptyMessage;
    menu.replaceChildren(message);
    return;
  }

  const optionButtons = options.slice(0, 12).map((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "combobox-option";
    button.setAttribute("role", "option");
    button.dataset.optionValue = option.value;
    button.textContent = option.label;
    return button;
  });
  menu.replaceChildren(...optionButtons);
}

function renderSelectedArtistTags(container, selectedIds, options) {
  const tags = $("[data-selected-tags]", container);
  const hidden = $("[data-multi-artist-value]", container);
  const help = $("[data-multi-artist-help]", container);
  const selectedOptions = selectedIds
    .map((id) => options.find((option) => String(option.value) === String(id)))
    .filter(Boolean);

  const tagNodes = selectedOptions.map((option) => {
    const tag = document.createElement("span");
    tag.className = "artist-tag";
    const name = document.createElement("span");
    name.textContent = option.label;
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.dataset.removeArtist = option.value;
    removeButton.setAttribute("aria-label", `Quitar ${option.label}`);
    removeButton.textContent = "×";
    tag.append(name, removeButton);
    return tag;
  });
  tags.replaceChildren(...tagNodes);
  hidden.value = JSON.stringify(selectedOptions.map((option) => option.value));
  help.textContent = `${selectedOptions.length} artista${selectedOptions.length === 1 ? "" : "s"} seleccionado${selectedOptions.length === 1 ? "" : "s"}. El orden de las etiquetas será el orden mostrado en la canción.`;
}

document.addEventListener("click", (event) => {
  if (event.target.closest(".song-field[data-combobox]")) return;
  $$(".song-field[data-combobox] [data-combobox-options]").forEach((menu) => {
    menu.hidden = true;
  });
  $$(".song-field[data-combobox] [data-combobox-input]").forEach((input) => {
    input.setAttribute("aria-expanded", "false");
  });
});

function openModal(title, fields, record = {}, onSave) {
  const groupName = fields.some((field) => field.type === "multi-combobox")
    ? "song"
    : fields.some((field) => field.name === "image_file")
      ? "product"
      : fields.some((field) => field.name === "capacity")
        ? "table"
        : fields.some((field) => field.name === "display_order")
          ? "category"
          : "artist";
  const isSongModal = groupName === "song";
  const activeGroup = $(`[data-form-group="${groupName}"]`, modalForm);

  $$('[data-form-group]', modalForm).forEach((group) => {
    const isActive = group === activeGroup;
    group.disabled = !isActive;
    group.hidden = !isActive;
  });
  modal.classList.toggle("modal--song", isSongModal);
  $("#modal-title").textContent = title;
  $("#modal-eyebrow").textContent = isSongModal ? "REPERTORIO MUSICAL" : "GESTIÓN DE CATÁLOGO";
  $("#modal-subtitle").textContent = isSongModal
    ? title.startsWith("Editar")
      ? "Actualiza los datos de esta canción."
      : "Completa los datos para agregarla al repertorio."
    : "";

  fields.forEach((field) => {
    const value = record[field.name] ?? field.value ?? "";

    if (field.type === "multi-combobox") {
      const container = $(`[data-multi-combobox="${field.name}"]`, activeGroup);
      const input = $(`[data-multi-artist-input]`, container);
      const hidden = $(`[data-multi-artist-value]`, container);
      const menu = $(`[data-multi-artist-options]`, container);
      let options = (field.options || []).filter((option) => option.value !== "");
      let selected = Array.isArray(value) ? value.map(String) : [];
      let searchTimer;
      let searchVersion = 0;

      const updateTags = () => renderSelectedArtistTags(container, selected, options);
      const showOptions = async () => {
        const version = ++searchVersion;
        const searchTerm = input.value.trim();
        const localMatches = options.filter((option) =>
          !selected.includes(String(option.value)) &&
          normalizeForSearch(option.label).includes(normalizeForSearch(searchTerm)),
        );
        renderComboboxOptions(menu, localMatches, "No encontramos más artistas.");
        menu.hidden = false;
        input.setAttribute("aria-expanded", "true");

        if (searchTerm.length < 2) {
          $(`[data-multi-artist-help]`, container).textContent = "Escribe al menos 2 letras para buscar entre todos los artistas.";
          return;
        }

        const safeTerm = searchTerm.replace(/[\\%_]/g, "\\$&");
        const { data, error } = await supabase
          .from("artists")
          .select("id,name")
          .ilike("name", `%${safeTerm}%`)
          .order("name")
          .limit(12);
        if (version !== searchVersion || input.value.trim() !== searchTerm) return;
        if (error) {
          renderComboboxOptions(menu, [], "No se pudo buscar artistas. Intenta nuevamente.");
          return;
        }

        const results = new Map((data || []).map((artist) => [artist.id, { value: artist.id, label: artist.name }]));
        for (const option of localMatches) {
          if (results.size >= 12) break;
          if (!results.has(option.value)) results.set(option.value, option);
        }
        options = [...new Map([...options, ...results.values()].map((option) => [option.value, option])).values()];
        renderComboboxOptions(menu, [...results.values()].filter((option) => !selected.includes(String(option.value))), "No encontramos más artistas.");
      };

      input.addEventListener("focus", showOptions);
      input.addEventListener("input", () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(showOptions, 250);
      });
      menu.addEventListener("click", (event) => {
        const option = event.target.closest("[data-option-value]");
        if (!option || selected.includes(option.dataset.optionValue)) return;
        if (selected.length >= 10) return toast("Puedes asignar hasta 10 artistas por canción.", "error");
        selected.push(option.dataset.optionValue);
        input.value = "";
        updateTags();
        showOptions();
        input.focus();
      });
      container.querySelector("[data-selected-tags]").addEventListener("click", (event) => {
        const removeButton = event.target.closest("[data-remove-artist]");
        if (!removeButton) return;
        selected = selected.filter((id) => id !== removeButton.dataset.removeArtist);
        updateTags();
        showOptions();
      });
      updateTags();
    }

    if (field.type === "combobox") {
      const container = $(`[data-combobox="${field.name}"]`, activeGroup);
      const input = $(`[data-combobox-input]`, container);
      const hidden = $(`[data-combobox-value]`, container);
      const menu = $(`[data-combobox-options]`, container);
      const help = $(`[data-combobox-help]`, container);
      const options = (field.options || []).filter((option) => option.value !== "");
      const selectedOption = options.find((option) => String(option.value) === String(value));
      input.value = selectedOption?.label || "";
      hidden.value = value || "";
      const syncQuickGenres = (selectedValue) => {
        container.querySelectorAll("[data-quick-value]").forEach((button) => {
          button.classList.toggle("active", button.dataset.quickValue === String(selectedValue));
        });
      };
      const showOptions = () => {
        const searchTerm = normalizeForSearch(input.value.trim());
        const matches = options.filter((option) => normalizeForSearch(option.label).includes(searchTerm));
        renderComboboxOptions(menu, matches, "No encontramos coincidencias.");
        menu.hidden = false;
        input.setAttribute("aria-expanded", "true");
        help.textContent = matches.length > 12
          ? `Mostrando 12 de ${matches.length}. Escribe un poco más para afinar.`
          : `${matches.length} opción${matches.length === 1 ? "" : "es"} encontrada${matches.length === 1 ? "" : "s"}.`;
      };
      input.addEventListener("focus", showOptions);
      input.addEventListener("input", () => { hidden.value = ""; showOptions(); });
      menu.addEventListener("click", (event) => {
        const optionButton = event.target.closest("[data-option-value]");
        const chosen = options.find((option) => option.value === optionButton?.dataset.optionValue);
        if (!chosen) return;
        hidden.value = chosen.value;
        input.value = chosen.label;
        syncQuickGenres(chosen.value);
        menu.hidden = true;
        input.setAttribute("aria-expanded", "false");
        help.textContent = "Opción seleccionada.";
      });
      container.querySelectorAll("[data-quick-value]").forEach((button) => {
        button.addEventListener("click", () => {
          const chosen = options.find((option) => option.value === button.dataset.quickValue);
          if (!chosen) return;
          hidden.value = chosen.value;
          input.value = chosen.label;
          menu.hidden = true;
          input.setAttribute("aria-expanded", "false");
          help.textContent = "Opción seleccionada.";
          syncQuickGenres(chosen.value);
        });
      });
      syncQuickGenres(value);
    }

    if (field.type === "segmented") {
      const radios = $$(`input[name="${field.name}"]`, activeGroup);
      radios.forEach((radio, index) => {
        radio.checked = String(radio.value) === String(value) || (!value && index === 0);
      });
    } else if (!["multi-combobox", "combobox"].includes(field.type)) {
      const input = activeGroup.elements.namedItem(field.name);
      if (input) {
        if (field.type === "checkbox") input.checked = Boolean(value);
        else if (field.type !== "file") input.value = value;
      }
    }
  });

  modalForm.onsubmit = async (event) => {
    event.preventDefault();
    const submit = $("#modal-save");
    const formData = new FormData(modalForm);
    const values = {};
    fields.forEach((field) => {
      const fieldValue = formData.get(field.name);
      if (field.type === "file") values[field.name] = fieldValue;
      else if (field.type === "checkbox") values[field.name] = formData.has(field.name);
      else if (field.type === "multi-combobox") {
        try { values[field.name] = JSON.parse(fieldValue || "[]"); }
        catch { values[field.name] = []; }
      } else values[field.name] = fieldValue;
    });

    const missingSelection = fields.find((field) => field.required && field.type === "combobox" && !values[field.name]);
    if (missingSelection) {
      toast(`Selecciona una opción existente en "${missingSelection.label}".`, "error");
      $(`[data-combobox="${missingSelection.name}"] [data-combobox-input]`, activeGroup).focus();
      return;
    }
    const missingArtists = fields.find((field) => field.required && field.type === "multi-combobox" && !values[field.name]?.length);
    if (missingArtists) {
      toast(`Agrega al menos un artista en "${missingArtists.label}".`, "error");
      $(`[data-multi-combobox="${missingArtists.name}"] [data-multi-artist-input]`, activeGroup).focus();
      return;
    }

    submit.disabled = true;
    submit.textContent = "Guardando…";
    try {
      const cacheCleared = await onSave(values);
      sessionStorage.setItem("admin-flash", cacheCleared === false ? cacheUpdateMessage() : "Cambios guardados correctamente.");
      window.location.reload();
    } catch (error) {
      toast(errorMessage(error), "error");
      submit.disabled = false;
      submit.textContent = isSongModal ? "Guardar canción" : "Guardar cambios";
    }
  };

  $("#modal-save").textContent = isSongModal ? "Guardar canción" : "Guardar cambios";
  backdrop.hidden = false;
  document.body.classList.add("modal-open");
}function closeModal() {
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
      
      return cacheCleared;
    },
  );
}

async function songModal(id = null) {
  let existing = {};
  if (id) {
    const { data, error } = await supabase.from("songs").select("id,title,artist_id,genre_id,language_id,song_artists(position,artist_id,artist:artists(id,name))").eq("id", id).single();
    if (error) return toast(errorMessage(error), "error");
    existing = { ...data, artist_ids: data.song_artists?.sort((a, b) => a.position - b.position).map((item) => item.artist_id) || (data.artist_id ? [data.artist_id] : []) };
  }
  const artistOptions = state.artists.map((a) => ({
    value: a.id,
    label: a.name,
  }));
  for (const link of existing.song_artists || []) {
    if (link.artist && !artistOptions.some((option) => option.value === link.artist.id)) {
      artistOptions.push({ value: link.artist.id, label: link.artist.name });
    }
  }
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
      name: "artist_ids",
      label: "Artistas o bandas",
      type: "multi-combobox",
      required: true,
      placeholder: "Busca y agrega artistas...",
      help: "Cada artista se guardará como una etiqueta independiente.",
      value: existing.artist_ids || [],
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
      const { error } = await supabase.rpc("save_song_with_artists", {
        p_song_id: id || null,
        p_title: v.title.trim(),
        p_artist_ids: v.artist_ids,
        p_genre_id: v.genre_id || null,
        p_language_id: v.language_id || null,
      });
      if (error) throw error;
      const cacheCleared = await revalidatePublicCache(["songs", "artists"]);
      
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
      
      return cacheCleared;
    },
  );
}
function confirmDelete(label, callback) {
  if (!confirm(`¿Eliminar "${label}"? Esta acción no se puede deshacer.`))
    return;
  callback()
    .then((cacheCleared) => {
      sessionStorage.setItem("admin-flash", cacheCleared === false ? cacheUpdateMessage() : "Registro eliminado.");
      window.location.reload();
    })
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
  sessionStorage.setItem("admin-flash", feedback.textContent);
  window.location.reload();
});
$("#settings-form").elements.logo_url.addEventListener("input", (e) =>
  renderLogoPreview(e.target.value),
);
if (!$("#admin-app").hidden) {
  showApp();
  const flashMessage = sessionStorage.getItem("admin-flash");
  if (flashMessage) {
    sessionStorage.removeItem("admin-flash");
    toast(flashMessage);
  }
}
