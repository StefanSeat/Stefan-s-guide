(function () {
  let tab = "stefan";

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

  /* Moja top 10 (dugme +); redosled dodavanja je i redosled na listi */
  let saved = new Set(store.get("sv-lista", []).filter((id) => byId(id)));
  const emit = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));
  const hasCoords = (l) => Number.isFinite(l.lat) && Number.isFinite(l.lng);

  function setSaved(ids, quiet) {
    saved = new Set(ids.filter((id) => byId(id)));
    store.set("sv-lista", [...saved]);
    if (!quiet) emit("sv:saved", [...saved]);
    updateCounts();
    renderMyTop();
    document.querySelectorAll("[data-save]").forEach(setSaveBtn);
  }
  function toggleSaved(id) {
    const ids = [...saved];
    setSaved(saved.has(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  }
  function moveSaved(id, dir) {
    const ids = [...saved];
    const i = ids.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    setSaved(ids);
  }
  function setSaveBtn(btn) {
    if (btn.classList.contains("ctl")) return;
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
    if (!(img instanceof HTMLImageElement) || !img.dataset.local) return;
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
          await place.fetchFields({ fields: ["photos", "rating", "userRatingCount"] });
        } else {
          const { places } = await Place.searchByText({
            textQuery: `${l.name}, ${l.address || "Beograd"}`,
            fields: ["id", "photos", "rating", "userRatingCount"],
            locationBias: { lat: l.lat, lng: l.lng },
          });
          place = places && places[0];
          if (place) store.set("sv-pid-" + l.id, place.id);
        }
        if (!place) return null;
        const photo = place.photos?.[0];
        const author = photo?.authorAttributions?.[0];
        return {
          url: photo ? photo.getURI({ maxWidth: 900 }) : "",
          author: author?.displayName || "",
          authorUri: author?.uri || "",
          rating: place.rating || null,
          count: place.userRatingCount || 0,
        };
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

  const fmtCount = (n) => n.toLocaleString("sr-RS");
  // 1 recenzija, 2-4 recenzije, 5+ recenzija
  const reviewsWord = (n) => (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "recenzije" : "recenzija");
  // Ocena mesta: Google prosek i broj recenzija (iz API-ja ili upisani u data.js), a ako ih nema, Stefanova ocena
  function ratingHtml(l, mode, live) {
    const g = live?.rating ? live : l.googleRating ? { rating: l.googleRating, count: l.googleReviews || 0 } : null;
    if (g) {
      const r = g.rating.toFixed(1);
      const c = g.count ? fmtCount(g.count) : "";
      if (mode === "card") return `<b>${r}</b> <span class="gstars">${stars(Math.round(g.rating))}</span>${c ? ` <span class="gcount">(${c})</span>` : ""}`;
      if (mode === "long") return `<span class="gstars">${stars(Math.round(g.rating))}</span> ${r}${c ? ` · ${c} ${reviewsWord(g.count)} na Google Maps` : " na Google Maps"}`;
      if (mode === "meta") return `· ${r}★${c ? ` (${c})` : ""}`;
      return `${r}★${c ? ` (${c})` : ""}`;
    }
    if (!l.rating) return "";
    if (mode === "card") return `<span class="gstars">${stars(l.rating)}</span> <span class="gcount">Stefanova ocena</span>`;
    if (mode === "long") return `<span class="gstars">${stars(l.rating)}</span> Stefanova ocena`;
    if (mode === "meta") return `· ${l.rating}★`;
    return `${l.rating}★`;
  }

  function ratingAttrs(l, mode) {
    return `data-grating="${esc(l.id)}" data-mode="${mode}" ${ratingHtml(l, mode) ? "" : "hidden"}`;
  }

  // Kada stignu podaci sa Google-a, osveži ocenu svuda gde se mesto prikazuje
  function showGoogleRating(id, p) {
    if (!p?.rating) return;
    const l = byId(id);
    document.querySelectorAll(`[data-grating="${id}"]`).forEach((el) => {
      el.innerHTML = ratingHtml(l, el.dataset.mode, p);
      el.hidden = false;
    });
  }

  async function fillGooglePhoto(box, id, withLink) {
    const p = await getGooglePhoto(byId(id));
    if (!p) return;
    showGoogleRating(id, p);
    if (!p.url || !box.isConnected || box.querySelector(".photo")) return;
    const credit = p.author
      ? `<span class="credit">📷 ${withLink && p.authorUri ? `<a href="${esc(p.authorUri)}" target="_blank" rel="noopener">${esc(p.author)}</a>` : esc(p.author)} · Google</span>`
      : "";
    box.insertAdjacentHTML("beforeend", `<img class="photo" src="${esc(p.url)}" alt="${esc(byId(id).name)}" referrerpolicy="no-referrer" />${credit}`);
  }

  /* Statistika */
  function renderStats() {
    if (!$("stats")) return;
    const places = homePlaces();
    const areas = new Set(places.map((l) => l.area).filter(Boolean));
    $("stats").innerHTML = [
      [(typeof LISTS !== "undefined" ? LISTS : []).length, "top lista"],
      [places.length, "mesta"],
      [areas.size, "krajeva"],
    ]
      .map(([n, t]) => `<li><strong>${n}</strong><span>${t}</span></li>`)
      .join("");
  }

  /* Top liste */
  const listById = (id) => (typeof LISTS !== "undefined" ? LISTS : []).find((L) => L.id === id);
  // Za svako mesto: na kojim je Stefanovim listama i na kom mestu
  const stefanRanks = {};
  (typeof LISTS !== "undefined" ? LISTS : []).forEach((L) =>
    L.places.forEach((p, i) => (stefanRanks[p.id] = stefanRanks[p.id] || []).push({ list: L, rank: i + 1 }))
  );

  function renderTiles() {
    const lists = typeof LISTS !== "undefined" ? LISTS : [];
    $("tiles").innerHTML = lists
      .map((L, i) => {
        const colors = ["var(--orange)", "var(--green)", "var(--yellow)", "var(--sky)", "var(--red)"];
        return `<button class="tile list-tile" data-list="${esc(L.id)}">
          <div class="ph ${PATTERNS[i % PATTERNS.length]}" style="--dot:${colors[i % colors.length]}"><b class="tile-ico">${L.icon}</b></div>
          <span class="tile-label">${esc(L.title)}<small>Top ${L.places.length}</small></span>
        </button>`;
      })
      .join("");
  }

  // Jedan red na rangiranoj listi (Stefanova lista, moja top 10 ili deljena lista)
  function rankedItem(l, rank, extra = "", controls = "") {
    const cat = CATEGORIES[l.category];
    return `<li class="rank-item">
      <span class="rank-no">${rank}</span>
      <button class="rank-thumb" data-open="${esc(l.id)}" aria-label="${esc(l.name)}">${imageHtml(l)}</button>
      <div class="rank-body">
        <h3><button class="rank-name" data-open="${esc(l.id)}">${esc(l.name)}</button></h3>
        <p class="rank-meta">${cat ? cat.icon + " " + esc(cat.label) : ""}${l.area ? " · " + esc(l.area) : ""} <span class="rank-stars" ${ratingAttrs(l, "meta")}>${ratingHtml(l, "meta")}</span></p>
        <div class="vote" data-vote="${esc(l.id)}"></div>
        ${extra}
      </div>
      ${controls || `<button class="save" data-save="${esc(l.id)}"></button>`}
    </li>`;
  }

  function requestRankPhotos(container) {
    container.querySelectorAll(".rank-thumb").forEach((b) => requestGooglePhoto(b, b.dataset.open));
  }

  // Mesta sa svih Stefanovih top lista (ona su na mapi kada nijedna lista nije otvorena)
  function homePlaces() {
    const ids = [];
    (typeof LISTS !== "undefined" ? LISTS : []).forEach((L) => L.places.forEach((p) => !ids.includes(p.id) && ids.push(p.id)));
    return ids.map(byId).filter(Boolean);
  }

  // Prikaz jedne rangirane liste (Stefanove ili korisnikove) sa mestima na mapi
  function showRanked({ hash, kicker, title, intro, items }, scroll = true) {
    $("listKicker").textContent = kicker || "Top lista";
    $("listTitle").textContent = title;
    $("listIntro").textContent = intro || "";
    $("listItems").innerHTML = items
      .map(({ l, note }, i) => rankedItem(l, i + 1, note || l.short ? `<p class="rank-note">${esc(note || l.short)}</p>` : ""))
      .join("");
    $("listItems").querySelectorAll("[data-save]").forEach(setSaveBtn);
    requestRankPhotos($("listItems"));
    $("lista").hidden = false;
    $("lista").dataset.hash = hash;
    document.querySelectorAll("[data-list], [data-ulist]").forEach((t) => t.classList.toggle("active", "#" + (t.dataset.list ? "lista-" + t.dataset.list : "korisnik-" + t.dataset.ulist) === "#" + hash));
    updateMarkers(items.map((x) => x.l));
    emit("sv:render");
    history.replaceState(null, "", "#" + hash);
    if (scroll) $("lista").scrollIntoView({ behavior: "smooth" });
  }

  function openList(id, scroll = true) {
    const L = listById(id);
    if (!L) return;
    setTab("stefan");
    showRanked({
      hash: "lista-" + L.id,
      kicker: `${L.icon} Stefanova top lista`,
      title: L.title,
      intro: L.intro,
      items: L.places.map((p) => ({ l: byId(p.id), note: p.note })).filter((x) => x.l),
    }, scroll);
  }

  /* Kartice: Stefanove liste, liste korisnika, top lista svih, moja lista */
  function setTab(name) {
    tab = name;
    document.querySelectorAll("[data-ltab]").forEach((b) => {
      b.classList.toggle("active", b.dataset.ltab === name);
      b.setAttribute("aria-selected", b.dataset.ltab === name);
    });
    document.querySelectorAll("[data-lpanel]").forEach((p) => (p.hidden = p.dataset.lpanel !== name));
    if (name === "moja") updateMarkers([...saved].map(byId));
    emit("sv:tab", name);
  }

  /* Moja top 10 i deljenje */
  function renderMyTop() {
    const ids = [...saved];
    $("myTopItems").innerHTML = ids
      .map((id, i) => {
        const l = byId(id);
        const st = stefanRanks[id];
        const badge = st ? `<p class="rank-note">Stefan: #${st[0].rank} na listi „${esc(st[0].list.title)}“</p>` : "";
        const controls = `<div class="rank-controls">
            <button class="ctl" data-move="${esc(id)}" data-dir="-1" aria-label="Pomeri gore" ${i === 0 ? "disabled" : ""}>↑</button>
            <button class="ctl" data-move="${esc(id)}" data-dir="1" aria-label="Pomeri dole" ${i === ids.length - 1 ? "disabled" : ""}>↓</button>
            <button class="ctl" data-save="${esc(id)}" aria-label="Ukloni">✕</button>
          </div>`;
        return rankedItem(l, i + 1, badge, controls).replace('class="rank-item"', `class="rank-item${i >= 10 ? " beyond" : ""}"`);
      })
      .join("");
    $("myTopItems").querySelectorAll(".ctl[data-save]").forEach((b) => (b.textContent = "✕"));
    $("shareTop").disabled = ids.length === 0;
    $("myTopEmpty").hidden = ids.length > 0;
    requestRankPhotos($("myTopItems"));
    if (tab === "moja") updateMarkers(ids.map(byId));
    emit("sv:render");
  }

  function shareUrl() {
    const ids = [...saved].slice(0, 10);
    const name = $("myTopName").value.trim();
    const q = new URLSearchParams({ top: ids.join(",") });
    if (name) q.set("ime", name);
    return `${location.origin}${location.pathname}#${q.toString()}`;
  }

  function showShared(params) {
    const ids = (params.get("top") || "").split(",").filter((id) => byId(id)).slice(0, 10);
    if (!ids.length) return false;
    const name = (params.get("ime") || "").slice(0, 40);
    $("sharedTitle").textContent = name || "Nečija top lista";
    const onStefan = ids.filter((id) => stefanRanks[id]).length;
    const rated = ids.map((id) => byId(id).rating).filter(Boolean);
    const mine = ids.filter((id) => saved.has(id)).length;
    const parts = [`Poklapanje sa Stefanovim top listama: <strong>${onStefan} od ${ids.length}</strong>.`];
    if (rated.length) parts.push(`Stefan je ocenio ${rated.length} od ${ids.length} ovih mesta, prosečno ${(rated.reduce((a, b) => a + b, 0) / rated.length).toFixed(1)}★.`);
    if (saved.size) parts.push(`Sa tvojom listom se poklapa ${mine} ${mine === 1 ? "mesto" : "mesta"}.`);
    $("sharedCompare").innerHTML = parts.join(" ");
    $("sharedItems").innerHTML = ids
      .map((id, i) => {
        const st = stefanRanks[id];
        const extra = st
          ? `<p class="rank-note match">✓ I Stefan ga ima: #${st[0].rank} na listi „${esc(st[0].list.title)}“</p>`
          : "";
        return rankedItem(byId(id), i + 1, extra);
      })
      .join("");
    $("sharedItems").querySelectorAll("[data-save]").forEach(setSaveBtn);
    requestRankPhotos($("sharedItems"));
    $("deljena").hidden = false;
    $("deljena").dataset.ids = ids.join(",");
    $("adoptTop").textContent = saved.size ? "Zameni moju listu ovom" : "Sačuvaj kao moju listu";
    updateMarkers(ids.map(byId));
    $("deljena").scrollIntoView();
    emit("sv:render");
    return true;
  }

  function handleHash() {
    const raw = location.hash.slice(1);
    if (!raw) return;
    if (raw.startsWith("top=")) return showShared(new URLSearchParams(raw));
    const h = decodeURIComponent(raw);
    if (h === "moja-lista") {
      setTab("moja");
      return $("liste").scrollIntoView({ behavior: "smooth" });
    }
    if (h.startsWith("lista-")) return openList(h.slice(6));
    if (h.startsWith("korisnik-")) return emit("sv:open-user-list", h.slice(9));
    if (byId(h)) openDetail(h);
  }

  function updateCounts() {
    $("countSaved").textContent = saved.size ? saved.size : "";
  }

  /* Pretraga mesta za dodavanje u moju listu */
  function renderSearch() {
    const q = $("placeSearch").value.trim().toLowerCase();
    if (!q) {
      $("placeResults").hidden = true;
      return;
    }
    const hits = LOCATIONS.filter((l) => `${l.name} ${l.area} ${CATEGORIES[l.category]?.label || ""}`.toLowerCase().includes(q)).slice(0, 8);
    $("placeResults").innerHTML = hits.length
      ? hits
          .map((l) => `<li><button class="save sr-add" data-save="${esc(l.id)}"></button>
            <button class="sr-name" data-open="${esc(l.id)}">${iconFor(l)} ${esc(l.name)}<small>${esc(l.area)}</small></button></li>`)
          .join("")
      : `<li class="sr-empty">Nema tog mesta. Dodaj ga sa Google Maps (potrebna je prijava).</li>`;
    $("placeResults").querySelectorAll("[data-save]").forEach(setSaveBtn);
    $("placeResults").hidden = false;
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
        <p class="review-stars" ${ratingAttrs(l, "long")}>${ratingHtml(l, "long")}</p>
        ${l.description || l.short ? `<p>${esc(l.description || l.short)}</p>` : ""}
        ${l.tip ? `<div class="tip"><strong>Stefanov savet:</strong> ${esc(l.tip)}</div>` : ""}
        <div class="vote vote-big" data-vote="${esc(l.id)}"></div>
        <div class="community-slot" data-community="${esc(l.id)}"></div>
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
    if (API_KEY) fillGooglePhoto($("detailImg"), l.id, true);
    $("detail").showModal();
    emit("sv:render");
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

  // Opis pina u stilu Google kartice: slika, naziv, ocena sa brojem recenzija i tip mesta
  function popupHtml(l) {
    const cat = CATEGORIES[l.category];
    return `<div class="gcard">
      <div class="gcard-img" data-gcard="${esc(l.id)}">${imageHtml(l)}</div>
      <div class="gcard-body">
        <div class="gcard-name">${esc(l.name)}</div>
        <div class="gcard-rating" ${ratingAttrs(l, "card")}>${ratingHtml(l, "card")}</div>
        <div class="gcard-type">${cat ? esc(cat.label) : ""}${l.area ? " · " + esc(l.area) : ""}</div>
        <div class="vote" data-vote="${esc(l.id)}"></div>
        <div class="popup-row">
          <button class="popup-link" data-open="${esc(l.id)}">Detalji →</button>
          <a class="popup-link" href="${esc(mapsUrl(l))}" target="_blank" rel="noopener">Google Maps ↗</a>
        </div>
      </div>
    </div>`;
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
    LOCATIONS.filter(hasCoords).forEach(makeLeafletMarker);
    updateMarkers(mapList);
  }

  function makeLeafletMarker(l) {
    const icon = L.divIcon({
      className: "",
      html: `<div class="pin" style="--pc:${COLORS[l.category] || "var(--orange)"}"><span>${iconFor(l)}</span></div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -16],
    });
    const m = L.marker([l.lat, l.lng], { icon, title: l.name }).bindPopup(() => popupHtml(l), { maxWidth: 280, minWidth: 280, className: "gpopup" });
    m.on("click", () => markActive(l.id));
    m.on("popupopen", (e) => {
      // Sa Google ključem kartica dobija pravu fotografiju, ocenu i broj recenzija
      const box = e.popup.getElement()?.querySelector(".gcard-img");
      if (box && API_KEY) fillGooglePhoto(box, l.id, false);
      emit("sv:render");
    });
    markers[l.id] = m;
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
    LOCATIONS.filter(hasCoords).forEach((l) => {
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
    const pinned = list.filter((l) => markers[l.id]);
    if (lmap) {
      cluster.clearLayers();
      pinned.forEach((l) => cluster.addLayer(markers[l.id]));
      if (pinned.length === 1) lmap.setView([pinned[0].lat, pinned[0].lng], 16);
      else if (pinned.length) lmap.fitBounds(L.latLngBounds(pinned.map((l) => [l.lat, l.lng])), { padding: [30, 30], maxZoom: 15 });
    } else if (gmap) {
      infoWindow.close();
      const bounds = new google.maps.LatLngBounds();
      LOCATIONS.filter((l) => markers[l.id]).forEach((l) => {
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
    if (!markers[id]) return; // mesto bez koordinata nema pin
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

  /* Događaji */
  function bindEvents() {
    // Greška pri učitavanju slike ne "putuje" kroz stranicu, pa se hvata u fazi hvatanja na celom dokumentu
    document.addEventListener("error", onImageError, true);
    document.querySelector(".ltabs").addEventListener("click", (e) => {
      const t = e.target.closest("[data-ltab]");
      if (t) setTab(t.dataset.ltab);
    });
    $("placeSearch").addEventListener("input", renderSearch);
    $("tiles").addEventListener("click", (e) => {
      const tile = e.target.closest("[data-list]");
      if (tile) openList(tile.dataset.list);
    });
    $("listToMap").addEventListener("click", () => $("mapa").scrollIntoView({ behavior: "smooth" }));
    $("shareTop").addEventListener("click", () => {
      $("shareLink").value = shareUrl();
      $("shareBox").hidden = false;
      $("shareLink").select();
    });
    $("myTopName").value = store.get("sv-ime", "");
    $("myTopName").addEventListener("input", (e) => {
      store.set("sv-ime", e.target.value);
      if (!$("shareBox").hidden) $("shareLink").value = shareUrl();
    });
    $("copyLink").addEventListener("click", async () => {
      $("shareLink").select();
      try {
        await navigator.clipboard.writeText($("shareLink").value);
        $("copyLink").textContent = "Kopirano ✓";
      } catch {
        $("copyLink").textContent = "Označeno, kopiraj ručno";
      }
      setTimeout(() => ($("copyLink").textContent = "Kopiraj link"), 2500);
    });
    $("adoptTop").addEventListener("click", () => {
      setSaved($("deljena").dataset.ids.split(","));
      $("adoptTop").textContent = "Sačuvano ✓";
      setTab("moja");
      $("liste").scrollIntoView({ behavior: "smooth" });
    });
    $("myTopItems").addEventListener("click", (e) => {
      const mv = e.target.closest("[data-move]");
      if (mv) moveSaved(mv.dataset.move, Number(mv.dataset.dir));
    });
    window.addEventListener("hashchange", handleHash);
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
    $("closeDetail").addEventListener("click", closeDetail);
    $("detail").addEventListener("click", (e) => {
      if (e.target === $("detail")) closeDetail();
    });
    $("detail").addEventListener("close", () => {
      if (LOCATIONS.some((l) => "#" + l.id === location.hash)) {
        const h = !$("lista").hidden && $("lista").dataset.hash;
        history.replaceState(null, "", h ? "#" + h : location.pathname);
      }
    });
  }

  /* Veza sa zajednicom (js/community.js): dodavanje mesta korisnika i pristup listi */
  function addPlaces(places) {
    let added = 0;
    places.forEach((p) => {
      if (!p || byId(p.id)) return;
      LOCATIONS.push(p);
      if (lmap && hasCoords(p)) makeLeafletMarker(p);
      added++;
    });
    if (!added) return;
    renderMyTop();
  }

  function removePlace(id) {
    const i = LOCATIONS.findIndex((l) => l.id === id);
    if (i < 0) return;
    LOCATIONS.splice(i, 1);
    if (markers[id]) {
      if (cluster) cluster.removeLayer(markers[id]);
      delete markers[id];
    }
    if (saved.has(id)) setSaved([...saved].filter((x) => x !== id));
    closeDetail();
    renderMyTop();
  }

  window.SV = {
    LOCATIONS, CATEGORIES, byId, esc, addPlaces, removePlace, setSaved, rankedItem, requestRankPhotos,
    openDetail, closeDetail, handleHash, showRanked, setTab, updateMarkers, homePlaces,
    getSaved: () => [...saved],
    syncSaveButtons: () => document.querySelectorAll("[data-save]").forEach(setSaveBtn),
  };

  renderStats();
  renderTiles();
  updateCounts();
  mapList = homePlaces();
  initMap();
  bindEvents();
  renderMyTop();
  updateMarkers(homePlaces());
  $("year").textContent = new Date().getFullYear();

  // Direktni linkovi: mesto (#kalemegdan), lista (#lista-kafa) ili deljena lista (#top=...)
  handleHash();
})();
