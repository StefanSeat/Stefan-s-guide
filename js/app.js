(function () {
  const state = { category: "sve", area: "sve", query: "", favOnly: false };

  const PALETTES = {
    jelo: ["#f2d0b5", "#b5563a"],
    kafa: ["#e9d8c4", "#7a5135"],
    pice: ["#e6c3c7", "#8a3b4a"],
    vidi: ["#d9dccb", "#5f6f4e"],
    radi: ["#cfe0dd", "#3f6f6a"],
    noc: ["#c9c6dd", "#3d3a64"],
  };

  const $ = (id) => document.getElementById(id);
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  function imageHtml(loc) {
    const [a, b] = PALETTES[loc.category] || PALETTES.jelo;
    const icon = CATEGORIES[loc.category]?.icon || "📍";
    // Obojena pozadina sa ikonicom ostaje ispod slike; ako slika ne postoji, ona se vidi
    const ph = `<div class="placeholder" style="--ph-a:${a};--ph-b:${b}">${icon}</div>`;
    if (!loc.image) return ph;
    return `${ph}<img class="photo" src="${esc(loc.image)}" alt="${esc(loc.name)}" loading="lazy" onerror="this.remove()" />`;
  }

  function mapsUrl(loc) {
    return `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`;
  }

  /* Statistika u hero delu */
  function renderStats() {
    const areas = new Set(LOCATIONS.map((l) => l.area));
    const favs = LOCATIONS.filter((l) => l.favorite).length;
    $("stats").innerHTML = [
      [LOCATIONS.length, "mesta"],
      [areas.size, "krajeva"],
      [favs, "favorita"],
    ]
      .map(([n, t]) => `<li><strong>${n}</strong><span>${t}</span></li>`)
      .join("");
  }

  /* Filteri */
  function renderFilters() {
    const counts = {};
    LOCATIONS.forEach((l) => (counts[l.category] = (counts[l.category] || 0) + 1));
    const chips = [["sve", "Sve", "✨", LOCATIONS.length]].concat(
      Object.entries(CATEGORIES)
        .filter(([k]) => counts[k])
        .map(([k, v]) => [k, v.label, v.icon, counts[k]])
    );
    $("categoryChips").innerHTML = chips
      .map(
        ([k, label, icon, n]) =>
          `<button class="chip${state.category === k ? " active" : ""}" data-cat="${k}" role="tab">${icon} ${esc(label)} <small>${n}</small></button>`
      )
      .join("");

    const areas = [...new Set(LOCATIONS.map((l) => l.area))].sort((a, b) => a.localeCompare(b, "sr"));
    $("areaSelect").innerHTML =
      `<option value="sve">Svi krajevi</option>` + areas.map((a) => `<option value="${esc(a)}">${esc(a)}</option>`).join("");
  }

  function filtered() {
    const q = state.query.trim().toLowerCase();
    return LOCATIONS.filter((l) => {
      if (state.category !== "sve" && l.category !== state.category) return false;
      if (state.area !== "sve" && l.area !== state.area) return false;
      if (state.favOnly && !l.favorite) return false;
      if (q) {
        const hay = [l.name, l.area, l.short, l.description, ...(l.tags || [])].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => (b.favorite === true) - (a.favorite === true));
  }

  /* Kartice */
  function renderGrid() {
    const list = filtered();
    $("grid").innerHTML = list
      .map((l) => {
        const cat = CATEGORIES[l.category];
        return `<button class="card" data-id="${esc(l.id)}">
          <div class="card-img">
            ${imageHtml(l)}
            <span class="badge">${cat ? cat.icon + " " + esc(cat.label) : ""}</span>
            ${l.favorite ? `<span class="fav">♥ Favorit</span>` : ""}
          </div>
          <div class="card-body">
            <div class="card-meta">${esc(l.area)}${l.price ? " · " + esc(l.price) : ""}</div>
            <h3>${esc(l.name)}</h3>
            <p>${esc(l.short)}</p>
          </div>
        </button>`;
      })
      .join("");
    $("empty").hidden = list.length > 0;
    updateMarkers(list);
  }

  /* Prozor sa detaljima */
  function openDetail(id) {
    const l = LOCATIONS.find((x) => x.id === id);
    if (!l) return;
    const cat = CATEGORIES[l.category];
    $("detailBody").innerHTML = `
      <div class="detail-img">${imageHtml(l)}</div>
      <div class="detail-content">
        <p class="eyebrow">${cat ? cat.icon + " " + esc(cat.label) : ""} · ${esc(l.area)}</p>
        <h3>${esc(l.name)}</h3>
        <p>${esc(l.description || l.short)}</p>
        ${l.tip ? `<div class="tip"><strong>Stefanov savet:</strong> ${esc(l.tip)}</div>` : ""}
        <div class="detail-info">
          ${l.address ? `<span>📍 ${esc(l.address)}</span>` : ""}
          <span>💰 ${l.price ? esc(l.price) : "Besplatno"}</span>
        </div>
        ${l.tags?.length ? `<div class="tags">${l.tags.map((t) => `<span class="tag">#${esc(t)}</span>`).join("")}</div>` : ""}
        <div class="detail-actions">
          <a class="btn" href="${mapsUrl(l)}" target="_blank" rel="noopener">Otvori u Google Maps</a>
          <button class="btn btn-ghost" data-show-map="${esc(l.id)}">Prikaži na mapi</button>
        </div>
      </div>`;
    $("detail").showModal();
    history.replaceState(null, "", "#" + l.id);
  }

  function closeDetail() {
    $("detail").close();
  }

  /* Mapa */
  let map, markerLayer;
  const markers = {};

  function initMap() {
    if (typeof L === "undefined") {
      $("map").innerHTML = '<p class="empty" style="padding:2rem">Mapa trenutno nije dostupna.</p>';
      return;
    }
    map = L.map("map", { scrollWheelZoom: false }).setView([44.8125, 20.4612], 13);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);
    markerLayer = L.layerGroup().addTo(map);

    LOCATIONS.forEach((l) => {
      const icon = L.divIcon({
        className: "",
        html: `<div class="map-pin"><span>${CATEGORIES[l.category]?.icon || "📍"}</span></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -32],
      });
      markers[l.id] = L.marker([l.lat, l.lng], { icon }).bindPopup(
        `<div class="popup-title">${esc(l.name)}</div>
         <div>${esc(l.short)}</div>
         <button class="popup-link" data-id="${esc(l.id)}">Detalji →</button>`
      );
    });
  }

  function updateMarkers(list) {
    if (!map) return;
    markerLayer.clearLayers();
    list.forEach((l) => markers[l.id] && markerLayer.addLayer(markers[l.id]));
    if (list.length) {
      map.fitBounds(L.latLngBounds(list.map((l) => [l.lat, l.lng])), { padding: [40, 40], maxZoom: 15 });
    }
  }

  function showOnMap(id) {
    closeDetail();
    const l = LOCATIONS.find((x) => x.id === id);
    if (!map || !l) return;
    if (!markerLayer.hasLayer(markers[id])) markerLayer.addLayer(markers[id]);
    $("mapa").scrollIntoView({ behavior: "smooth" });
    setTimeout(() => {
      map.setView([l.lat, l.lng], 16);
      markers[id].openPopup();
    }, 450);
  }

  /* Događaji */
  function bindEvents() {
    $("categoryChips").addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      state.category = btn.dataset.cat;
      document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === btn));
      renderGrid();
    });
    $("areaSelect").addEventListener("change", (e) => {
      state.area = e.target.value;
      renderGrid();
    });
    $("search").addEventListener("input", (e) => {
      state.query = e.target.value;
      renderGrid();
    });
    $("favOnly").addEventListener("change", (e) => {
      state.favOnly = e.target.checked;
      renderGrid();
    });
    $("grid").addEventListener("click", (e) => {
      const card = e.target.closest(".card");
      if (card) openDetail(card.dataset.id);
    });
    document.addEventListener("click", (e) => {
      const link = e.target.closest(".popup-link");
      if (link) openDetail(link.dataset.id);
      const show = e.target.closest("[data-show-map]");
      if (show) showOnMap(show.dataset.showMap);
    });
    $("closeDetail").addEventListener("click", closeDetail);
    $("detail").addEventListener("click", (e) => {
      if (e.target === $("detail")) closeDetail();
    });
    $("detail").addEventListener("close", () => {
      if (LOCATIONS.some((l) => "#" + l.id === location.hash)) history.replaceState(null, "", location.pathname);
    });
  }

  renderStats();
  renderFilters();
  initMap();
  bindEvents();
  renderGrid();
  $("year").textContent = new Date().getFullYear();

  // Direktan link na lokaciju, npr. .../#kalemegdan
  const hashId = location.hash.slice(1);
  if (LOCATIONS.some((l) => l.id === hashId)) openDetail(hashId);
})();
