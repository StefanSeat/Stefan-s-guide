/*
  ZAJEDNICA: prijava mejlom, liste u oblaku, glasanje i mesta koja dodaju korisnici.
  Radi samo kada su u js/config.js upisani SUPABASE_URL i SUPABASE_ANON_KEY (vidi supabase/schema.sql).
*/
(function () {
  const URL_ = typeof SUPABASE_URL !== "undefined" ? SUPABASE_URL : "";
  const KEY = typeof SUPABASE_ANON_KEY !== "undefined" ? SUPABASE_ANON_KEY : "";
  if (!URL_ || !KEY || !window.SV) return;

  const SV = window.SV;
  const $ = (id) => document.getElementById(id);
  const esc = SV.esc;
  const SUPABASE_JS = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js";

  let sb = null;
  let user = null;
  let profile = null;
  let scores = {}; // place_key -> { up, down, score }
  let myVotes = {}; // place_key -> 1 | -1
  let userPlaces = []; // redovi iz tabele places
  let names = {}; // user id -> javno ime
  let lists = []; // moje liste u oblaku
  let currentList = null;
  let ctab = "top";

  /* ---------- Pomoćne ---------- */
  const placeKey = (row) => "u_" + row.id;
  const toLocation = (row) => ({
    id: placeKey(row),
    name: row.name,
    category: row.category,
    area: row.area || "",
    image: "",
    short: "",
    description: "",
    rating: null,
    source: "zajednica",
    address: row.address || "",
    lat: row.lat,
    lng: row.lng,
    mapsUrl: row.maps_url,
    tags: ["zajednica"],
    addedBy: row.created_by,
  });
  // Kratka poruka na dnu ekrana (npr. kada server odbije glas)
  function toast(text) {
    let el = $("svToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "svToast";
      el.className = "toast";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.hidden = false;
    clearTimeout(el._t);
    el._t = setTimeout(() => (el.hidden = true), 8000);
  }

  function msg(id, text, ok) {
    const el = $(id);
    el.textContent = text || "";
    el.classList.toggle("ok", !!ok);
  }

  // Iz Google Maps linka izvlači naziv i koordinate (ako ih link sadrži)
  function parseMapsUrl(u) {
    const out = { name: "", lat: null, lng: null };
    let s = u;
    try { s = decodeURIComponent(u); } catch {}
    const nm = s.match(/\/maps\/place\/([^/@?]+)/);
    if (nm) out.name = nm[1].replace(/\+/g, " ").trim();
    const d = s.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
    const at = s.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    const q = s.match(/[?&](?:q|query|ll)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
    const hit = d || at || q;
    if (hit) {
      out.lat = parseFloat(hit[1]);
      out.lng = parseFloat(hit[2]);
    }
    return out;
  }
  const isShortLink = (u) => /^https:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps)\//.test(u);
  const isMapsLink = (u) => /^https:\/\/((www\.)?google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl\/|goo\.gl\/maps\/)/i.test(u);

  /* ---------- Učitavanje biblioteke ---------- */
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function start() {
    try {
      if (!window.supabase) await loadScript(SUPABASE_JS);
      sb = window.supabase.createClient(URL_, KEY);
    } catch {
      return; // bez veze sa serverom sajt radi kao i pre
    }
    $("authBtn").hidden = false;
    $("zajednica").hidden = false;
    bindUi();
    sb.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    const { data } = await sb.auth.getSession();
    await setUser(data?.session?.user || null);
    await Promise.all([loadPlaces(), loadScores()]);
    renderVotes();
    renderCommunity();
    // Deljena lista može da sadrži mesta zajednice, pa je otvaramo ponovo kada su učitana
    if (location.hash.startsWith("#top=")) SV.handleHash();
  }

  /* ---------- Prijava ---------- */
  async function setUser(u) {
    const changed = (u?.id || null) !== (user?.id || null);
    user = u;
    $("authBtn").textContent = user ? (profile?.display_name || "Moj nalog") : "Prijava";
    $("authOut").hidden = !!user;
    $("authIn").hidden = !user;
    if (!changed) return;
    myVotes = {};
    lists = [];
    currentList = null;
    $("cloudLists").hidden = !user;
    if (user) {
      $("authWho").textContent = `Prijavljen si kao ${user.email}.`;
      await Promise.all([loadProfile(), loadMyVotes(), loadLists()]);
      $("authBtn").textContent = profile?.display_name || "Moj nalog";
      if (!profile?.display_name) openAuth(); // prvi put: izaberi javno ime
    }
    renderVotes();
    renderCommunity();
  }

  function openAuth() {
    msg("authMsg", "");
    msg("profileMsg", "");
    $("profileName").value = profile?.display_name || "";
    $("authDialog").showModal();
  }

  async function sendLink(e) {
    e.preventDefault();
    const email = $("authEmail").value.trim();
    msg("authMsg", "Šaljem…");
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: location.origin + location.pathname },
    });
    if (error) msg("authMsg", "Slanje nije uspelo: " + error.message);
    else msg("authMsg", `Poslali smo link na ${email}. Otvori mejl i klikni na link da se prijaviš.`, true);
  }

  async function loadProfile() {
    const { data } = await sb.from("profiles").select("id, display_name, is_admin").eq("id", user.id).maybeSingle();
    profile = data || null;
  }

  async function saveProfile(e) {
    e.preventDefault();
    const name = $("profileName").value.trim();
    const { error } = profile
      ? await sb.from("profiles").update({ display_name: name }).eq("id", user.id)
      : await sb.from("profiles").insert({ id: user.id, display_name: name });
    if (error) return msg("profileMsg", "Čuvanje nije uspelo: " + error.message);
    profile = { ...(profile || { id: user.id, is_admin: false }), display_name: name };
    names[user.id] = name;
    $("authBtn").textContent = name;
    msg("profileMsg", "Sačuvano ✓", true);
  }

  /* ---------- Glasanje ---------- */
  async function loadScores() {
    const { data, error } = await sb.from("place_scores").select("place_key, up, down, score");
    if (error) toast("Glasovi nisu učitani: " + error.message);
    scores = {};
    (data || []).forEach((r) => (scores[r.place_key] = r));
  }
  async function loadMyVotes() {
    const { data } = await sb.from("votes").select("place_key, value").eq("user_id", user.id);
    myVotes = {};
    (data || []).forEach((r) => (myVotes[r.place_key] = r.value));
  }

  function voteHtml(key) {
    const s = scores[key] || { up: 0, down: 0, score: 0 };
    const mine = myVotes[key] || 0;
    return `<button class="v-up${mine === 1 ? " on" : ""}" data-v="1" aria-label="Glas za" title="Glas za">▲</button>
      <b class="v-score" title="${s.up} za, ${s.down} protiv">${s.score > 0 ? "+" : ""}${s.score}</b>
      <button class="v-down${mine === -1 ? " on" : ""}" data-v="-1" aria-label="Glas protiv" title="Glas protiv">▼</button>`;
  }
  function renderVotes(root = document) {
    root.querySelectorAll("[data-vote]").forEach((el) => (el.innerHTML = voteHtml(el.dataset.vote)));
  }

  async function vote(key, value) {
    if (!user) return openAuth();
    const prev = myVotes[key] || 0;
    const next = prev === value ? 0 : value; // drugi klik na isto dugme poništava glas
    // Odmah prikaži promenu, pa je pošalji
    const s = (scores[key] = { ...(scores[key] || { place_key: key, up: 0, down: 0, score: 0 }) });
    if (prev === 1) s.up--;
    if (prev === -1) s.down--;
    if (next === 1) s.up++;
    if (next === -1) s.down++;
    s.score = s.up - s.down;
    if (next) myVotes[key] = next;
    else delete myVotes[key];
    renderVotes();
    const { error } = next
      ? await sb.from("votes").upsert({ user_id: user.id, place_key: key, value: next })
      : await sb.from("votes").delete().eq("user_id", user.id).eq("place_key", key);
    if (error) {
      toast("Glas nije sačuvan: " + error.message);
      await Promise.all([loadScores(), loadMyVotes()]);
      renderVotes();
    }
    if (ctab === "top") renderCommunity();
  }

  /* ---------- Mesta zajednice ---------- */
  async function loadPlaces() {
    const { data } = await sb.from("places").select("*").order("created_at", { ascending: false }).limit(500);
    userPlaces = data || [];
    const ids = [...new Set(userPlaces.map((p) => p.created_by))];
    if (ids.length) {
      const { data: profs } = await sb.from("profiles").select("id, display_name").in("id", ids);
      (profs || []).forEach((p) => (names[p.id] = p.display_name));
    }
    SV.addPlaces(userPlaces.map(toLocation));
  }

  function fillAddForm() {
    $("addCategory").innerHTML = Object.entries(SV.CATEGORIES)
      .map(([k, v]) => `<option value="${k}">${v.icon} ${esc(v.label)}</option>`)
      .join("");
    const areas = [...new Set(SV.LOCATIONS.map((l) => l.area).filter(Boolean))].sort((a, b) => a.localeCompare(b, "sr"));
    $("areaList").innerHTML = areas.map((a) => `<option value="${esc(a)}">`).join("");
  }

  function openAdd() {
    if (!user) return openAuth();
    fillAddForm();
    $("addForm").reset();
    $("addToList").checked = true;
    msg("addMsg", "");
    $("addDialog").showModal();
  }

  async function onUrlChange() {
    const u = $("addUrl").value.trim();
    if (!u) return;
    let full = u;
    if (isShortLink(u)) {
      msg("addMsg", "Otvaram kratki link…");
      try {
        const { data } = await sb.functions.invoke("resolve-maps", { body: { url: u } });
        if (data?.url) full = data.url;
      } catch {}
    }
    const p = parseMapsUrl(full);
    if (p.name && !$("addName").value) $("addName").value = p.name;
    $("addUrl").dataset.full = full;
    $("addUrl").dataset.lat = p.lat ?? "";
    $("addUrl").dataset.lng = p.lng ?? "";
    if (p.lat != null) msg("addMsg", "Link je prepoznat, mesto će imati pin na mapi.", true);
    else if (isShortLink(u)) msg("addMsg", "Kratki link nije mogao da se otvori. Upiši naziv, a za pin na mapi otvori link u browseru i nalepi punu adresu.");
    else msg("addMsg", "U linku nema lokacije, pa mesto neće imati pin na mapi. Ostalo radi.");
  }

  async function submitAdd(e) {
    e.preventDefault();
    const url = $("addUrl").value.trim();
    if (!isMapsLink(url)) return msg("addMsg", "To nije Google Maps link. Na Google Maps klikni Podeli i kopiraj link.");
    if ($("addUrl").dataset.full === undefined) await onUrlChange();
    const lat = parseFloat($("addUrl").dataset.lat);
    const lng = parseFloat($("addUrl").dataset.lng);
    const row = {
      name: $("addName").value.trim(),
      category: $("addCategory").value,
      area: $("addArea").value.trim(),
      maps_url: $("addUrl").dataset.full && isMapsLink($("addUrl").dataset.full) ? $("addUrl").dataset.full : url,
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
    };
    // Isto mesto već postoji?
    const dup = SV.LOCATIONS.find((l) => l.name.toLowerCase() === row.name.toLowerCase());
    if (dup) {
      msg("addMsg", `„${dup.name}“ je već u vodiču. Dodao sam ga u tvoju listu.`, true);
      if ($("addToList").checked) SV.setSaved([...SV.getSaved().filter((x) => x !== dup.id), dup.id]);
      return;
    }
    $("addSubmit").disabled = true;
    const { data, error } = await sb.from("places").insert(row).select().single();
    $("addSubmit").disabled = false;
    if (error) return msg("addMsg", "Dodavanje nije uspelo: " + error.message);
    userPlaces.unshift(data);
    names[user.id] = profile?.display_name || "";
    SV.addPlaces([toLocation(data)]);
    if ($("addToList").checked) SV.setSaved([...SV.getSaved(), placeKey(data)]);
    $("addDialog").close();
    ctab = "new";
    setCtab("new");
    $("zajednica").scrollIntoView({ behavior: "smooth" });
  }

  async function deletePlace(key) {
    const row = userPlaces.find((p) => placeKey(p) === key);
    if (!row) return;
    const btn = document.querySelector(`[data-del="${key}"]`);
    if (btn && btn.dataset.confirm !== "1") {
      btn.dataset.confirm = "1";
      btn.textContent = "Sigurno obrisati? Klikni ponovo";
      return;
    }
    const { error } = await sb.from("places").delete().eq("id", row.id);
    if (error) return;
    userPlaces = userPlaces.filter((p) => p !== row);
    SV.removePlace(key);
    renderCommunity();
  }

  // U detaljima mesta zajednice: ko je dodao i dugme za brisanje (autor ili admin)
  function renderCommunitySlots() {
    document.querySelectorAll("[data-community]").forEach((el) => {
      const key = el.dataset.community;
      const row = userPlaces.find((p) => placeKey(p) === key);
      if (!row) return (el.innerHTML = "");
      const canDelete = user && (row.created_by === user.id || profile?.is_admin);
      el.innerHTML = `<p class="added-by">Dodao/la: <b>${esc(names[row.created_by] || "član zajednice")}</b></p>
        ${canDelete ? `<button class="btn btn-ghost" data-del="${esc(key)}">Obriši mesto</button>` : ""}`;
    });
  }

  /* ---------- Rang lista zajednice ---------- */
  function setCtab(tab) {
    ctab = tab;
    document.querySelectorAll("[data-ctab]").forEach((b) => b.classList.toggle("active", b.dataset.ctab === tab));
    renderCommunity();
  }

  function renderCommunity() {
    let rows;
    if (ctab === "new") {
      rows = userPlaces.map((p) => SV.byId(placeKey(p))).filter(Boolean).slice(0, 20);
      $("communityEmpty").textContent = "Još niko nije dodao mesto. Budi prvi!";
    } else {
      rows = Object.values(scores)
        .filter((s) => s.score > 0 && SV.byId(s.place_key))
        .sort((a, b) => b.score - a.score || b.up - a.up)
        .slice(0, 10)
        .map((s) => SV.byId(s.place_key));
      $("communityEmpty").textContent = "Još nema glasova. Glasaj ▲ na mestima koja voliš.";
    }
    $("communityList").innerHTML = rows
      .map((l, i) => {
        const by = l.source === "zajednica" ? `<p class="rank-note">Dodao/la ${esc(names[l.addedBy] || "član zajednice")}</p>` : "";
        return SV.rankedItem(l, i + 1, by);
      })
      .join("");
    $("communityEmpty").hidden = rows.length > 0;
    SV.syncSaveButtons();
    SV.requestRankPhotos($("communityList"));
    renderVotes($("communityList"));
  }

  /* ---------- Liste u oblaku ---------- */
  let pushTimer = null;
  let applying = false;

  async function loadLists() {
    const { data } = await sb
      .from("lists")
      .select("id, title, created_at, list_items(place_key, rank)")
      .eq("owner", user.id)
      .order("created_at", { ascending: true });
    lists = data || [];
    if (!lists.length) {
      // Prva lista: počni od onoga što je korisnik već sačuvao u browseru
      const title = ($("myTopName").value || "").trim() || "Moja top 10";
      const { data: created } = await sb.from("lists").insert({ title }).select().single();
      if (created) {
        created.list_items = [];
        lists = [created];
        currentList = created;
        await pushItems(SV.getSaved());
      }
    }
    currentList = currentList || lists[0] || null;
    renderListSelect();
    applyList();
  }

  function renderListSelect() {
    $("listSelect").innerHTML = lists
      .map((L) => `<option value="${L.id}" ${currentList && L.id === currentList.id ? "selected" : ""}>${esc(L.title)}</option>`)
      .join("");
  }

  function applyList() {
    if (!currentList) return;
    applying = true;
    const ids = (currentList.list_items || []).sort((a, b) => a.rank - b.rank).map((i) => i.place_key);
    SV.setSaved(ids, true);
    $("myTopName").value = currentList.title;
    applying = false;
    sync("Sačuvano u nalogu ✓");
  }

  function sync(text) {
    $("syncStatus").textContent = text || "";
  }

  async function pushItems(ids) {
    if (!currentList) return;
    sync("Čuvam…");
    const rows = ids.slice(0, 50).map((place_key, i) => ({ list_id: currentList.id, place_key, rank: i + 1 }));
    const del = await sb.from("list_items").delete().eq("list_id", currentList.id);
    const ins = rows.length ? await sb.from("list_items").insert(rows) : { error: null };
    if (del.error || ins.error) {
      toast("Lista nije sačuvana: " + (del.error || ins.error).message);
      return sync("Čuvanje nije uspelo, pokušaj ponovo.");
    }
    currentList.list_items = rows.map(({ place_key, rank }) => ({ place_key, rank }));
    sync("Sačuvano u nalogu ✓");
  }

  async function newList() {
    const n = lists.length + 1;
    const { data, error } = await sb.from("lists").insert({ title: `Moja lista ${n}` }).select().single();
    if (error) return sync("Nova lista nije napravljena: " + error.message);
    data.list_items = [];
    lists.push(data);
    currentList = data;
    renderListSelect();
    applyList();
    $("myTopName").focus();
  }

  async function renameList() {
    if (!currentList) return;
    const title = $("myTopName").value.trim().slice(0, 60);
    if (!title || title === currentList.title) return;
    const { error } = await sb.from("lists").update({ title }).eq("id", currentList.id);
    if (!error) {
      currentList.title = title;
      renderListSelect();
    }
  }

  /* ---------- Događaji ---------- */
  function bindUi() {
    $("authBtn").addEventListener("click", openAuth);
    $("authForm").addEventListener("submit", sendLink);
    $("profileForm").addEventListener("submit", saveProfile);
    $("signOutBtn").addEventListener("click", async () => {
      await sb.auth.signOut();
      $("authDialog").close();
    });
    document.querySelectorAll("dialog [data-close]").forEach((b) => b.addEventListener("click", () => b.closest("dialog").close()));
    $("addPlaceBtn").addEventListener("click", openAdd);
    $("addPlaceBtn2").addEventListener("click", openAdd);
    $("addUrl").addEventListener("change", () => {
      delete $("addUrl").dataset.full;
      onUrlChange();
    });
    $("addForm").addEventListener("submit", submitAdd);
    document.querySelectorAll("[data-ctab]").forEach((b) => b.addEventListener("click", () => setCtab(b.dataset.ctab)));
    $("listSelect").addEventListener("change", (e) => {
      currentList = lists.find((L) => L.id === e.target.value) || currentList;
      applyList();
    });
    $("newListBtn").addEventListener("click", newList);
    $("myTopName").addEventListener("change", renameList);

    document.addEventListener("click", (e) => {
      const v = e.target.closest("[data-vote] [data-v]");
      if (v) {
        e.preventDefault();
        e.stopPropagation();
        return vote(v.closest("[data-vote]").dataset.vote, Number(v.dataset.v));
      }
      const d = e.target.closest("[data-del]");
      if (d) return deletePlace(d.dataset.del);
    }, true);

    document.addEventListener("sv:render", () => {
      renderVotes();
      renderCommunitySlots();
    });
    document.addEventListener("sv:saved", (e) => {
      if (!user || applying) return;
      clearTimeout(pushTimer);
      sync("Čuvam…");
      pushTimer = setTimeout(() => pushItems(e.detail), 600);
    });
  }

  start();
})();
