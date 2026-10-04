(function () {
  const state = { category: "sve", area: "sve", query: "", favOnly: false };

  const PALETTES = {
    jelo: ["#d4a98a", "#a4553f"],
    kafa: ["#c9b29a", "#7a5a43"],
    pice: ["#c9a0a0", "#7f4646"],
    vidi: ["#b9c2ac", "#5d6e54"],
    radi: ["#a9bdb3", "#4d6a59"],
    noc: ["#9a9db0", "#43465c"],
  };

  const $ = (id) => document.getElementById(id);
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  function imageHtml(loc) {
    const [a, b] = PALETTES[loc.category] || PALETTES.jelo;
    const icon = CATEGORIES[loc.category]?.icon || "📍";
    // Obojena pozadina sa ikonicom ostaje ispod slike; ako slika ne postoji, ona se vidi
    const file = loc.image ? `<small class="ph-file">📷 ${esc(loc.image)}</small>` : "";
    const ph = `<div class="placeholder" style="--ph-a:${a};--ph-b:${b}">${icon}${file}</div>`;
    if (!loc.image) return ph;
    return `${ph}<img class="photo" src="${esc(loc.image)}" alt="${esc(loc.name)}" loading="lazy" onerror="this.remove()" />`;
  }

  function mapsUrl(loc) {
    return `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`;
  }

  /* Statistika u hero delu */
  function renderStats() {
    if (!$("stats")) return;
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

  /* Pločice kategorija (slike: images/kategorija-<kategorija>.jpg) */
  function renderTiles() {
    const used = new Set(LOCATIONS.map((l) => l.category));
    $("tiles").innerHTML = Object.entries(CATEGORIES)
      .filter(([k]) => used.has(k))
      .map(([k, v]) => {
        const [a, b] = PALETTES[k] || PALETTES.jelo;
        const file = `images/kategorija-${k}.jpg`;
        return `<button class="tile" data-tile="${k}">
          <div class="ph" style="--ph-a:${a};--ph-b:${b}"><span>${file}</span><img src="${file}" alt="" loading="lazy" onerror="this.remove()" /></div>
          <span class="tile-label">${esc(v.label)}</span>
        </button>`;
      })
      .join("");
  }

  function setCategory(cat) {
    state.category = cat;
    document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c.dataset.cat === cat));
    renderGrid();
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

  /* Mapa (Google Maps)
     Bez API ključa: ugrađena Google mapa prikazuje izabrano mesto, a lista pored nje menja mesto.
     Sa ključem u js/config.js: jedna mapa sa pinovima za sva mesta. */
  const API_KEY = (typeof GOOGLE_MAPS_API_KEY !== "undefined" && GOOGLE_MAPS_API_KEY) || "";
  let gmap, infoWindow;
  const markers = {};
  let currentId = null;
  let mapList = [];

  function embedUrl(l) {
    const q = encodeURIComponent(`${l.name}, ${l.address || "Beograd"}`);
    return `https://maps.google.com/maps?q=${q}&ll=${l.lat},${l.lng}&z=16&hl=sr&output=embed`;
  }

  function popupHtml(l) {
    return `<div class="popup-title">${esc(l.name)}</div>
      <div class="popup-text">${esc(l.short)}</div>
      <button class="popup-link" data-id="${esc(l.id)}">Detalji →</button>`;
  }

  function initMap() {
    if (API_KEY) {
      window.__initGoogleMap = initGoogleMap;
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(API_KEY)}&callback=__initGoogleMap&loading=async`;
      s.async = true;
      s.onerror = initEmbedMap;
      document.head.appendChild(s);
    } else {
      initEmbedMap();
    }
  }

  function initEmbedMap() {
    gmap = null;
    $("map").innerHTML = `<iframe id="mapFrame" title="Google mapa" loading="lazy"
      referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`;
    if (mapList.length) selectOnMap(mapList[0].id);
  }

  function initGoogleMap() {
    gmap = new google.maps.Map($("map"), {
      center: { lat: 44.8125, lng: 20.4612 },
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      gestureHandling: "cooperative",
    });
    infoWindow = new google.maps.InfoWindow();
    LOCATIONS.forEach((l) => {
      const m = new google.maps.Marker({
        position: { lat: l.lat, lng: l.lng },
        title: l.name,
        label: { text: CATEGORIES[l.category]?.icon || "📍", fontSize: "16px" },
      });
      m.addListener("click", () => selectOnMap(l.id));
      markers[l.id] = m;
    });
    updateMarkers(mapList);
  }

  function renderMapList() {
    $("mapList").innerHTML = mapList
      .map((l) => `<li><button class="map-item${l.id === currentId ? " active" : ""}" data-map-id="${esc(l.id)}">
          <span class="map-item-icon">${CATEGORIES[l.category]?.icon || "📍"}</span>
          <span><strong>${esc(l.name)}</strong><small>${esc(l.area)}</small></span>
        </button></li>`)
      .join("");
  }

  function updateMarkers(list) {
    mapList = list;
    if (!list.some((l) => l.id === currentId)) currentId = list[0]?.id || null;
    renderMapList();
    if (gmap) {
      infoWindow.close();
      const bounds = new google.maps.LatLngBounds();
      LOCATIONS.forEach((l) => {
        const visible = list.includes(l);
        markers[l.id].setMap(visible ? gmap : null);
        if (visible) bounds.extend(markers[l.id].getPosition());
      });
      if (list.length === 1) {
        gmap.setCenter(bounds.getCenter());
        gmap.setZoom(15);
      } else if (list.length) {
        gmap.fitBounds(bounds, 40);
      }
    } else if (currentId && $("mapFrame")) {
      selectOnMap(currentId);
    }
  }

  function selectOnMap(id) {
    const l = LOCATIONS.find((x) => x.id === id);
    if (!l) return;
    currentId = id;
    document.querySelectorAll(".map-item").forEach((b) => b.classList.toggle("active", b.dataset.mapId === id));
    if (gmap) {
      markers[id].setMap(gmap);
      gmap.panTo({ lat: l.lat, lng: l.lng });
      gmap.setZoom(16);
      infoWindow.setContent(popupHtml(l));
      infoWindow.open({ map: gmap, anchor: markers[id] });
    } else if ($("mapFrame")) {
      const src = embedUrl(l);
      if ($("mapFrame").getAttribute("src") !== src) $("mapFrame").setAttribute("src", src);
    }
  }

  function showOnMap(id) {
    closeDetail();
    $("mapa").scrollIntoView({ behavior: "smooth" });
    selectOnMap(id);
  }

  /* Događaji */
  function bindEvents() {
    $("categoryChips").addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      setCategory(btn.dataset.cat);
    });
    $("tiles").addEventListener("click", (e) => {
      const tile = e.target.closest(".tile");
      if (!tile) return;
      setCategory(tile.dataset.tile);
      $("vodic").scrollIntoView({ behavior: "smooth" });
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
      const item = e.target.closest("[data-map-id]");
      if (item) selectOnMap(item.dataset.mapId);
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
  renderTiles();
  renderFilters();
  initMap();
  bindEvents();
  renderGrid();
  $("year").textContent = new Date().getFullYear();

  // Direktan link na lokaciju, npr. .../#kalemegdan
  const hashId = location.hash.slice(1);
  if (LOCATIONS.some((l) => l.id === hashId)) openDetail(hashId);
})();
