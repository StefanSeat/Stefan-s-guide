(function () {
  const PAGE = 24;
  const state = { view: "sve", category: "sve", area: "sve", query: "", favOnly: false, sort: "preporuka", limit: PAGE };

  // Boja tačkica i naslova za svaku kategoriju (kao na starim posterima)
  const COLORS = {
    jelo: "var(--orange)",
    kafa: "var(--yellow)",
    pice: "var(--green)",
    vidi: "var(--cream)",
    radi: "var(--sky)",
    noc: "var(--yellow)",
  };

  const $ = (id) => document.getElementById(id);
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const byId = (id) => LOCATIONS.find((l) => l.id === id);

  // localStorage može da ne radi (privatni prozor), zato sve ide kroz try/catch
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  /* Moja lista (dugme +) */
  let saved = new Set(store.get("sv-lista", []));
  function toggleSaved(id) {
    saved.has(id) ? saved.delete(id) : saved.add(id);
    store.set("sv-lista", [...saved]);
    updateCounts();
    if (state.view === "lista") renderGrid();
    else document.querySelectorAll(`[data-save="${id}"]`).forEach(setSaveBtn);
  }
  function setSaveBtn(btn) {
    const on = saved.has(btn.dataset.save);
    btn.setAttribute("aria-pressed", on);
    btn.textContent = on ? "✓" : "+";
    btn.title = on ? "Ukloni iz moje liste" : "Dodaj u moju listu";
  }

  /* Slike: tvoja slika iz images/, ako je nema onda fotografija sa Google Maps, ako ni nje nema onda poster sa ilustracijom */
  const missingLocal = new Set();

  // Ilustracija za poster prema tome šta je mesto (prvo pravilo koje se poklopi pobeđuje)
  const ICON_RULES = [
    [/9¾|harry/, "⚡"], [/bunny|zec/, "🐰"], [/karting/, "🏎️"], [/padel/, "🎾"], [/escape/, "🗝️"],
    [/board game|drustven|društven|igre/, "🎲"], [/muzej|museum|paranormal/, "🖼️"], [/botani|jevremovac/, "🌿"],
    [/hram|umetni|galerij/, "🎨"], [/bubble tea/, "🧋"], [/stroopwafel/, "🧇"], [/gelato|sladoled/, "🍦"],
    [/ramen/, "🍜"], [/sushi|wagokoro/, "🍣"], [/kinesk|vok\b|wok|makao|chinese/, "🥡"], [/kebab/, "🥙"],
    [/pizz|pica\b|picerij/, "🍕"], [/burger|diner/, "🍔"], [/barbecue|bbq|rodizio|meat|morava|na vatri|cevap|ćevap|rostilj|roštilj/, "🥩"],
    [/rizoto|risotto|pasta|lazanj|italian|pane e vino|sentimenti|da luca/, "🍝"], [/panin|sendvic|sendvič/, "🥪"],
    [/uštip|ustip/, "🍩"], [/palacink|palačink|kaiserschmarrn/, "🥞"], [/brekky|dorucak|doručak|breakfast|brunch/, "🍳"],
    [/kolac|kolač|torta|cake|dessert|desert|poslast|smokvic|alisa|fenisa|mama goca|koštana|kostana/, "🍰"],
    [/fit|plant|avocado|green|salat/, "🥗"], [/kafana|zavičaj|zavicaj|skadarlij|5 glava|ciribu|ćiribu|jagnet/, "🍲"],
    [/riblj|fish|meze|elliniko|piatakia|greek/, "🐟"], [/splav|reka\b|kej/, "🛶"], [/rooftop|view|pogled/, "🌇"],
    [/guinness|pub|pivo|beer|brew|draft|bure piva|pivokrat/, "🍺"], [/vino|wine/, "🍷"], [/rakij|shoot/, "🥃"],
    [/muzik|music|live/, "🎷"], [/sah|šah|chess/, "♟️"], [/koktel|cocktail|coctail/, "🍸"],
    [/kafa|coffee|espresso|kafeterij|caf[eé]|pržion|przion|kapucino/, "☕"],
  ];
  const PATTERNS = ["pat-dots", "pat-rays", "pat-stripes", "pat-rings"];

  function iconFor(l) {
    // Prvo se gleda naziv mesta, pa tek onda tekst recenzije
    const name = l.name.toLowerCase();
    const text = (l.description || "").toLowerCase();
    const hit = ICON_RULES.find(([re]) => re.test(name)) || ICON_RULES.find(([re]) => re.test(text));
    return l.icon || (hit ? hit[1] : CATEGORIES[l.category]?.icon || "📍");
  }

  function patternFor(l) {
    let h = 0;
    for (const c of l.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return PATTERNS[h % PATTERNS.length];
  }

  function imageHtml(l) {
    const file = l.image ? `<small class="ph-file">📷 ${esc(l.image)}</small>` : "";
    const ph = `<div class="placeholder ${patternFor(l)}" style="--dot:${COLORS[l.category] || "var(--orange)"}"><span class="ico">${iconFor(l)}</span>${file}</div>`;
    // Slika se traži u images/ pod imenom mesta (npr. images/paninoteca.jpg), osim ako je u data.js upisana druga
    const local = !missingLocal.has(l.id)
      ? `<img class="photo" src="${esc(l.image || `images/${l.id}.jpg`)}" alt="${esc(l.name)}" loading="lazy" data-local="${esc(l.id)}" />`
      : "";
    return ph + local;
  }

  // Kada lokalna slika ne postoji, traži se fotografija sa Google Maps
  function onImageError(e) {
    const img = e.target;
    if (!(img instanceof HTMLImageElement)) return;
    const id = img.dataset.local;
    const box = img.parentElement;
    img.remove();
    if (id) {
      missingLocal.add(id);
      requestGooglePhoto(box, id);
    }
  }

  function mapsUrl(l) {
    return l.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.name + ", Beograd")}`;
  }

  const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);

  /* Google Maps i Places (sa ključem iz js/config.js) */
  const API_KEY = (typeof GOOGLE_MAPS_API_KEY !== "undefined" && GOOGLE_MAPS_API_KEY) || "";
  let googleReady;
  function loadGoogle() {
    if (!API_KEY) return Promise.reject(new Error("Nema Google API ključa"));
    if (!googleReady) {
      googleReady = new Promise((resolve, reject) => {
        window.__gmReady = resolve;
        const s = document.createElement("script");
        s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(API_KEY)}&v=weekly&language=sr&loading=async&callback=__gmReady`;
        s.async = true;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    return googleReady;
  }

  // Fotografije se čuvaju samo dok je stranica otvorena (Google ne dozvoljava trajno čuvanje)
  const photoCache = {};
  function getGooglePhoto(l) {
    if (!photoCache[l.id]) {
      photoCache[l.id] = (async () => {
        await loadGoogle();
        const { Place } = await google.maps.importLibrary("places");
        let place;
        const knownId = l.placeId || store.get("sv-pid-" + l.id, "");
        if (knownId) {
          place = new Place({ id: knownId });
          await place.fetchFields({ fields: ["photos"] });
        } else {
          const { places } = await Place.searchByText({
            textQuery: `${l.name}, ${l.address || "Beograd"}`,
            fields: ["id", "photos"],
            locationBias: { lat: l.lat, lng: l.lng },
          });
          place = places && places[0];
          if (place) store.set("sv-pid-" + l.id, place.id);
        }
        const photo = place?.photos?.[0];
        if (!photo) return null;
        const author = photo.authorAttributions?.[0];
        return { url: photo.getURI({ maxWidth: 900 }), author: author?.displayName || "", authorUri: author?.uri || "" };
      })().catch(() => null);
    }
    return photoCache[l.id];
  }

  // Fotografija se učitava tek kada kartica dođe na ekran
  const photoObserver = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          photoObserver.unobserve(en.target);
          fillGooglePhoto(en.target, en.target.dataset.photoFor, false);
        });
      }, { rootMargin: "300px" })
    : null;

  function requestGooglePhoto(box, id) {
    if (!API_KEY || !box) return;
    box.dataset.photoFor = id;
    if (photoObserver) photoObserver.observe(box);
    else fillGooglePhoto(box, id, false);
  }

  async function fillGooglePhoto(box, id, withLink) {
    const p = await getGooglePhoto(byId(id));
    if (!p || !box.isConnected || box.querySelector(".photo")) return;
    const credit = p.author
      ? `<span class="credit">📷 ${withLink && p.authorUri ? `<a href="${esc(p.authorUri)}" target="_blank" rel="noopener">${esc(p.author)}</a>` : esc(p.author)} · Google</span>`
      : "";
    box.insertAdjacentHTML("beforeend", `<img class="photo" src="${esc(p.url)}" alt="${esc(byId(id).name)}" referrerpolicy="no-referrer" />${credit}`);
  }

  /* Statistika */
  function renderStats() {
    if (!$("stats")) return;
    const areas = new Set(LOCATIONS.map((l) => l.area));
    const top = LOCATIONS.filter((l) => l.rating === 5).length;
    $("stats").innerHTML = [
      [LOCATIONS.length, "mesta"],
      [areas.size, "krajeva"],
      [top, "ocena 5★"],
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
        const file = `images/kategorija-${k}.jpg`;
        return `<button class="tile" data-tile="${k}">
          <div class="ph" style="--dot:${COLORS[k] || "var(--orange)"}"><span>${file}</span><img src="${file}" alt="" loading="lazy" onerror="this.remove()" /></div>
          <span class="tile-label">${v.icon} ${esc(v.label)}</span>
        </button>`;
      })
      .join("");
  }

  function setCategory(cat) {
    state.category = cat;
    document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c.dataset.cat === cat));
    refresh();
  }

  function setView(view) {
    state.view = view;
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.view === view));
    refresh();
  }

  /* Filteri */
  function renderFilters() {
    const counts = {};
    LOCATIONS.forEach((l) => (counts[l.category] = (counts[l.category] || 0) + 1));
    const chips = [["sve", "Sve", LOCATIONS.length]].concat(
      Object.entries(CATEGORIES)
        .filter(([k]) => counts[k])
        .map(([k, v]) => [k, `${v.icon} ${v.label}`, counts[k]])
    );
    $("categoryChips").innerHTML = chips
      .map(([k, label, n]) => `<button class="chip${state.category === k ? " active" : ""}" data-cat="${k}" role="tab">${esc(label)} <small>${n}</small></button>`)
      .join("");

    const areas = [...new Set(LOCATIONS.map((l) => l.area))].sort((a, b) => a.localeCompare(b, "sr"));
    $("areaSelect").innerHTML =
      `<option value="sve">Svi krajevi</option>` + areas.map((a) => `<option value="${esc(a)}">${esc(a)}</option>`).join("");
  }

  function updateCounts() {
    $("countAll").textContent = LOCATIONS.length;
    $("countSaved").textContent = saved.size;
  }

  function filtered() {
    const q = state.query.trim().toLowerCase();
    const list = LOCATIONS.filter((l) => {
      if (state.view === "lista" && !saved.has(l.id)) return false;
      if (state.category !== "sve" && l.category !== state.category) return false;
      if (state.area !== "sve" && l.area !== state.area) return false;
      if (state.favOnly && l.rating !== 5) return false;
      if (q) {
        const hay = [l.name, l.area, l.short, l.description, ...(l.tags || [])].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (state.sort === "az") return list.sort((a, b) => a.name.localeCompare(b.name, "sr"));
    if (state.sort === "kraj") return list.sort((a, b) => a.area.localeCompare(b.area, "sr") || a.name.localeCompare(b.name, "sr"));
    return list.sort((a, b) => (b.rating || 0) - (a.rating || 0) || String(b.date).localeCompare(String(a.date)));
  }

  /* Kartice kao posteri */
  function renderGrid() {
    const all = filtered();
    const list = all.slice(0, state.limit);
    $("grid").innerHTML = list
      .map((l) => {
        const cat = CATEGORIES[l.category];
        return `<article class="card">
          <button class="card-open" data-open="${esc(l.id)}">
            <span class="card-img" style="display:block">
              ${imageHtml(l)}
              ${l.rating ? `<span class="fav">${l.rating}★</span>` : ""}
            </span>
            <span class="poster-title" style="--tc:${COLORS[l.category] || "var(--green)"}">
              <span class="pt-name">${esc(l.name)}</span>
              <span class="pt-sub">${cat ? esc(cat.label) : ""} · ${esc(l.area)}</span>
            </span>
          </button>
          <button class="save" data-save="${esc(l.id)}"></button>
        </article>`;
      })
      .join("");
    $("grid").querySelectorAll("[data-save]").forEach(setSaveBtn);
    // Mesta za koja već znamo da nemaju sliku u images/ odmah traže fotografiju sa Google Maps
    list.forEach((l, i) => {
      if (missingLocal.has(l.id)) requestGooglePhoto($("grid").children[i].querySelector(".card-img"), l.id);
    });
    const rest = all.length - list.length;
    $("moreBtn").hidden = rest <= 0;
    $("moreBtn").textContent = `Prikaži još (${rest})`;
    $("empty").hidden = all.length > 0;
    $("empty").textContent = state.view === "lista" && saved.size === 0
      ? "Tvoja lista je prazna. Klikni + na mestu da ga dodaš."
      : "Nema mesta za ovaj izbor.";
    updateMarkers(all);
  }

  /* Svaka promena filtera počinje od prve strane */
  function refresh() {
    state.limit = PAGE;
    renderGrid();
  }

  /* Prozor sa detaljima */
  function openDetail(id) {
    const l = byId(id);
    if (!l) return;
    const cat = CATEGORIES[l.category];
    $("detailBody").innerHTML = `
      <div class="detail-img" id="detailImg">${imageHtml(l)}</div>
      <div class="detail-content">
        <p class="eyebrow">${cat ? cat.icon + " " + esc(cat.label) : ""} · ${esc(l.area)}</p>
        <h3>${esc(l.name)}</h3>
        ${l.rating ? `<p class="review-stars" aria-label="Ocena ${l.rating} od 5">${stars(l.rating)} <small>moja Google recenzija${l.date ? " · " + esc(l.date.slice(0, 4)) : ""}</small></p>` : ""}
        ${l.rating ? `<p class="review">„${esc(l.description || l.short)}“</p>` : `<p>${esc(l.description || l.short)}</p>`}
        ${l.tip ? `<div class="tip"><strong>Stefanov savet:</strong> ${esc(l.tip)}</div>` : ""}
        <div class="detail-info">
          ${l.address ? `<span>📍 ${esc(l.address)}</span>` : ""}
          ${l.price ? `<span>💰 ${esc(l.price)}</span>` : ""}
        </div>
        ${l.tags?.length ? `<div class="tags">${l.tags.map((t) => `<span class="tag">#${esc(t)}</span>`).join("")}</div>` : ""}
        <div class="detail-actions">
          <a class="btn" href="${mapsUrl(l)}" target="_blank" rel="noopener">Otvori u Google Maps</a>
          <button class="btn btn-ghost" data-show-map="${esc(l.id)}">Prikaži na mapi</button>
        </div>
      </div>`;
    if (missingLocal.has(l.id)) fillGooglePhoto($("detailImg"), l.id, true);
    $("detail").showModal();
    history.replaceState(null, "", "#" + l.id);
  }

  function closeDetail() {
    if ($("detail").open) $("detail").close();
  }

  /* Mapa sa pinovima za sva mesta
     Bez API ključa: besplatna mapa (Leaflet + OpenStreetMap podloga) sa pinom za svako mesto.
     Sa Google ključem u js/config.js: Google mapa sa pinovima.
     Ako ni jedna ne može da se učita: ugrađena Google mapa za izabrano mesto. */
  let gmap, infoWindow, lmap, cluster;
  const markers = {};
  let currentId = null;
  let mapList = [];

  function embedUrl(l) {
    const q = encodeURIComponent(`${l.name}, ${l.address || "Beograd"}`);
    return `https://maps.google.com/maps?q=${q}&ll=${l.lat},${l.lng}&z=16&hl=sr&output=embed`;
  }

  function popupHtml(l) {
    return `<div class="popup-title">${esc(l.name)}</div>
      ${l.rating ? `<div class="popup-stars">${stars(l.rating)}</div>` : ""}
      <div class="popup-text">${esc(l.short)}</div>
      <button class="popup-link" data-open="${esc(l.id)}">Detalji →</button>`;
  }

  function initMap() {
    if (API_KEY) loadGoogle().then(initGoogleMap).catch(initFreeMap);
    else initFreeMap();
  }

  function initFreeMap() {
    if (typeof L === "undefined") return initEmbedMap();
    $("map").innerHTML = "";
    lmap = L.map("map", { scrollWheelZoom: false, zoomControl: true }).setView([44.8125, 20.4612], 13);
    // Podloga sa OpenStreetMap servera (besplatna, bez ključa; potpis OpenStreetMap je obavezan)
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(lmap);
    // Bliska mesta se spajaju u krug sa brojem dok ne zumiraš
    cluster = L.markerClusterGroup
      ? L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 36, spiderfyOnMaxZoom: true })
      : L.layerGroup();
    lmap.addLayer(cluster);
    LOCATIONS.forEach((l) => {
      const icon = L.divIcon({
        className: "",
        html: `<div class="pin" style="--pc:${COLORS[l.category] || "var(--orange)"}"><span>${iconFor(l)}</span></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -16],
      });
      const m = L.marker([l.lat, l.lng], { icon, title: l.name }).bindPopup(popupHtml(l), { maxWidth: 240 });
      m.on("click", () => markActive(l.id));
      markers[l.id] = m;
    });
    updateMarkers(mapList);
  }

  function initEmbedMap() {
    gmap = null;
    lmap = null;
    $("map").innerHTML = `<iframe id="mapFrame" title="Google mapa" loading="lazy"
      referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`;
    if (mapList.length) selectOnMap(currentId || mapList[0].id);
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
        label: { text: iconFor(l), fontSize: "16px" },
      });
      m.addListener("click", () => selectOnMap(l.id));
      markers[l.id] = m;
    });
    updateMarkers(mapList);
  }

  function renderMapList() {
    $("mapList").innerHTML = mapList
      .map((l) => `<li><button class="map-item${l.id === currentId ? " active" : ""}" data-map-id="${esc(l.id)}">
          <span class="map-item-icon">${iconFor(l)}</span>
          <span><strong>${esc(l.name)}</strong><small>${esc(l.area)}</small></span>
        </button></li>`)
      .join("");
  }

  function markActive(id) {
    currentId = id;
    document.querySelectorAll(".map-item").forEach((b) => b.classList.toggle("active", b.dataset.mapId === id));
  }

  function updateMarkers(list) {
    mapList = list;
    if (!list.some((l) => l.id === currentId)) currentId = list[0]?.id || null;
    renderMapList();
    if (lmap) {
      cluster.clearLayers();
      list.forEach((l) => cluster.addLayer(markers[l.id]));
      if (list.length === 1) lmap.setView([list[0].lat, list[0].lng], 16);
      else if (list.length) lmap.fitBounds(L.latLngBounds(list.map((l) => [l.lat, l.lng])), { padding: [30, 30], maxZoom: 15 });
    } else if (gmap) {
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
    const l = byId(id);
    if (!l) return;
    markActive(id);
    if (lmap) {
      const m = markers[id];
      if (!cluster.hasLayer(m)) cluster.addLayer(m);
      if (cluster.zoomToShowLayer) cluster.zoomToShowLayer(m, () => m.openPopup());
      else {
        lmap.setView([l.lat, l.lng], 16);
        m.openPopup();
      }
    } else if (gmap) {
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

  /* Plutajuće dugme "Pogledaj mapu" vidi se samo dok gledaš vodič */
  function initMapPill() {
    if (!("IntersectionObserver" in window)) return;
    let inGuide = false;
    let inMap = false;
    const update = () => ($("mapPill").hidden = !(inGuide && !inMap));
    new IntersectionObserver(([e]) => { inGuide = e.isIntersecting; update(); }, { rootMargin: "-40% 0px -40% 0px" }).observe($("vodic"));
    new IntersectionObserver(([e]) => { inMap = e.isIntersecting; update(); }).observe($("mapa"));
  }

  /* Događaji */
  function bindEvents() {
    $("grid").addEventListener("error", onImageError, true);
    $("detailBody").addEventListener("error", onImageError, true);
    document.querySelector(".tabs").addEventListener("click", (e) => {
      const t = e.target.closest(".tab");
      if (t) setView(t.dataset.view);
    });
    $("categoryChips").addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (btn) setCategory(btn.dataset.cat);
    });
    $("tiles").addEventListener("click", (e) => {
      const tile = e.target.closest(".tile");
      if (!tile) return;
      setCategory(tile.dataset.tile);
      $("vodic").scrollIntoView({ behavior: "smooth" });
    });
    $("filterToggle").addEventListener("click", () => {
      const open = $("filterPanel").hidden;
      $("filterPanel").hidden = !open;
      $("filterToggle").setAttribute("aria-expanded", open);
    });
    $("sortSelect").addEventListener("change", (e) => {
      state.sort = e.target.value;
      refresh();
    });
    $("areaSelect").addEventListener("change", (e) => {
      state.area = e.target.value;
      refresh();
    });
    $("search").addEventListener("input", (e) => {
      state.query = e.target.value;
      refresh();
    });
    $("favOnly").addEventListener("change", (e) => {
      state.favOnly = e.target.checked;
      refresh();
    });
    document.addEventListener("click", (e) => {
      const save = e.target.closest("[data-save]");
      if (save) return toggleSaved(save.dataset.save);
      const open = e.target.closest("[data-open]");
      if (open) return openDetail(open.dataset.open);
      const show = e.target.closest("[data-show-map]");
      if (show) return showOnMap(show.dataset.showMap);
      const item = e.target.closest("[data-map-id]");
      if (item) selectOnMap(item.dataset.mapId);
    });
    $("moreBtn").addEventListener("click", () => {
      state.limit += PAGE;
      renderGrid();
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
  updateCounts();
  initMap();
  bindEvents();
  renderGrid();
  initMapPill();
  $("year").textContent = new Date().getFullYear();

  // Direktan link na lokaciju, npr. .../#kalemegdan
  const hashId = location.hash.slice(1);
  if (byId(hashId)) openDetail(hashId);
})();
