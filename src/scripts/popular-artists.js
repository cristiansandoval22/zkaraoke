const $ = (selector, root = document) => root.querySelector(selector);

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

function getSafeImageUrl(value) {
  try {
    const url = new URL(value, window.location.origin);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function renderArtists(artists, list) {
  list.innerHTML = artists
    .map((artist) => {
      const imageUrl = getSafeImageUrl(artist.image_url);
      const portrait = imageUrl
        ? `<img class="popular-artists__image" src="${escapeHtml(imageUrl)}" alt="" loading="lazy" />`
        : '<span aria-hidden="true">♫</span>';

      return `<button class="popular-artists__card" type="button" data-popular-artist-name="${escapeHtml(artist.name)}" aria-label="Ver canciones de ${escapeHtml(artist.name)}">
      <span class="popular-artists__portrait">${portrait}</span>
      <span class="popular-artists__name">${escapeHtml(artist.name)}</span>
      <span class="popular-artists__kind">Artista</span>
    </button>`;
    })
    .join("");
}

async function loadPopularArtists() {
  const section = $(".popular-artists");
  const list = $("#popular-artists-list");
  const toggle = $("#popular-artists-toggle");
  if (!section || !list) return;

  try {
    const response = await fetch("/api/songs/popular-artists.json");
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "No se pudieron cargar los artistas.");

    const artists = result.artists || [];
    if (!artists.length) {
      list.innerHTML =
        '<p class="popular-artists__message">Aún no hay artistas para mostrar.</p>';
      return;
    }

    renderArtists(artists, list);
    toggle.hidden = artists.length <= 8;
  } catch (error) {
    console.error("No se pudieron cargar artistas populares:", error);
    list.innerHTML =
      '<p class="popular-artists__message">No se pudieron cargar los artistas. Intenta recargar la página.</p>';
  }
}

const toggle = $("#popular-artists-toggle");
toggle?.addEventListener("click", () => {
  const expanded = toggle.getAttribute("aria-expanded") !== "true";
  toggle.setAttribute("aria-expanded", String(expanded));
  $(".popular-artists")?.classList.toggle(
    "popular-artists--expanded",
    expanded,
  );
  toggle.textContent = expanded ? "Mostrar menos" : "Mostrar todo";
});

document.addEventListener("click", (event) => {
  const artistButton = event.target.closest("[data-popular-artist-name]");
  if (!artistButton) return;

  const search = $("#song-search");
  if (!search) return;
  search.value = artistButton.dataset.popularArtistName;
  search.dispatchEvent(new Event("input", { bubbles: true }));
  $(".filter-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  search.focus({ preventScroll: true });
});

loadPopularArtists();
