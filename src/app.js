/* Lodówka+ — logika aplikacji */
(() => {
  'use strict';

  // ================= Narzędzia =================
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
  const fmtNum = (n) => Number.isInteger(n) ? String(n) : String(round2(n)).replace('.', ',');
  const zl = (n) => (Number(n) || 0).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const zl0 = (n) => (Number(n) || 0).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 });

  const todayISO = () => toISO(new Date());
  function toISO(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function addDays(days, from = new Date()) {
    const d = new Date(from); d.setDate(d.getDate() + Number(days)); return toISO(d);
  }
  function daysLeft(iso) {
    const [y, m, d] = String(iso).split('-').map(Number);
    const exp = new Date(y, m - 1, d);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    return Math.round((exp - now) / 86400000);
  }
  const plDays = (n) => { n = Math.abs(n); return n === 1 ? '1 dzień' : `${n} dni`; };
  function expiryInfo(iso) {
    const d = daysLeft(iso);
    if (d < 0) return { cls: 'expired', text: `Po terminie ${plDays(d)}`, d };
    if (d === 0) return { cls: 'today', text: 'Kończy się dziś', d };
    if (d === 1) return { cls: 'soon', text: 'Do jutra', d };
    if (d <= 3) return { cls: 'soon', text: `Jeszcze ${plDays(d)}`, d };
    return { cls: 'ok', text: `Jeszcze ${plDays(d)}`, d };
  }
  const fmtDate = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtDateShort = (ts) => new Date(ts).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
  const catOf = (p) => CATEGORIES[p.category] || CATEGORIES.inne;

  /* Zgadywanie kategorii po nazwie (paragony, ręczne wpisy) */
  const CAT_WORDS = [
    ['nabial', ['mleko', 'ser', 'jogurt', 'kefir', 'twarog', 'smietan', 'maslo', 'jaj', 'serek', 'mozzarell', 'maslank']],
    ['mieso', ['kurczak', 'piers', 'filet', 'szynk', 'kielbas', 'wolow', 'wieprz', 'indyk', 'mielon', 'boczek', 'ryb', 'losos', 'dorsz', 'tunczyk', 'parowk']],
    ['warzywa', ['pomidor', 'ogor', 'papryk', 'cebul', 'czosn', 'marchew', 'ziemniak', 'salat', 'szpinak', 'brokul', 'kapust', 'cukini', 'pieczark', 'rzodkiew', 'por ', 'seler', 'buraki']],
    ['owoce', ['banan', 'jablk', 'gruszk', 'pomarancz', 'cytryn', 'truskawk', 'winogron', 'mandaryn', 'kiwi', 'borowk', 'malin', 'awokado']],
    ['pieczywo', ['chleb', 'bulk', 'bagiet', 'rogal', 'pieczyw', 'kajzer', 'tortill']],
    ['suche', ['makaron', 'ryz', 'kasz', 'maka', 'platki', 'cukier', 'sol ', 'olej', 'oliw', 'herbat', 'kawa', 'czekolad', 'ciastk', 'chips', 'orzech', 'fasol', 'soczewic', 'musli']],
    ['napoje', ['woda', 'sok', 'napoj', 'cola', 'piwo', 'wino', 'lemoniad']],
    ['sosy', ['sos', 'ketchup', 'majonez', 'musztard', 'passata', 'koncentrat', 'pesto', 'przypraw', 'ocet']],
    ['mrozonki', ['mrozon', 'lody', 'pizza mroz', 'frytki']],
  ];
  function guessCategoryFromName(name) {
    const n = ` ${norm(name)} `;
    for (const [cat, words] of CAT_WORDS) if (words.some((w) => n.includes(' ' + w))) return cat;
    return 'inne';
  }

  // ================= Makroskładniki =================
  const ZERO = { kcal: 0, p: 0, f: 0, c: 0 };
  const addM = (a, b) => ({ kcal: a.kcal + b.kcal, p: a.p + b.p, f: a.f + b.f, c: a.c + b.c });
  const divM = (m, k) => ({ kcal: m.kcal / k, p: m.p / k, f: m.f / k, c: m.c / k });
  function lookupNut(name, category) {
    const n = ` ${norm(name)} `;
    for (const e of NUTRITION) if (e.keys.some((k) => n.includes(' ' + k))) return { kcal: e.kcal, p: e.p, f: e.f, c: e.c, unit: e.unit, est: true };
    return { ...(NUTRITION_BY_CAT[category] || NUTRITION_BY_CAT.inne), est: true, generic: true };
  }
  const nutOf = (p) => p.nut || lookupNut(p.name, p.category);
  function grams(qty, unit, nut) {
    if (unit === 'g' || unit === 'ml') return qty;
    if (unit === 'kg' || unit === 'l') return qty * 1000;
    return qty * ((nut && nut.unit) || 100);
  }
  function macrosFor(qty, unit, nut) {
    const k = grams(qty, unit, nut) / 100;
    return { kcal: (nut.kcal || 0) * k, p: (nut.p || 0) * k, f: (nut.f || 0) * k, c: (nut.c || 0) * k };
  }
  const r0 = (n) => Math.round(n);
  const macroLine = (m) => `<span class="macros"><b>${r0(m.kcal)} kcal</b><span>B ${r0(m.p)} g</span><span>T ${r0(m.f)} g</span><span>W ${r0(m.c)} g</span></span>`;

  // ================= Dieta (prywatna dla każdej osoby) =================
  let diet = null;                       // { sex, age, height, weight, activity, goal, type, kcal, p, f, c }
  let diary = { date: todayISO(), entries: [] };
  const DIET_KEY = 'lodowka-plus-diet';
  const diaryKey = () => 'lodowka-plus-day-' + todayISO();
  try { diet = JSON.parse(localStorage.getItem(DIET_KEY)) || null; } catch (_) { }
  try { const d = JSON.parse(localStorage.getItem(diaryKey())); if (d && d.entries) diary = d; } catch (_) { }
  const personalDb = () => sync.db && sync.myId ? sync.db.collection('data/users/' + sync.myId) : null;
  function saveDiet(d) {
    diet = d;
    const col = personalDb();
    if (col) queueWrite('diet', () => col.doc('diet').set(clean(d)));
    else try { localStorage.setItem(DIET_KEY, JSON.stringify(d)); } catch (_) { }
  }
  function saveDiary() {
    diary.date = todayISO();
    const col = personalDb();
    if (col) { const body = clean(diary); queueWrite('day', () => col.doc('day-' + diary.date).set(body)); }
    else try { localStorage.setItem(diaryKey(), JSON.stringify(diary)); } catch (_) { }
  }
  function logEaten(name, m) {
    if (diary.date !== todayISO()) diary = { date: todayISO(), entries: [] };
    diary.entries.push({ id: uid(), name, kcal: round2(m.kcal), p: round2(m.p), f: round2(m.f), c: round2(m.c), at: Date.now() });
    saveDiary();
  }
  const eatenToday = () => (diary.date === todayISO() ? diary.entries : []).reduce((a, e) => addM(a, e), ZERO);

  function calcTargets(d) {
    const bmr = 10 * d.weight + 6.25 * d.height - 5 * d.age + (d.sex === 'm' ? 5 : -161);
    const tdee = bmr * d.activity;
    const kcal = Math.round((tdee * ({ cut: 0.85, keep: 1, bulk: 1.1 }[d.goal] || 1)) / 10) * 10;
    let perKg = { cut: 2, keep: 1.6, bulk: 1.8 }[d.goal] || 1.6;
    if (d.type === 'wysokobialkowa') perKg = 2.2;
    const p = Math.round(d.weight * perKg);
    let f, c;
    if (d.type === 'keto') { c = 30; f = Math.round((kcal - p * 4 - c * 4) / 9); }
    else { f = Math.round((kcal * 0.27) / 9); c = Math.round((kcal - p * 4 - f * 9) / 4); }
    return { kcal, p, f: Math.max(0, f), c: Math.max(0, c), bmr: Math.round(bmr), tdee: Math.round(tdee) };
  }
  const mealTarget = (type) => { const sh = MEAL_SHARE[type] ?? 0.3; return { kcal: diet.kcal * sh, p: diet.p * sh, f: diet.f * sh, c: diet.c * sh }; };

  /* Ocena, czy porcja pasuje do diety: per = makro na porcję, cats = [{cat, name}] */
  function dietFit(per, type, cats) {
    if (!diet) return null;
    const t = mealTarget(type);
    const dt = DIET_TYPES[diet.type] || {};
    const issues = [], good = [];
    let score = 100;
    if (dt.excludeCats) {
      const bad = [...new Set(cats.filter((x) => dt.excludeCats.includes(x.cat)).map((x) => x.name))];
      if (bad.length) { issues.push(`Zawiera: ${bad.join(', ')} — nie pasuje do diety ${dt.gen || dt.label.toLowerCase()}.`); score -= 60; }
    }
    if (dt.maxCarbsPerMeal && per.c > dt.maxCarbsPerMeal) { issues.push(`${r0(per.c)} g węglowodanów — za dużo jak na keto (max ok. ${dt.maxCarbsPerMeal} g).`); score -= 40; }
    const ratio = per.kcal / t.kcal;
    if (ratio > 1.3) { issues.push(`${r0(per.kcal)} kcal — o ${r0((ratio - 1) * 100)}% więcej niż Twój cel na ${type} (${r0(t.kcal)} kcal). Zmniejsz porcję.`); score -= 25; }
    else if (ratio < 0.6) { issues.push(`Tylko ${r0(per.kcal)} kcal — mało jak na ${type} (cel ok. ${r0(t.kcal)} kcal). Dodaj coś sycącego.`); score -= 15; }
    else good.push(`kaloryczność w normie (${r0(per.kcal)} z ${r0(t.kcal)} kcal)`);
    if (per.p < t.p * 0.7) { issues.push(`Mało białka: ${r0(per.p)} g z ok. ${r0(t.p)} g na ten posiłek.`); score -= 15; }
    else good.push(`białko ${r0(per.p)} g`);
    score -= Math.min(15, Math.abs(1 - ratio) * 30);
    return { ok: !issues.length, issues, good, score: Math.max(0, Math.round(score)), target: t };
  }
  const fitBadge = (fit) => !fit ? '' : fit.ok ? '<span class="badge ok">✅ Pasuje do diety</span>'
    : fit.score >= 60 ? '<span class="badge soon">⚠️ Prawie pasuje</span>' : '<span class="badge expired">✗ Nie pasuje do diety</span>';

  // ================= Stan =================
  const COLS = ['products', 'meals', 'receipts', 'events', 'goals'];
  const DEFAULT_SETTINGS = { eatOutPrice: 30 };
  let state = { products: [], meals: [], receipts: [], events: [], goals: [], settings: { ...DEFAULT_SETTINGS } };
  const LOCAL_KEY = 'lodowka-plus-v1';

  const sync = {
    mode: 'local',      // 'local' | 'shared'
    db: null, user: null, sample: null,
    myId: null,
    readOnly: false,
    status: 'local',    // local | connecting | ok | stale | error
    loaded: {},         // col -> true po pierwszym potwierdzonym odczycie
  };

  function loadLocal() {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (!raw) return null;
      const d = JSON.parse(raw);
      return {
        products: d.products || [], meals: d.meals || [], receipts: d.receipts || [],
        events: d.events || [], goals: d.goals || [], settings: { ...DEFAULT_SETTINGS, ...(d.settings || {}) },
      };
    } catch (_) { return null; }
  }
  function saveLocal() {
    if (sync.mode !== 'local') return;
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(state)); } catch (_) { }
  }

  /* Kolejka zapisów: jeden zapis naraz na dokument, najnowszy wygrywa */
  const writeQ = {};
  function queueWrite(path, fn) {
    const q = writeQ[path] || (writeQ[path] = { busy: false, next: null });
    q.next = fn;
    if (!q.busy) drain(q);
  }
  async function drain(q) {
    q.busy = true;
    while (q.next) {
      const f = q.next; q.next = null;
      try { await f(); } catch (e) { handleWriteError(e); }
    }
    q.busy = false;
  }
  let lastWriteErr = 0;
  function handleWriteError(e) {
    const code = e && e.code;
    if (code === 'invalid_argument') {
      sync.readOnly = true;
      renderHouse();
      toast('Masz tylko podgląd tej lodówki. Poproś właściciela o uprawnienia Współtwórcy.');
    } else if (code === 'quota_exceeded') {
      toast('Baza jest pełna. Usuń stare paragony lub historię, żeby zapisać nowe dane.');
    } else if (Date.now() - lastWriteErr > 4000) {
      lastWriteErr = Date.now();
      toast('Nie udało się zapisać zmian. Sprawdź połączenie.');
    }
  }
  const clean = (o) => JSON.parse(JSON.stringify(o));

  function put(col, obj) {
    if (sync.readOnly) { toast('Masz tylko podgląd — nie możesz zmieniać tej lodówki.'); return false; }
    const arr = state[col];
    const i = arr.findIndex((x) => x.id === obj.id);
    if (i >= 0) arr[i] = obj; else arr.push(obj);
    if (sync.mode === 'shared') {
      const body = clean(obj); delete body.id;
      queueWrite(`${col}/${obj.id}`, () => sync.db.collection(col).doc(obj.id).set(body));
    } else saveLocal();
    return true;
  }
  function del(col, id) {
    if (sync.readOnly) { toast('Masz tylko podgląd — nie możesz zmieniać tej lodówki.'); return false; }
    state[col] = state[col].filter((x) => x.id !== id);
    if (sync.mode === 'shared') queueWrite(`${col}/${id}`, () => sync.db.collection(col).doc(id).delete());
    else saveLocal();
    return true;
  }
  function putSettings(patch) {
    state.settings = { ...state.settings, ...patch };
    if (sync.mode === 'shared') {
      if (sync.readOnly) return;
      const body = clean(state.settings);
      queueWrite('meta/settings', () => sync.db.doc('meta/settings').set(body));
    } else saveLocal();
  }
  const productById = (id) => state.products.find((p) => p.id === id);

  /* Zapis zdarzenia do historii budżetu */
  function logEvent(ev) {
    put('events', { id: uid(), at: Date.now(), by: sync.myId, ...ev });
  }

  // ================= Toast i potwierdzenia =================
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
  }
  function askConfirm(msg, okLabel = 'Usuń') {
    const d = $('#confirmDialog');
    $('#confirmText').textContent = msg;
    $('#confirmYes').textContent = okLabel;
    return new Promise((resolve) => {
      const done = (v) => { d.close(); resolve(v); };
      $('#confirmYes').onclick = () => done(true);
      $('#confirmNo').onclick = () => done(false);
      d.oncancel = () => resolve(false);
      d.showModal();
    });
  }

  // ================= Nawigacja =================
  function showView(name) {
    $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.view === name));
    $$('.view').forEach((v) => v.classList.toggle('active', v.id === `view-${name}`));
    if (name !== 'scan') stopScan();
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  document.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-view]');
    if (tab) showView(tab.dataset.view);
    const go = e.target.closest('[data-goto]');
    if (go) showView(go.dataset.goto);
  });

  // ================= Domownicy (nazwy i avatary) =================
  /* Elementy z data-uid dostają nazwę osoby; .avatar[data-uid] — zdjęcie */
  async function paintPeople() {
    if (!sync.user) return;
    const els = $$('[data-uid]');
    const ids = [...new Set(els.map((e) => e.dataset.uid).filter(Boolean))];
    if (!ids.length) return;
    const ps = await sync.user.profiles(ids);
    els.forEach((el) => {
      const p = ps[el.dataset.uid]; if (!p) return;
      if (el.tagName === 'IMG') { el.src = p.avatarUrl; el.alt = p.name || 'Domownik'; el.title = p.name || 'Domownik'; }
      else el.textContent = p.isMe ? 'Ty' : (p.name || 'Domownik');
    });
  }
  function memberIds() {
    const ids = new Set();
    if (sync.myId) ids.add(sync.myId);
    for (const col of COLS) for (const x of state[col]) if (x.by) ids.add(x.by);
    return [...ids];
  }

  function renderHouse() {
    const label = $('#houseLabel'), dot = $('#syncDot');
    dot.className = 'sync-dot ' + sync.status;
    if (sync.mode === 'local') label.textContent = 'Lokalnie';
    else if (sync.status === 'connecting') label.textContent = 'Łączenie…';
    else if (sync.status === 'stale') label.textContent = 'Brak połączenia';
    else if (sync.status === 'error') label.textContent = 'Błąd synchronizacji';
    else label.textContent = sync.readOnly ? 'Wspólna · podgląd' : 'Wspólna lodówka';
    const ids = memberIds().slice(0, 4);
    $('#houseAvatars').innerHTML = sync.mode === 'shared' ? ids.map((id) => `<img class="avatar" data-uid="${esc(id)}" alt="">`).join('') : '';
    paintPeople();
  }

  function openHouseDialog() {
    const b = $('#houseBody');
    if (sync.mode === 'local') {
      b.innerHTML = `
        <p>Ta kopia strony działa <b>lokalnie</b> — dane są zapisane tylko w tej przeglądarce.</p>
        <p class="muted">Wspólna lodówka działa w wersji online Lodówki+ (link z claude.ai). Tam każda zaproszona osoba widzi i zmienia te same produkty, posiłki i paragony na żywo.</p>`;
    } else {
      const ids = memberIds();
      b.innerHTML = `
        <p>Wszyscy, którym udostępnisz tę stronę, widzą <b>tę samą lodówkę</b>: produkty, posiłki, paragony i cele. Zmiany pojawiają się u wszystkich od razu.</p>
        <h4>Domownicy</h4>
        <ul class="members">${ids.map((id) => `<li><img class="avatar lg" data-uid="${esc(id)}" alt=""><span data-uid="${esc(id)}">…</span>${id === sync.myId ? ' <span class="tag">Ty</span>' : ''}</li>`).join('')}</ul>
        <p class="muted small">Na liście są osoby, które już coś dodały.</p>
        <h4>Jak zaprosić domownika</h4>
        <ol class="steps">
          <li>Kliknij <b>Udostępnij</b> (Share) w rogu tej strony na claude.ai.</li>
          <li>Dodaj osobę i nadaj jej uprawnienie <b>Współtwórca</b> (Contributor) albo <b>Edytor</b> — wtedy może dodawać produkty i paragony.</li>
          <li>Osoba z uprawnieniem <b>Przeglądający</b> (Viewer) widzi lodówkę, ale niczego nie zmieni.</li>
        </ol>
        ${sync.readOnly ? '<p class="warn-text">Masz teraz tylko podgląd. Poproś właściciela o uprawnienia Współtwórcy.</p>' : ''}`;
    }
    $('#houseDialog').showModal();
    paintPeople();
  }
  $('#btnHouse').addEventListener('click', openHouseDialog);
  $('#btnCloseHouse').addEventListener('click', () => $('#houseDialog').close());

  // ================= Lodówka =================
  function renderStats() {
    const soon = state.products.filter((p) => { const d = daysLeft(p.expiry); return d >= 0 && d <= 3; }).length;
    const expired = state.products.filter((p) => daysLeft(p.expiry) < 0).length;
    const value = state.products.reduce((s, p) => s + (p.unitPrice || 0) * p.qty, 0);
    $('#stats').innerHTML = `
      <div class="stat"><b>${state.products.length}</b><span>produktów</span></div>
      <div class="stat warn"><b>${soon}</b><span>kończy się</span></div>
      <div class="stat bad"><b>${expired}</b><span>po terminie</span></div>
      <div class="stat good"><b>${zl0(value)}</b><span>wartość</span></div>`;
  }

  function renderAlerts() {
    const urgent = state.products.map((p) => ({ p, d: daysLeft(p.expiry) })).filter((x) => x.d <= 2).sort((a, b) => a.d - b.d);
    if (!urgent.length) { $('#alerts').innerHTML = ''; return; }
    const atRisk = urgent.reduce((s, x) => s + (x.p.unitPrice || 0) * x.p.qty, 0);
    const names = urgent.slice(0, 4).map((x) => `<b>${esc(x.p.name)}</b>`).join(', ');
    const more = urgent.length > 4 ? ` i ${urgent.length - 4} inne` : '';
    $('#alerts').innerHTML = `
      <div class="alert">
        <span class="alert-icon">⏰</span>
        <div><b>Uwaga na daty!</b> ${names}${more} — wykorzystaj je jak najszybciej.${atRisk > 0 ? ` Do uratowania: <b>${zl(atRisk)}</b>.` : ''}</div>
        <button class="btn small" data-goto="ideas">Co z tego zrobić?</button>
      </div>`;
  }

  function renderMigrate() {
    const box = $('#migrateBox');
    const local = sync.mode === 'shared' && !sync.readOnly && sync.loaded.products ? loadLocal() : null;
    const show = local && local.products.length && !state.products.length && !sessionDismissed;
    box.innerHTML = show ? `
      <div class="alert info">
        <span class="alert-icon">📦</span>
        <div>Masz w tej przeglądarce <b>${local.products.length} produktów</b> z wcześniejszej wersji. Przenieść je do wspólnej lodówki?</div>
        <button class="btn small primary" id="btnMigrate">Przenieś</button>
        <button class="btn small ghost" id="btnMigrateNo">Nie</button>
      </div>` : '';
  }
  let sessionDismissed = false;
  $('#migrateBox').addEventListener('click', (e) => {
    if (e.target.id === 'btnMigrateNo') { sessionDismissed = true; renderMigrate(); }
    if (e.target.id === 'btnMigrate') {
      const local = loadLocal(); if (!local) return;
      local.products.forEach((p) => put('products', { ...p, by: p.by || sync.myId }));
      local.meals.forEach((m) => put('meals', { ...m, by: m.by || sync.myId }));
      try { localStorage.removeItem(LOCAL_KEY); } catch (_) { }
      sessionDismissed = true; render(); toast('Przeniesiono produkty do wspólnej lodówki');
    }
  });

  function renderFridge() {
    renderStats();
    renderMigrate();
    renderAlerts();
    const q = norm($('#search').value);
    const cat = $('#filterCat').value;
    const sortBy = $('#sortBy').value;
    let list = state.products.filter((p) => (!q || norm(p.name).includes(q)) && (!cat || p.category === cat));
    list.sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name, 'pl')
      : sortBy === 'added' ? (b.addedAt || 0) - (a.addedAt || 0)
      : a.expiry.localeCompare(b.expiry));

    $('#fridgeEmpty').hidden = state.products.length > 0;
    const shared = sync.mode === 'shared';
    $('#productList').innerHTML = list.map((p) => {
      const info = expiryInfo(p.expiry);
      const c = catOf(p);
      const pct = Math.max(0, Math.min(100, (info.d / Math.max(1, c.shelfDays)) * 100));
      const value = p.unitPrice ? p.unitPrice * p.qty : 0;
      return `
        <article class="product ${info.cls}" data-id="${p.id}">
          <div class="product-top">
            <span class="product-emoji">${esc(p.emoji || c.emoji)}</span>
            <div class="product-main">
              <h3>${esc(p.name)}</h3>
              <span class="muted small">${esc(c.label)}${p.store ? ` · ${esc(p.store)}` : ''}</span>
            </div>
            <button class="icon-btn" data-edit="${p.id}" title="Edytuj" aria-label="Edytuj">✎</button>
          </div>
          <div class="fresh-bar"><span style="width:${info.d < 0 ? 100 : pct}%"></span></div>
          <div class="product-bottom">
            <span class="badge ${info.cls}" title="${esc(fmtDate(p.expiry))}">${info.text}</span>
            <div class="qty">
              <button class="icon-btn" data-dec="${p.id}" aria-label="Mniej">−</button>
              <span>${fmtNum(p.qty)} ${esc(p.unit)}</span>
              <button class="icon-btn" data-inc="${p.id}" aria-label="Więcej">+</button>
            </div>
          </div>
          <div class="product-foot muted small">
            <span>Ważne do: ${fmtDate(p.expiry)}</span>
            ${value ? `<span class="price">${zl(value)}</span>` : ''}
          </div>
          ${shared && p.by ? `<div class="who small muted"><img class="avatar" data-uid="${esc(p.by)}" alt=""> dodał(a): <span data-uid="${esc(p.by)}">…</span></div>` : ''}
        </article>`;
    }).join('') || (state.products.length ? '<p class="muted">Brak produktów pasujących do filtra.</p>' : '');
  }

  const stepFor = (unit) => ({ g: 50, ml: 50, kg: 0.1, l: 0.1 }[unit] || 1);

  /* Zużycie produktu: zapisuje wartość do budżetu (zjedzone / zmarnowane) */
  function consume(p, amount, kind) {
    amount = Math.min(p.qty, amount);
    const d = daysLeft(p.expiry);
    const value = round2((p.unitPrice || 0) * amount);
    if (value > 0 || kind === 'wasted') {
      logEvent({ type: kind, name: p.name, category: p.category, qty: amount, unit: p.unit, value, rescued: kind === 'used' && d >= 0 && d <= 2 });
    }
    const left = round2(p.qty - amount);
    if (left <= 0) del('products', p.id);
    else put('products', { ...p, qty: left });
  }

  $('#productList').addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) { const card = e.target.closest('.product'); if (card) openProductDialog(productById(card.dataset.id)); return; }
    if (t.dataset.edit) return openProductDialog(productById(t.dataset.edit));
    const p = productById(t.dataset.inc || t.dataset.dec);
    if (!p) return;
    const step = stepFor(p.unit);
    if (t.dataset.inc) put('products', { ...p, qty: round2(p.qty + step) });
    else {
      consume(p, step, 'used');
      if (p.qty - step <= 0) toast(`Zużyto: ${p.name}`);
    }
    render();
  });
  ['#search', '#filterCat', '#sortBy'].forEach((s) => $(s).addEventListener('input', renderFridge));

  // ================= Dialog produktu =================
  const pDialog = $('#productDialog');
  const pForm = $('#productForm');

  function fillCategorySelects() {
    const opts = Object.entries(CATEGORIES).map(([k, c]) => `<option value="${k}">${c.emoji} ${c.label}</option>`).join('');
    $('#productCategory').innerHTML = opts;
    $('#filterCat').innerHTML = '<option value="">Wszystkie kategorie</option>' + opts;
  }
  function knownStores() {
    const s = new Set(['Biedronka', 'Lidl', 'Żabka', 'Kaufland', 'Auchan', 'Carrefour', 'Dino', 'Netto', 'Stokrotka']);
    state.receipts.forEach((r) => r.store && s.add(r.store));
    state.products.forEach((p) => p.store && s.add(p.store));
    return [...s];
  }
  function fillStoreList() {
    $('#storeList').innerHTML = knownStores().map((s) => `<option value="${esc(s)}">`).join('');
  }

  function openProductDialog(p = null, scanned = null) {
    pForm.reset();
    fillStoreList();
    const data = p || scanned || {};
    const isEdit = !!p;
    $('#productDialogTitle').textContent = isEdit ? 'Edytuj produkt' : 'Dodaj produkt';
    $('#btnDeleteProduct').hidden = !isEdit;
    $('#consumeRow').hidden = !isEdit;
    const category = data.category || 'inne';
    pForm.name.value = data.name || '';
    pForm.category.value = category;
    pForm.emoji.value = data.emoji || '';
    pForm.qty.value = data.qty ?? 1;
    pForm.unit.value = data.unit || 'szt';
    pForm.price.value = isEdit ? (p.unitPrice ? round2(p.unitPrice * p.qty) : '') : (data.price ?? '');
    pForm.store.value = data.store || '';
    pForm.expiry.value = data.expiry || addDays(data.days ?? CATEGORIES[category].shelfDays);
    pForm.code.value = data.code || '';
    pForm.id.value = isEdit ? p.id : '';
    fillNut(isEdit ? nutOf(p) : (data.nut || lookupNut(data.name || '', category)));
    $('#nutBox').dataset.touched = (isEdit && p.nut) || data.nut ? '1' : '';
    const info = $('#scannedInfo');
    if (scanned && scanned._source) {
      info.hidden = false;
      info.innerHTML = `✅ Rozpoznano kod <code>${esc(scanned.code || '')}</code> · ${esc(scanned._source)}. Sprawdź datę ważności na opakowaniu.`;
    } else if (scanned && scanned.code) {
      info.hidden = false;
      info.innerHTML = `ℹ️ Nie znaleźliśmy kodu <code>${esc(scanned.code)}</code> w bazie — uzupełnij dane ręcznie.`;
    } else info.hidden = true;
    pDialog.showModal();
    setTimeout(() => (pForm.name.value ? pForm.expiry : pForm.name).focus(), 50);
  }

  function fillNut(n) {
    pForm.nkcal.value = n.kcal ?? ''; pForm.np.value = n.p ?? ''; pForm.nf.value = n.f ?? ''; pForm.nc.value = n.c ?? ''; pForm.nunit.value = n.unit ?? '';
    nutSummary();
  }
  function nutSummary() {
    $('#nutSummary').textContent = pForm.nkcal.value ? `· ${pForm.nkcal.value} kcal, B ${pForm.np.value || 0} g na 100 g` : '';
  }
  $('#nutBox').addEventListener('input', () => { $('#nutBox').dataset.touched = '1'; nutSummary(); });
  function refreshNutEstimate() {
    if (!$('#nutBox').dataset.touched) fillNut(lookupNut(pForm.name.value, pForm.category.value));
  }
  pForm.category.addEventListener('change', refreshNutEstimate);
  pForm.name.addEventListener('input', refreshNutEstimate);
  pForm.category.addEventListener('change', () => {
    if (!pForm.id.value) pForm.expiry.value = addDays(CATEGORIES[pForm.category.value].shelfDays);
  });
  pForm.name.addEventListener('change', () => {
    if (!pForm.id.value && pForm.category.value === 'inne') {
      const c = guessCategoryFromName(pForm.name.value);
      if (c !== 'inne') { pForm.category.value = c; pForm.expiry.value = addDays(CATEGORIES[c].shelfDays); }
    }
  });
  $('#quickDates').addEventListener('click', (e) => {
    const b = e.target.closest('[data-days]');
    if (b) pForm.expiry.value = addDays(b.dataset.days);
  });

  pForm.addEventListener('submit', (e) => {
    if (e.submitter && e.submitter.value === 'cancel') return;
    e.preventDefault();
    const f = pForm;
    const qty = Math.max(0, parseFloat(f.qty.value) || 0);
    const price = parseFloat(String(f.price.value).replace(',', '.'));
    const entry = {
      name: f.name.value.trim(), category: f.category.value, emoji: f.emoji.value.trim(),
      qty, unit: f.unit.value, expiry: f.expiry.value, code: f.code.value,
      store: f.store.value.trim(),
      unitPrice: price > 0 && qty > 0 ? price / qty : 0,
    };
    if (f.nkcal.value !== '') {
      entry.nut = { kcal: +f.nkcal.value || 0, p: +f.np.value || 0, f: +f.nf.value || 0, c: +f.nc.value || 0, unit: +f.nunit.value || 100 };
    }
    if (f.id.value) {
      const old = productById(f.id.value);
      if (!(price > 0) && old.unitPrice && !f.price.value) entry.unitPrice = 0;
      if (put('products', { ...old, ...entry })) toast('Zapisano zmiany');
    } else {
      const same = state.products.find((p) => norm(p.name) === norm(entry.name) && p.expiry === entry.expiry && p.unit === entry.unit);
      if (same) {
        const total = same.qty + entry.qty;
        const unitPrice = total ? ((same.unitPrice || 0) * same.qty + entry.unitPrice * entry.qty) / total : 0;
        if (put('products', { ...same, qty: total, unitPrice })) toast(`Zwiększono ilość: ${same.name}`);
      } else if (put('products', { id: uid(), addedAt: Date.now(), by: sync.myId, ...entry })) {
        toast(`Dodano do lodówki: ${entry.name}`);
      }
    }
    pDialog.close(); render();
  });

  $('#btnDeleteProduct').addEventListener('click', async () => {
    const p = productById(pForm.id.value);
    if (p && await askConfirm(`Usunąć „${p.name}” z lodówki? (bez zapisu do budżetu — np. gdy dodano go przez pomyłkę)`)) {
      del('products', p.id); pDialog.close(); render(); toast('Usunięto produkt');
    }
  });
  $('#btnEaten').addEventListener('click', () => {
    const p = productById(pForm.id.value); if (!p) return;
    consume(p, p.qty, 'used'); pDialog.close(); render();
    toast(`Smacznego! ${p.name} zjedzone.`);
  });
  $('#btnWasted').addEventListener('click', () => {
    const p = productById(pForm.id.value); if (!p) return;
    consume(p, p.qty, 'wasted'); pDialog.close(); render();
    toast(p.unitPrice ? `Zapisano stratę: ${zl(p.unitPrice * p.qty)}` : 'Zapisano jako zmarnowane');
  });
  $('#btnAddManual').addEventListener('click', () => openProductDialog());

  // ================= Skanowanie =================
  let scanner = null;
  let scanning = false;
  function getScanner() {
    if (!window.Html5Qrcode) { toast('Nie udało się wczytać modułu skanera'); return null; }
    if (!scanner) { $('#reader').innerHTML = ''; scanner = new Html5Qrcode('reader', { verbose: false }); }
    return scanner;
  }
  async function startScan() {
    const s = getScanner(); if (!s) return;
    $('#scanStatus').textContent = 'Uruchamianie aparatu…';
    try {
      await s.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: (w, h) => { const m = Math.floor(Math.min(w, h) * 0.7); return { width: m, height: m }; } },
        (text) => { stopScan(); handleCode(text); },
        () => { }
      );
      scanning = true;
      $('#btnStartScan').disabled = true; $('#btnStopScan').disabled = false;
      $('#scanStatus').textContent = 'Skanowanie… Ustaw kod w ramce.';
    } catch (_) {
      $('#scanStatus').textContent = 'Podgląd z aparatu jest tu niedostępny. Użyj przycisku „Zrób zdjęcie kodu” — telefon otworzy aparat.';
    }
  }
  async function stopScan() {
    if (scanner && scanning) { scanning = false; try { await scanner.stop(); } catch (_) { } }
    $('#btnStartScan').disabled = false; $('#btnStopScan').disabled = true;
  }
  $('#btnStartScan').addEventListener('click', startScan);
  $('#btnStopScan').addEventListener('click', () => { stopScan(); $('#scanStatus').textContent = 'Aparat zatrzymany.'; });
  $('#scanFile').addEventListener('change', async (e) => {
    const file = e.target.files[0]; if (!file) return;
    await stopScan();
    const s = getScanner(); if (!s) return;
    try { handleCode(await s.scanFile(file, false)); } catch (_) { toast('Nie znaleziono kodu na zdjęciu. Spróbuj z bliska i przy dobrym świetle.'); }
    e.target.value = '';
  });
  $('#codeForm').addEventListener('submit', (e) => {
    e.preventDefault();
    handleCode($('#codeInput').value.trim());
    $('#codeInput').value = '';
  });

  function guessCategoryFromTags(tags = []) {
    const t = tags.join(' ');
    const map = [
      ['dairies|milk|cheese|yogurt', 'nabial'], ['meat|fish|poultry|seafood', 'mieso'],
      ['vegetable', 'warzywa'], ['fruit', 'owoce'], ['bread', 'pieczywo'],
      ['beverage|drink|juice|water', 'napoje'], ['sauce|condiment|spice', 'sosy'],
      ['frozen', 'mrozonki'], ['pasta|rice|cereal|flour|legume|snack', 'suche'],
    ];
    for (const [re, cat] of map) if (new RegExp(re).test(t)) return cat;
    return 'inne';
  }
  async function lookupOpenFoodFacts(code) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    try {
      const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,product_name_pl,brands,categories_tags,nutriments`, { signal: ctrl.signal });
      const j = await r.json();
      if (j.status !== 1 || !j.product) return null;
      const p = j.product;
      const name = [p.product_name_pl || p.product_name, p.brands && p.brands.split(',')[0]].filter(Boolean).join(' — ');
      if (!name) return null;
      const n = p.nutriments || {};
      const out = { name, category: guessCategoryFromTags(p.categories_tags), qty: 1, unit: 'szt' };
      if (n['energy-kcal_100g'] != null) out.nut = { kcal: round2(n['energy-kcal_100g']), p: round2(n.proteins_100g), f: round2(n.fat_100g), c: round2(n.carbohydrates_100g), unit: 100 };
      return out;
    } catch (_) { return null; } finally { clearTimeout(timer); }
  }
  async function handleCode(raw) {
    if (!raw) return;
    const text = raw.trim();
    if (text.startsWith('{')) {
      try {
        const d = JSON.parse(text);
        if (d.name) {
          const cat = CATEGORIES[d.category] ? d.category : guessCategoryFromName(d.name);
          return openProductDialog(null, { name: d.name, category: cat, qty: d.qty ?? 1, unit: d.unit || 'szt', emoji: d.emoji, expiry: d.expiry, days: d.days, price: d.price, code: d.code || 'QR', _source: 'dane z kodu QR' });
        }
      } catch (_) { }
    }
    const digits = text.replace(/\s/g, '');
    if (/^\d{8,14}$/.test(digits)) {
      if (PRODUCT_DB[digits]) return openProductDialog(null, { ...PRODUCT_DB[digits], code: digits, _source: 'baza Lodówka+' });
      $('#scanStatus').textContent = `Szukam kodu ${digits}…`;
      const found = await lookupOpenFoodFacts(digits);
      $('#scanStatus').textContent = 'Gotowe. Możesz zeskanować kolejny produkt.';
      return openProductDialog(null, found ? { ...found, code: digits, _source: 'Open Food Facts' } : { code: digits });
    }
    openProductDialog(null, { name: text.slice(0, 60), category: guessCategoryFromName(text), _source: 'tekst z kodu', code: 'QR' });
  }
  function renderQrSamples() {
    const box = $('#qrSamples');
    if (box.dataset.ready) return;
    box.dataset.ready = '1';
    const sample = ['5900820000011', '5900820000028', '5900820000042', '5900820000080', '5900820000059', '5900820000103'];
    box.innerHTML = sample.map((code) => {
      const p = PRODUCT_DB[code];
      return `<button class="qr-sample" data-code="${code}" title="Kliknij, aby „zeskanować”"><div class="qr" id="qr-${code}"></div><span>${p.emoji} ${esc(p.name)}</span></button>`;
    }).join('');
    sample.forEach((code) => {
      const el = document.getElementById(`qr-${code}`);
      if (window.QRCode) new QRCode(el, { text: code, width: 108, height: 108, correctLevel: QRCode.CorrectLevel.M });
      else el.innerHTML = `<code>${code}</code>`;
    });
    box.addEventListener('click', (e) => { const b = e.target.closest('[data-code]'); if (b) handleCode(b.dataset.code); });
  }

  // ================= Dopasowanie przepisów =================
  function productsMatching(ing) {
    return state.products.filter((p) => p.qty > 0)
      .filter((p) => { const n = ` ${norm(p.name)} `; return ing.keys.some((k) => n.includes(` ${k}`)); })
      .sort((a, b) => a.expiry.localeCompare(b.expiry));
  }
  function matchRecipe(r) {
    const rows = r.ingredients.map((ing) => ({ ing, product: productsMatching(ing)[0] || null }));
    const required = rows.filter((x) => !x.ing.optional);
    const have = required.filter((x) => x.product).length;
    const optHave = rows.filter((x) => x.ing.optional && x.product).length;
    const rescued = rows.filter((x) => x.product && daysLeft(x.product.expiry) <= 3).map((x) => x.product);
    const score = (have / required.length) * 100 + optHave * 5 + rescued.length * 15;
    // makro na porcję: składniki obowiązkowe + opcjonalne, które masz
    let per = ZERO; const cats = [];
    rows.forEach((x) => {
      if (x.ing.optional && !x.product) return;
      const cat = x.product ? x.product.category : guessCategoryFromName(x.ing.label);
      const nut = x.product ? nutOf(x.product) : lookupNut(x.ing.label, cat);
      per = addM(per, macrosFor(x.ing.g || 100, 'g', nut));
      cats.push({ cat, name: x.product ? x.product.name : x.ing.label });
    });
    const fit = dietFit(per, r.type.includes('obiad') ? 'obiad' : r.type[0], cats);
    return { recipe: r, rows, have, need: required.length, rescued, score, pct: Math.round((have / required.length) * 100), per, fit };
  }
  function bestRecipeForMeal(meal) {
    const names = meal.items.map((i) => ` ${norm(i.name)} `);
    let best = null, bestHits = 0;
    for (const r of RECIPES) {
      const hits = r.ingredients.filter((ing) => names.some((n) => ing.keys.some((k) => n.includes(` ${k}`)))).length;
      const nameHit = norm(meal.name).split(' ').some((w) => w.length > 3 && norm(r.name).includes(w)) ? 2 : 0;
      if (hits + nameHit > bestHits) { bestHits = hits + nameHit; best = r; }
    }
    return bestHits >= 2 ? best : null;
  }

  // ================= Sugestie =================
  let ideaType = 'all';
  $('#mealTypeChips').addEventListener('click', (e) => {
    const c = e.target.closest('[data-type]'); if (!c) return;
    ideaType = c.dataset.type;
    $$('.chip', $('#mealTypeChips')).forEach((x) => x.classList.toggle('active', x === c));
    renderIdeas();
  });
  function renderIdeas() {
    const urgent = state.products.filter((p) => daysLeft(p.expiry) <= 3).sort((a, b) => a.expiry.localeCompare(b.expiry));
    $('#rescueBox').innerHTML = urgent.length ? `
      <div class="card rescue">
        <h3>🚨 Uratuj przed zmarnowaniem</h3>
        <ul class="rescue-list">
          ${urgent.map((p) => { const i = expiryInfo(p.expiry); return `<li>
            <span>${esc(p.emoji || catOf(p).emoji)} <b>${esc(p.name)}</b> <span class="badge ${i.cls}">${i.text}</span>${p.unitPrice ? ` <span class="muted small">${zl(p.unitPrice * p.qty)}</span>` : ''}</span>
            <span class="muted small">${esc(RESCUE_TIPS[p.category] || RESCUE_TIPS.inne)}</span></li>`; }).join('')}
        </ul>
      </div>` : '';
    const byDiet = $('#ideaSort').value === 'diet' && diet;
    const matches = RECIPES.filter((r) => ideaType === 'all' || r.type.includes(ideaType)).map(matchRecipe)
      .sort((a, b) => byDiet ? (b.fit.score - a.fit.score) || (b.score - a.score) : b.score - a.score);
    $('#ideaList').innerHTML = matches.map((m) => {
      const r = m.recipe;
      const ready = m.have === m.need;
      return `
      <article class="idea ${ready ? 'ready' : ''}" data-recipe="${r.id}">
        <div class="idea-head">
          <span class="idea-emoji">${r.emoji}</span>
          <div><h3>${esc(r.name)}</h3><span class="muted small">⏱ ${r.time} min · ${r.type.join(', ')}</span></div>
        </div>
        <div class="match"><div class="match-bar"><span style="width:${m.pct}%"></span></div>
          <span class="small">${ready ? '✅ Masz wszystko!' : `Masz ${m.have} z ${m.need} składników`}</span></div>
        <div class="ing-chips">
          ${m.rows.map((x) => `<span class="ing ${x.product ? 'have' : x.ing.optional ? 'opt' : 'miss'}">${x.product ? '✓' : x.ing.optional ? '○' : '✗'} ${esc(x.ing.label)}</span>`).join('')}
        </div>
        ${m.rescued.length ? `<div class="rescues small">♻️ Wykorzysta: ${m.rescued.map((p) => esc(p.name)).join(', ')}</div>` : ''}
        <div class="idea-macros small">${macroLine(m.per)} <span class="muted">/ porcja</span></div>
        ${m.fit ? `<div>${fitBadge(m.fit)}</div>` : ''}
      </article>`;
    }).join('') || '<p class="muted">Brak przepisów dla tego rodzaju posiłku.</p>';
  }
  $('#ideaSort').addEventListener('change', () => {
    if ($('#ideaSort').value === 'diet' && !diet) { toast('Najpierw ustaw swoją dietę'); $('#ideaSort').value = 'fridge'; openDietDialog(); return; }
    renderIdeas();
  });
  $('#ideaList').addEventListener('click', (e) => {
    const card = e.target.closest('[data-recipe]');
    if (card) openRecipe(card.dataset.recipe);
  });

  const rDialog = $('#recipeDialog');
  let currentRecipe = null;
  function openRecipe(id) {
    const r = RECIPES.find((x) => x.id === id);
    const m = matchRecipe(r);
    currentRecipe = m;
    $('#recipeBody').innerHTML = `
      <h2>${r.emoji} ${esc(r.name)}</h2>
      <p class="muted">⏱ ${r.time} min · ${r.type.join(', ')}</p>
      <div class="macro-box">
        <div>${macroLine(m.per)} <span class="muted small">na porcję (szacunkowo)</span></div>
        ${m.fit ? `<div>${fitBadge(m.fit)}</div>${m.fit.issues.length ? `<ul class="fit-issues">${m.fit.issues.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}` : '<p class="muted small">Ustaw dietę w zakładce Posiłki, a ocenimy, czy to danie do niej pasuje.</p>'}
      </div>
      <h4>Składniki</h4>
      <ul class="recipe-ings">
        ${m.rows.map((x) => {
          const g = x.ing.g ? ` <span class="muted small">${x.ing.g} g/porcja</span>` : '';
          if (x.product) { const i = expiryInfo(x.product.expiry); return `<li class="have">✓ ${esc(x.ing.label)} — <i>${esc(x.product.name)}</i>${g} <span class="badge ${i.cls}">${i.text}</span></li>`; }
          return `<li class="${x.ing.optional ? 'opt' : 'miss'}">${x.ing.optional ? '○' : '✗'} ${esc(x.ing.label)}${g} ${x.ing.optional ? '<span class="muted small">(opcjonalnie)</span>' : '<span class="muted small">— do kupienia</span>'}</li>`;
        }).join('')}
      </ul>
      <h4>Przygotowanie</h4>
      <ol class="steps">${r.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      <h4>💡 Sugestie</h4>
      <ul class="tips">${r.tips.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`;
    $('#btnRecipeToMeal').disabled = !m.rows.some((x) => x.product);
    rDialog.showModal();
  }
  $('#btnCloseRecipe').addEventListener('click', () => rDialog.close());
  $('#btnRecipeToMeal').addEventListener('click', () => {
    const m = currentRecipe; if (!m) return;
    rDialog.close();
    const preset = {};
    m.rows.filter((x) => x.product).forEach((x) => {
      const p = x.product, g = (x.ing.g || 100) * 2;
      const nut = nutOf(p);
      const qty = p.unit === 'g' || p.unit === 'ml' ? g : p.unit === 'kg' || p.unit === 'l' ? g / 1000 : Math.max(1, Math.round(g / ((nut.unit) || 100)));
      preset[p.id] = round2(Math.min(p.qty, qty));
    });
    openMealDialog(null, { name: m.recipe.name, type: m.recipe.type[0], notes: m.recipe.steps.join('\n'), preset });
  });
  function defaultPortion(p) {
    const d = { szt: 2, g: 200, ml: 200, kg: 0.5, l: 0.5, opak: 1 }[p.unit] ?? 1;
    return Math.min(p.qty, d);
  }

  // ================= Posiłki =================
  const mDialog = $('#mealDialog');
  const mForm = $('#mealForm');

  function openMealDialog(meal = null, preset = null) {
    if (!state.products.length && !meal) { toast('Najpierw dodaj produkty do lodówki'); return showView('scan'); }
    mForm.reset();
    const src = meal || preset || {};
    $('#mealDialogTitle').textContent = meal ? 'Edytuj posiłek' : 'Nowy posiłek';
    mForm.name.value = src.name || '';
    mForm.type.value = src.type || 'obiad';
    mForm.servings.value = src.servings || 2;
    mForm.notes.value = src.notes || '';
    mForm.id.value = meal ? meal.id : '';
    const chosen = {};
    if (meal) meal.items.forEach((i) => { chosen[i.productId] = i.qty; });
    if (preset && preset.preset) Object.assign(chosen, preset.preset);
    const prods = [...state.products].sort((a, b) => a.expiry.localeCompare(b.expiry));
    $('#ingredientPicker').innerHTML = prods.map((p) => {
      const i = expiryInfo(p.expiry);
      const on = p.id in chosen;
      return `<label class="pick ${on ? 'on' : ''}">
        <input type="checkbox" data-pid="${p.id}" ${on ? 'checked' : ''}>
        <span class="pick-name">${esc(p.emoji || catOf(p).emoji)} ${esc(p.name)} <span class="badge ${i.cls}">${i.text}</span></span>
        <span class="pick-qty"><input type="number" min="0" step="any" max="${p.qty}" value="${on ? chosen[p.id] : defaultPortion(p)}" data-qty="${p.id}" aria-label="Ilość">
          <span class="muted small">/ ${fmtNum(p.qty)} ${esc(p.unit)}</span></span>
      </label>`;
    }).join('') || '<p class="muted">Lodówka jest pusta.</p>';
    updateMealPreview();
    mDialog.showModal();
  }
  $('#ingredientPicker').addEventListener('change', (e) => {
    if (e.target.matches('[type=checkbox]')) e.target.closest('.pick').classList.toggle('on', e.target.checked);
    if (e.target.matches('[data-qty]')) {
      const pick = e.target.closest('.pick');
      pick.querySelector('[type=checkbox]').checked = true; pick.classList.add('on');
    }
  });
  mForm.addEventListener('submit', (e) => {
    if (e.submitter && e.submitter.value === 'cancel') return;
    e.preventDefault();
    const items = $$('#ingredientPicker [type=checkbox]:checked').map((cb) => {
      const p = productById(cb.dataset.pid);
      const qty = parseFloat($(`[data-qty="${cb.dataset.pid}"]`, mForm).value) || 0;
      const nut = nutOf(p);
      return { productId: p.id, name: p.name, emoji: p.emoji || catOf(p).emoji, qty, unit: p.unit, unitPrice: p.unitPrice || 0, category: p.category, nut: { kcal: nut.kcal, p: nut.p, f: nut.f, c: nut.c, unit: nut.unit } };
    });
    if (!items.length) { toast('Wybierz przynajmniej jeden składnik'); return; }
    const data = { name: mForm.name.value.trim(), type: mForm.type.value, servings: parseInt(mForm.servings.value, 10) || 1, notes: mForm.notes.value.trim(), items };
    const old = mForm.id.value && state.meals.find((m) => m.id === mForm.id.value);
    const ok = old ? put('meals', { ...old, ...data }) : put('meals', { id: uid(), createdAt: Date.now(), cooked: 0, by: sync.myId, ...data });
    mDialog.close();
    if (ok) toast('Zapisano posiłek');
    showView('meals');
  });

  function mealMacros(items, servings) {
    let tot = ZERO; const cats = [];
    items.forEach((it) => {
      const p = productById(it.productId);
      const cat = it.category || (p && p.category) || guessCategoryFromName(it.name);
      const nut = it.nut || (p && nutOf(p)) || lookupNut(it.name, cat);
      tot = addM(tot, macrosFor(it.qty, it.unit, nut));
      cats.push({ cat, name: it.name });
    });
    return { total: tot, per: divM(tot, Math.max(1, servings || 1)), cats };
  }
  function updateMealPreview() {
    const items = $$('#ingredientPicker [type=checkbox]:checked').map((cb) => {
      const p = productById(cb.dataset.pid);
      return { productId: p.id, name: p.name, qty: parseFloat($(`[data-qty="${cb.dataset.pid}"]`, mForm).value) || 0, unit: p.unit, category: p.category };
    });
    const box = $('#mealMacroPreview');
    if (!items.length) { box.innerHTML = ''; return; }
    const mm = mealMacros(items, parseInt(mForm.servings.value, 10) || 1);
    const fit = dietFit(mm.per, mForm.type.value, mm.cats);
    box.innerHTML = `<div>Na porcję: ${macroLine(mm.per)}</div>${fit ? `<div class="row">${fitBadge(fit)}</div>${fit.issues.length ? `<ul class="fit-issues">${fit.issues.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}` : ''}`;
  }
  ['input', 'change'].forEach((ev) => mForm.addEventListener(ev, (e) => { if (!e.target.matches('[name=name],[name=notes]')) updateMealPreview(); }));

  function mealStatus(meal) {
    let earliest = null, missing = 0, cost = 0;
    const rows = meal.items.map((it) => {
      const p = productById(it.productId);
      const ok = p && p.qty >= it.qty;
      if (!ok) missing++;
      if (p && (!earliest || p.expiry < earliest)) earliest = p.expiry;
      cost += (p ? p.unitPrice || 0 : it.unitPrice || 0) * it.qty;
      return { it, p, ok };
    });
    return { rows, earliest, missing, cost: round2(cost) };
  }
  function mealSuggestions(meal, st) {
    const out = [];
    if (st.earliest) {
      const d = daysLeft(st.earliest);
      if (d < 0) out.push('⚠️ Część składników jest po terminie — sprawdź je przed gotowaniem.');
      else if (d <= 1) out.push('⏰ Ugotuj to danie dziś — składniki zaraz stracą świeżość.');
      else if (d <= 3) out.push(`📅 Najlepiej przygotuj w ciągu ${plDays(d)}.`);
    }
    if (st.missing) out.push(`🛒 Brakuje lub za mało: ${st.rows.filter((r) => !r.ok).map((r) => r.it.name).join(', ')}.`);
    const eatOut = meal.servings * (state.settings.eatOutPrice || 0);
    if (st.cost > 0 && eatOut > st.cost) out.push(`💰 Koszt ok. ${zl(st.cost)} (${zl(st.cost / meal.servings)}/porcja) — na mieście zapłaciłbyś ok. ${zl0(eatOut)}.`);
    const r = bestRecipeForMeal(meal);
    if (r) {
      out.push(...r.tips.map((t) => '💡 ' + t));
      const missingIngs = r.ingredients.filter((ing) => !meal.items.some((i) => ing.keys.some((k) => ` ${norm(i.name)} `.includes(` ${k}`))));
      const inFridge = missingIngs.map((ing) => productsMatching(ing)[0]).filter(Boolean);
      if (inFridge.length) out.push(`➕ Możesz dodać z lodówki: ${inFridge.map((p) => p.name).join(', ')}.`);
    }
    if (st.rows.some((x) => x.p && x.p.category === 'mieso')) out.push('🍗 Mięso przechowuj w najzimniejszej części lodówki, a resztki zjedz w ciągu 2 dni.');
    if (meal.servings > 2) out.push(`🥡 ${meal.servings} porcje — nadmiar zapakuj do pojemnika i zamroź.`);
    if (!out.length) out.push('👍 Wszystko gotowe — smacznego!');
    return { tips: out, recipe: r };
  }
  function renderDietPanel() {
    const el = $('#dietPanel');
    if (!diet) {
      el.innerHTML = `<div class="card diet-cta">
        <div><h3>🥗 Dopasuj posiłki do swojej diety</h3>
        <p class="muted small">Podaj wagę, wzrost i cel — policzymy Twoje kalorie i makro, a przy każdym daniu pokażemy, czy pasuje do diety.</p></div>
        <button class="btn primary" data-diet-edit>Ustaw dietę</button></div>`;
      return;
    }
    const eaten = eatenToday();
    const rem = { kcal: diet.kcal - eaten.kcal, p: diet.p - eaten.p, f: diet.f - eaten.f, c: diet.c - eaten.c };
    const bar = (label, v, t, unit) => {
      const pct = t ? Math.min(100, (v / t) * 100) : 0;
      const over = v > t * 1.05;
      return `<div class="dbar ${over ? 'over' : ''}"><div class="bar-label"><span>${label}</span><b>${r0(v)} / ${r0(t)} ${unit}</b></div><div class="bar"><span style="width:${pct}%"></span></div>
        <span class="muted small">${over ? `ponad cel o ${r0(v - t)} ${unit}` : `zostało ${r0(t - v)} ${unit}`}</span></div>`;
    };
    const entries = diary.date === todayISO() ? diary.entries : [];
    // propozycje na resztę dnia
    const picks = RECIPES.map(matchRecipe)
      .filter((m) => m.pct >= 50 && m.fit && m.fit.score >= 60 && m.per.kcal <= Math.max(150, rem.kcal) * 1.1)
      .sort((a, b) => (b.pct - a.pct) || (b.fit.score - a.fit.score)).slice(0, 3);
    el.innerHTML = `<div class="card diet-panel">
      <div class="card-head"><h3>🥗 Dziś · ${esc(DIET_TYPES[diet.type]?.label || 'dieta')}</h3><button class="btn small" data-diet-edit>Edytuj dietę</button></div>
      <div class="dbars">
        ${bar('🔥 Kalorie', eaten.kcal, diet.kcal, 'kcal')}
        ${bar('Białko', eaten.p, diet.p, 'g')}
        ${bar('Tłuszcz', eaten.f, diet.f, 'g')}
        ${bar('Węglowodany', eaten.c, diet.c, 'g')}
      </div>
      ${entries.length ? `<ul class="diary">${entries.map((e) => `<li><span>${esc(e.name)} <span class="muted small">${r0(e.kcal)} kcal · B ${r0(e.p)} g</span></span><button class="icon-btn" data-del-entry="${e.id}" aria-label="Usuń z dziennika">×</button></li>`).join('')}</ul>`
        : '<p class="muted small">Nic jeszcze dziś nie zapisano. Kliknij „🍴 Zjadłem porcję” albo „Ugotowane” przy posiłku.</p>'}
      ${rem.kcal > 100 ? `<div class="picks"><span class="small"><b>Pasuje na resztę dnia</b> (zostało ${r0(rem.kcal)} kcal, ${r0(Math.max(0, rem.p))} g białka):</span>
        ${picks.length ? picks.map((m) => `<button class="chip" data-recipe="${m.recipe.id}">${m.recipe.emoji} ${esc(m.recipe.name)} · ${r0(m.per.kcal)} kcal</button>`).join('') : '<span class="muted small">brak przepisów z tego, co masz — dokup składniki z sugestii.</span>'}</div>` : ''}
    </div>`;
  }
  $('#dietPanel').addEventListener('click', (e) => {
    if (e.target.closest('[data-diet-edit]')) return openDietDialog();
    const del = e.target.closest('[data-del-entry]');
    if (del) { diary.entries = diary.entries.filter((x) => x.id !== del.dataset.delEntry); saveDiary(); render(); return; }
    const r = e.target.closest('[data-recipe]');
    if (r) openRecipe(r.dataset.recipe);
  });

  // ---------- Dialog diety ----------
  const dtDialog = $('#dietDialog'), dtForm = $('#dietForm');
  $('#dietType').innerHTML = Object.entries(DIET_TYPES).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('');
  function readDietForm() {
    return { sex: dtForm.sex.value, age: +dtForm.age.value || 30, height: +dtForm.height.value || 170, weight: +dtForm.weight.value || 70, activity: +dtForm.activity.value || 1.375, goal: dtForm.goal.value, type: dtForm.type.value };
  }
  function fillTargets() {
    const t = calcTargets(readDietForm());
    dtForm.kcal.value = t.kcal; dtForm.p.value = t.p; dtForm.f.value = t.f; dtForm.c.value = t.c;
    $('#dietCalcNote').textContent = `Przemiana podstawowa ok. ${t.bmr} kcal, z aktywnością ok. ${t.tdee} kcal. Cele możesz zmienić ręcznie.`;
  }
  function openDietDialog() {
    dtForm.reset();
    const d = diet || {};
    ['sex', 'age', 'height', 'weight', 'activity', 'goal', 'type'].forEach((k) => { if (d[k] != null) dtForm[k].value = d[k]; });
    if (diet) { dtForm.kcal.value = d.kcal; dtForm.p.value = d.p; dtForm.f.value = d.f; dtForm.c.value = d.c; $('#dietCalcNote').textContent = ''; }
    else fillTargets();
    dtDialog.showModal();
  }
  $('#btnCalcDiet').addEventListener('click', fillTargets);
  ['sex', 'age', 'height', 'weight', 'activity', 'goal', 'type'].forEach((k) => dtForm[k].addEventListener('change', fillTargets));
  dtForm.addEventListener('submit', (e) => {
    if (e.submitter && e.submitter.value === 'cancel') return;
    e.preventDefault();
    saveDiet({ ...readDietForm(), kcal: +dtForm.kcal.value, p: +dtForm.p.value, f: +dtForm.f.value, c: +dtForm.c.value });
    dtDialog.close(); render(); toast('Zapisano dietę — posiłki są teraz oceniane pod Twoje cele');
  });

  function renderMeals() {
    renderDietPanel();
    $('#mealsEmpty').hidden = state.meals.length > 0;
    const meals = [...state.meals].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    $('#mealList').innerHTML = meals.map((meal) => {
      const st = mealStatus(meal);
      const sug = mealSuggestions(meal, st);
      const mm = mealMacros(meal.items, meal.servings);
      const fit = dietFit(mm.per, meal.type, mm.cats);
      const ei = st.earliest ? expiryInfo(st.earliest) : null;
      return `
      <article class="meal" data-meal="${meal.id}">
        <div class="meal-head">
          <div>
            <span class="tag">${esc(meal.type)}</span>
            <h3>${esc(meal.name)}</h3>
            <span class="muted small">${meal.servings} porcje · ${meal.items.length} składników${st.cost ? ` · ${zl(st.cost)}` : ''}${meal.cooked ? ` · ugotowano ${meal.cooked}×` : ''}</span>
          </div>
          ${ei ? `<div class="eat-by ${ei.cls}"><span class="small">Zjedz do</span><b>${fmtDate(st.earliest)}</b></div>` : ''}
        </div>
        <div class="meal-macros">${macroLine(mm.per)} <span class="muted small">/ porcja</span> ${fitBadge(fit)}</div>
        ${fit && fit.issues.length ? `<ul class="fit-issues">${fit.issues.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}
        <ul class="meal-ings">
          ${st.rows.map(({ it, p, ok }) => `<li class="${ok ? '' : 'missing'}">
            <span>${esc(it.emoji)} ${esc(it.name)}</span>
            <span class="muted small">${fmtNum(it.qty)} ${esc(it.unit)}${p ? ` · <span class="badge ${expiryInfo(p.expiry).cls}">${expiryInfo(p.expiry).text}</span>` : ' · brak w lodówce'}</span>
          </li>`).join('')}
        </ul>
        <div class="suggest">
          <h4>Sugestie do tego dania</h4>
          <ul>${sug.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          ${sug.recipe ? `<button class="link" data-open-recipe="${sug.recipe.id}">📖 Zobacz pełny przepis: ${esc(sug.recipe.name)}</button>` : ''}
        </div>
        ${meal.notes ? `<details><summary>Notatki</summary><p class="notes">${esc(meal.notes).replace(/\n/g, '<br>')}</p></details>` : ''}
        <div class="row">
          <button class="btn primary" data-cook="${meal.id}" ${st.missing === st.rows.length ? 'disabled' : ''}>✓ Ugotowane</button>
          <button class="btn" data-eat-meal="${meal.id}" title="Zapisz 1 porcję w dzienniku diety (bez zużywania produktów)">🍴 Zjadłem porcję</button>
          <button class="btn" data-edit-meal="${meal.id}">Edytuj</button>
          <span class="spacer"></span>
          <button class="btn danger ghost" data-del-meal="${meal.id}">Usuń</button>
        </div>
      </article>`;
    }).join('');
  }
  $('#mealList').addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.openRecipe) return openRecipe(b.dataset.openRecipe);
    const meal = state.meals.find((m) => m.id === (b.dataset.cook || b.dataset.editMeal || b.dataset.delMeal || b.dataset.eatMeal));
    if (!meal) return;
    if (b.dataset.eatMeal) {
      logEaten(meal.name, mealMacros(meal.items, meal.servings).per);
      render(); toast(`Zapisano porcję: ${meal.name}`);
      return;
    }
    if (b.dataset.editMeal) openMealDialog(meal);
    if (b.dataset.delMeal && await askConfirm(`Usunąć posiłek „${meal.name}”?`)) {
      del('meals', meal.id); render(); toast('Usunięto posiłek');
    }
    if (b.dataset.cook) cookMeal(meal);
  });
  function cookMeal(meal) {
    if (sync.readOnly) return toast('Masz tylko podgląd — nie możesz zmieniać tej lodówki.');
    if (diet) logEaten(meal.name, mealMacros(meal.items, meal.servings).per);
    let cost = 0, rescuedValue = 0;
    const gone = [];
    meal.items.forEach((it) => {
      const p = productById(it.productId); if (!p) return;
      const amount = Math.min(p.qty, it.qty);
      const value = (p.unitPrice || 0) * amount;
      cost += value;
      const d = daysLeft(p.expiry);
      if (d >= 0 && d <= 2) rescuedValue += value;
      const left = round2(p.qty - amount);
      if (left <= 0) { del('products', p.id); gone.push(p.name); } else put('products', { ...p, qty: left });
    });
    const eatOut = meal.servings * (state.settings.eatOutPrice || 0);
    logEvent({ type: 'cooked', name: meal.name, servings: meal.servings, cost: round2(cost), eatOut, saved: round2(Math.max(0, eatOut - cost)), rescuedValue: round2(rescuedValue) });
    put('meals', { ...meal, cooked: (meal.cooked || 0) + 1 });
    render();
    const saved = Math.max(0, eatOut - cost);
    toast(`Smacznego!${diet ? ' Twoja porcja jest w dzienniku diety.' : ''}${saved ? ` Zaoszczędzono ok. ${zl0(saved)} względem jedzenia na mieście.` : ''}${gone.length ? ` Skończyło się: ${gone.join(', ')}.` : ''}`);
  }
  $('#btnNewMeal').addEventListener('click', () => openMealDialog());
  $('#btnNewMeal2').addEventListener('click', () => openMealDialog());

  // ================= Budżet =================
  let period = 'month';
  $('#periodChips').addEventListener('click', (e) => {
    const c = e.target.closest('[data-period]'); if (!c) return;
    period = c.dataset.period;
    $$('.chip', $('#periodChips')).forEach((x) => x.classList.toggle('active', x === c));
    renderBudget();
  });
  function periodRange(pr) {
    const now = new Date();
    if (pr === 'all') return [0, Infinity];
    const start = new Date(now.getFullYear(), now.getMonth() + (pr === 'prev' ? -1 : 0), 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    return [start.getTime(), end.getTime()];
  }
  const receiptTs = (r) => new Date((r.date || todayISO()) + 'T12:00:00').getTime();
  const receiptTotal = (r) => round2((r.items || []).reduce((s, i) => s + (Number(i.price) || 0), 0));
  const itemKey = (name) => norm(name).replace(/\b\d+([.,]\d+)?\s*(g|kg|ml|l|szt|%)?\b/g, '').split(' ').filter((w) => w.length > 2).slice(0, 2).join(' ');

  function computeBudget(pr) {
    const [a, b] = periodRange(pr);
    const inP = (ts) => ts >= a && ts < b;
    const receipts = state.receipts.filter((r) => inP(receiptTs(r)));
    const events = state.events.filter((e) => inP(e.at));
    const spent = receipts.reduce((s, r) => s + receiptTotal(r), 0);
    const cooked = events.filter((e) => e.type === 'cooked');
    const savedCooking = cooked.reduce((s, e) => s + (e.saved || 0), 0);
    const savedRescue = events.filter((e) => e.type === 'used' && e.rescued).reduce((s, e) => s + (e.value || 0), 0)
      + cooked.reduce((s, e) => s + (e.rescuedValue || 0), 0);
    const wastedEvents = events.filter((e) => e.type === 'wasted');
    const wasted = wastedEvents.reduce((s, e) => s + (e.value || 0), 0);

    // Porównanie cen między sklepami (ze wszystkich paragonów)
    const groups = {};
    state.receipts.forEach((r) => (r.items || []).forEach((it) => {
      const qty = Number(it.qty) || 1, price = Number(it.price) || 0;
      if (!price) return;
      const key = itemKey(it.name); if (!key) return;
      const g = groups[key] || (groups[key] = { name: it.name, stores: {} });
      const up = price / qty;
      const st = g.stores[r.store] || (g.stores[r.store] = { min: Infinity, unit: it.unit || 'szt' });
      st.min = Math.min(st.min, up);
    }));
    const compare = Object.values(groups).map((g) => {
      const entries = Object.entries(g.stores);
      if (entries.length < 2) return null;
      entries.sort((x, y) => x[1].min - y[1].min);
      const [cheapStore, cheap] = entries[0], [dearStore, dear] = entries[entries.length - 1];
      return { name: g.name, cheapStore, cheap: cheap.min, dearStore, dear: dear.min, unit: cheap.unit, diff: dear.min - cheap.min, pct: (dear.min - cheap.min) / dear.min };
    }).filter(Boolean).sort((x, y) => y.pct - x.pct);
    // Potencjalna oszczędność: gdyby każdą pozycję z okresu kupić w najtańszym znanym sklepie
    let potential = 0;
    receipts.forEach((r) => (r.items || []).forEach((it) => {
      const g = groups[itemKey(it.name)]; if (!g) return;
      const qty = Number(it.qty) || 1;
      const min = Math.min(...Object.values(g.stores).map((s) => s.min));
      potential += Math.max(0, (Number(it.price) || 0) - min * qty);
    }));

    const byStore = {};
    receipts.forEach((r) => {
      const s = byStore[r.store] || (byStore[r.store] = { total: 0, count: 0 });
      s.total += receiptTotal(r); s.count++;
    });
    const byCat = {};
    receipts.forEach((r) => (r.items || []).forEach((it) => {
      const c = CATEGORIES[it.category] ? it.category : 'inne';
      byCat[c] = (byCat[c] || 0) + (Number(it.price) || 0);
    }));
    const wasteByCat = {};
    wastedEvents.forEach((e) => { wasteByCat[e.category || 'inne'] = (wasteByCat[e.category || 'inne'] || 0) + (e.value || 0); });

    return {
      receipts, events, spent: round2(spent), savedCooking: round2(savedCooking), savedRescue: round2(savedRescue),
      wasted: round2(wasted), net: round2(savedCooking + savedRescue - wasted), cookedCount: cooked.length,
      servings: cooked.reduce((s, e) => s + (e.servings || 0), 0),
      costPerServing: cooked.length ? cooked.reduce((s, e) => s + (e.cost || 0), 0) / Math.max(1, cooked.reduce((s, e) => s + (e.servings || 0), 0)) : 0,
      compare, potential: round2(potential), byStore, byCat, wasteByCat,
    };
  }

  const allocated = () => state.goals.reduce((s, g) => s + (g.saved || 0), 0);
  const availableSavings = () => Math.max(0, round2(computeBudget('all').net - allocated()));

  function bars(entries, fmt = zl, cls = '') {
    if (!entries.length) return '<p class="muted small">Brak danych w tym okresie.</p>';
    const max = Math.max(...entries.map((e) => e.value), 1);
    return `<ul class="bars ${cls}">${entries.map((e) => `
      <li><div class="bar-label"><span>${e.label}</span><b>${fmt(e.value)}</b></div>
      <div class="bar"><span style="width:${Math.max(3, (e.value / max) * 100)}%"></span></div>
      ${e.sub ? `<span class="muted small">${e.sub}</span>` : ''}</li>`).join('')}</ul>`;
  }

  function renderBudget() {
    const B = computeBudget(period);
    const periodName = { month: 'w tym miesiącu', prev: 'w poprzednim miesiącu', all: 'od początku' }[period];
    $('#budgetEmpty').hidden = B.receipts.length > 0 || B.events.length > 0;
    $('#kpis').innerHTML = `
      <div class="kpi"><span class="kpi-label">Wydatki</span><b>${zl(B.spent)}</b><span class="muted small">${B.receipts.length} paragonów ${periodName}</span></div>
      <div class="kpi good"><span class="kpi-label">Zaoszczędzone</span><b>${zl(B.savedCooking + B.savedRescue)}</b><span class="muted small">gotowanie w domu + uratowane jedzenie</span></div>
      <div class="kpi bad"><span class="kpi-label">Zmarnowane</span><b>${zl(B.wasted)}</b><span class="muted small">wyrzucone produkty</span></div>
      <div class="kpi ${B.net >= 0 ? 'good' : 'bad'} accent-kpi"><span class="kpi-label">Bilans</span><b>${B.net >= 0 ? '+' : ''}${zl(B.net)}</b><span class="muted small">oszczędności minus straty</span></div>`;

    $('#savingsBreakdown').innerHTML = bars([
      { label: '🍳 Gotowanie zamiast jedzenia na mieście', value: B.savedCooking, sub: B.cookedCount ? `${B.cookedCount} posiłków, ${B.servings} porcji · średnio ${zl(B.costPerServing)}/porcja` : 'Oznaczaj posiłki jako „Ugotowane”.' },
      { label: '♻️ Uratowane przed zepsuciem', value: B.savedRescue, sub: 'Produkty zjedzone w ostatnich 2 dniach ważności.' },
      { label: '🗑 Strata na zmarnowanym', value: B.wasted, sub: Object.keys(B.wasteByCat).length ? 'Najwięcej: ' + Object.entries(B.wasteByCat).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([c, v]) => `${CATEGORIES[c]?.label || c} (${zl(v)})`).join(', ') : 'Brawo — nic nie wyrzucono.' },
    ], zl, 'savings');

    $('#storeBars').innerHTML = bars(Object.entries(B.byStore).sort((a, b) => b[1].total - a[1].total).map(([s, v]) => ({
      label: `🏪 ${esc(s)}`, value: v.total, sub: `${v.count} × zakupy · średni koszyk ${zl(v.total / v.count)}`,
    })));

    $('#priceCompare').innerHTML = B.compare.length ? `
      ${B.potential > 0 ? `<p class="potential">Kupując w najtańszym sklepie, ${periodName} zaoszczędziłbyś <b>${zl(B.potential)}</b>.</p>` : ''}
      <ul class="compare">${B.compare.slice(0, 8).map((c) => `
        <li><span class="cmp-name">${esc(c.name)}</span>
          <span class="cmp-stores"><span class="badge ok">${esc(c.cheapStore)} ${zl(c.cheap)}</span> <span class="muted small">vs</span> <span class="badge expired">${esc(c.dearStore)} ${zl(c.dear)}</span></span>
          <span class="muted small">taniej o ${Math.round(c.pct * 100)}% (za ${esc(c.unit)})</span></li>`).join('')}</ul>`
      : '<p class="muted small">Dodaj paragony z co najmniej dwóch sklepów, w których kupujesz te same produkty — pokażemy, gdzie jest taniej.</p>';

    $('#catBars').innerHTML = bars(Object.entries(B.byCat).sort((a, b) => b[1] - a[1]).map(([c, v]) => ({ label: `${CATEGORIES[c].emoji} ${CATEGORIES[c].label}`, value: v })));

    renderGoals();
    renderHistory();
    const inp = $('#eatOutPrice');
    if (document.activeElement !== inp) inp.value = state.settings.eatOutPrice ?? 30;
  }

  function renderGoals() {
    const avail = availableSavings();
    $('#availableLine').innerHTML = `Do rozdysponowania: <b>${zl(avail)}</b> <span class="muted small">(bilans od początku minus to, co już odłożono na cele)</span>`;
    $('#goalList').innerHTML = state.goals.length ? state.goals.map((g) => {
      const pct = Math.min(100, ((g.saved || 0) / g.target) * 100);
      return `<button class="goal" data-goal="${g.id}">
        <span class="goal-emoji">${esc(g.emoji || '🎯')}</span>
        <span class="goal-main"><span class="goal-top"><b>${esc(g.name)}</b><span class="small">${zl0(g.saved || 0)} / ${zl0(g.target)}</span></span>
        <span class="bar"><span style="width:${pct}%"></span></span>
        <span class="muted small">${pct >= 100 ? '🎉 Cel osiągnięty!' : `Brakuje ${zl0(g.target - (g.saved || 0))} · kliknij, aby odłożyć`}</span></span>
      </button>`;
    }).join('') : '<p class="muted small">Nie masz jeszcze celów. Dodaj np. wakacje albo poduszkę finansową — zaoszczędzone pieniądze z lodówki trafią tam, gdzie chcesz.</p>';

    // Pomysły na wykorzystanie pieniędzy (reguły)
    const all = computeBudget('all');
    const month = computeBudget('month');
    const ideas = [];
    const perServing = all.costPerServing || 7;
    const firstTs = Math.min(...state.events.map((e) => e.at), ...state.receipts.map(receiptTs), Date.now());
    const months = Math.max(1, (Date.now() - firstTs) / (30 * 86400000));
    const monthly = all.net / months;
    if (avail >= 5) ideas.push(`🍲 ${zl0(avail)} to ok. ${Math.floor(avail / perServing)} porcji domowych obiadów — możesz zrobić większe zakupy na kilka dni i jeszcze bardziej obniżyć koszt porcji.`);
    if (monthly > 0) ideas.push(`📈 W tym tempie oszczędzasz ok. ${zl0(monthly)} miesięcznie — to ok. ${zl0(monthly * 12)} rocznie. Ustaw stały przelew na konto oszczędnościowe w dniu wypłaty.`);
    if (all.compare.length) {
      const top = all.compare[0];
      ideas.push(`🏪 ${top.name} kupuj w ${top.cheapStore} — jest tam o ${Math.round(top.pct * 100)}% taniej niż w ${top.dearStore}.`);
    }
    if (all.potential > 0) ideas.push(`🛒 Zakupy w najtańszych sklepach dałyby dodatkowe ${zl(all.potential)}. Zrób listę i kupuj produkty suche hurtem tam, gdzie są najtańsze.`);
    const topWaste = Object.entries(all.wasteByCat).sort((a, b) => b[1] - a[1])[0];
    if (topWaste) ideas.push(`🗑 Najwięcej marnujesz w kategorii ${CATEGORIES[topWaste[0]]?.label || topWaste[0]} (${zl(topWaste[1])}). Kupuj mniejsze opakowania albo zamrażaj nadmiar.`);
    if (month.savedCooking > 50) ideas.push(`🍽️ W tym miesiącu gotowanie w domu dało ${zl0(month.savedCooking)} — część możesz przeznaczyć na wspólną kolację na mieście bez wyrzutów sumienia.`);
    if (avail >= 100 && !state.goals.some((g) => /poduszk/i.test(g.name))) ideas.push('🛟 Masz już ponad 100 zł — dobry moment, żeby założyć cel „Poduszka finansowa” (zalecane 3–6 miesięcznych wydatków).');
    if (!ideas.length) ideas.push('💡 Dodawaj paragony i oznaczaj posiłki jako „Ugotowane” — wtedy podpowiemy, ile i na co możesz odłożyć.');
    $('#moneyIdeas').innerHTML = ideas.map((i) => `<li>${esc(i)}</li>`).join('');
  }

  function renderHistory() {
    const items = [
      ...state.receipts.map((r) => ({ ts: receiptTs(r), html: `<button class="hist-row" data-receipt="${r.id}"><span>🧾 <b>${esc(r.store)}</b> <span class="muted small">${(r.items || []).length} poz.</span></span><span class="neg">−${zl(receiptTotal(r))}</span></button>`, by: r.by })),
      ...state.events.map((e) => {
        if (e.type === 'cooked') return { ts: e.at, html: `<div class="hist-row"><span>🍳 ${esc(e.name)} <span class="muted small">${e.servings} porcje</span></span><span class="pos">+${zl(e.saved || 0)}</span></div>`, by: e.by };
        if (e.type === 'wasted') return { ts: e.at, html: `<div class="hist-row"><span>🗑 ${esc(e.name)} <span class="muted small">zmarnowane</span></span><span class="neg">−${zl(e.value || 0)}</span></div>`, by: e.by };
        if (e.rescued) return { ts: e.at, html: `<div class="hist-row"><span>♻️ ${esc(e.name)} <span class="muted small">uratowane</span></span><span class="pos">+${zl(e.value || 0)}</span></div>`, by: e.by };
        return null;
      }).filter(Boolean),
    ].sort((a, b) => b.ts - a.ts).slice(0, 20);
    const shared = sync.mode === 'shared';
    $('#history').innerHTML = items.length ? items.map((i) => `<li><span class="hist-date muted small">${fmtDateShort(i.ts)}${shared && i.by ? ` · <span data-uid="${esc(i.by)}">…</span>` : ''}</span>${i.html}</li>`).join('') : '<li class="muted small">Tu pojawią się paragony, ugotowane posiłki i zmarnowane produkty.</li>';
  }
  $('#history').addEventListener('click', (e) => {
    const b = e.target.closest('[data-receipt]');
    if (b) openReceiptDialog(state.receipts.find((r) => r.id === b.dataset.receipt));
  });
  $('#eatOutPrice').addEventListener('change', (e) => {
    const v = Math.max(0, parseFloat(e.target.value) || 0);
    putSettings({ eatOutPrice: v }); render(); toast('Zapisano cenę obiadu na mieście');
  });

  // ---------- Paragony ----------
  const recDialog = $('#receiptDialog');
  const recForm = $('#receiptForm');
  const catOptions = (sel) => Object.entries(CATEGORIES).map(([k, c]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${c.emoji} ${c.label}</option>`).join('');

  function itemRow(it = {}, editing = false) {
    const cat = it.category && CATEGORIES[it.category] ? it.category : guessCategoryFromName(it.name || '');
    const food = it.food !== false;
    return `<div class="rec-item" ${it.nut ? `data-nut="${esc(JSON.stringify(it.nut))}"` : ''}>
      <input class="ri-name" placeholder="Nazwa produktu" value="${esc(it.name || '')}" aria-label="Nazwa" required>
      <span class="ri-qty"><input type="number" min="0" step="any" value="${it.qty ?? 1}" aria-label="Ilość"><select aria-label="Jednostka">${['szt', 'g', 'kg', 'ml', 'l', 'opak'].map((u) => `<option ${u === (it.unit || 'szt') ? 'selected' : ''}>${u}</option>`).join('')}</select></span>
      <input class="ri-price" type="number" min="0" step="0.01" placeholder="0,00" value="${it.price ?? ''}" aria-label="Cena">
      <select class="ri-cat" aria-label="Kategoria">${catOptions(cat)}</select>
      <label class="ri-fridge" title="Dodaj do lodówki"><input type="checkbox" ${food && !editing ? 'checked' : ''} ${editing ? 'disabled' : ''}></label>
      <button type="button" class="icon-btn ri-del" aria-label="Usuń pozycję">×</button>
    </div>`;
  }
  function updateReceiptTotal() {
    const sum = $$('.ri-price', recForm).reduce((s, i) => s + (parseFloat(i.value) || 0), 0);
    $('#receiptTotal').textContent = zl(sum);
  }
  function openReceiptDialog(rec = null, parsed = null) {
    recForm.reset();
    fillStoreList();
    const src = rec || parsed || {};
    const editing = !!rec;
    $('#receiptTitle').textContent = editing ? 'Paragon' : 'Nowy paragon';
    recForm.store.value = src.store || '';
    recForm.date.value = src.date && /^\d{4}-\d{2}-\d{2}$/.test(src.date) ? src.date : todayISO();
    recForm.id.value = editing ? rec.id : '';
    const items = src.items && src.items.length ? src.items : [{}, {}];
    $('#receiptItems').innerHTML = items.map((it) => itemRow(it, editing)).join('');
    $('#btnDeleteReceipt').hidden = !editing;
    $('#receiptFridgeHint').hidden = editing;
    const st = $('#receiptStatus');
    st.hidden = !parsed;
    if (parsed) st.innerHTML = `✨ Claude odczytał ${items.length} pozycji z paragonu. Sprawdź nazwy i ceny przed zapisaniem.`;
    updateReceiptTotal();
    recDialog.showModal();
  }
  $('#btnAddItem').addEventListener('click', () => {
    $('#receiptItems').insertAdjacentHTML('beforeend', itemRow({}, !!recForm.id.value));
    $('#receiptItems .rec-item:last-child .ri-name').focus();
  });
  $('#receiptItems').addEventListener('click', (e) => {
    if (e.target.closest('.ri-del')) { e.target.closest('.rec-item').remove(); updateReceiptTotal(); }
  });
  $('#receiptItems').addEventListener('input', (e) => { if (e.target.matches('.ri-price')) updateReceiptTotal(); });
  $('#receiptItems').addEventListener('change', (e) => {
    if (e.target.matches('.ri-name')) {
      const row = e.target.closest('.rec-item');
      const sel = $('.ri-cat', row);
      if (sel.value === 'inne') sel.value = guessCategoryFromName(e.target.value);
    }
  });
  recForm.addEventListener('submit', (e) => {
    if (e.submitter && e.submitter.value === 'cancel') return;
    e.preventDefault();
    const rows = $$('.rec-item', recForm).map((row) => {
      const [qtyEl, unitEl] = [$('.ri-qty input', row), $('.ri-qty select', row)];
      return {
        name: $('.ri-name', row).value.trim(), qty: parseFloat(qtyEl.value) || 1, unit: unitEl.value,
        price: round2(parseFloat($('.ri-price', row).value) || 0), category: $('.ri-cat', row).value,
        toFridge: $('.ri-fridge input', row).checked,
        nut: row.dataset.nut ? JSON.parse(row.dataset.nut) : null,
      };
    }).filter((r) => r.name);
    if (!rows.length) { toast('Dodaj przynajmniej jedną pozycję'); return; }
    const store = recForm.store.value.trim();
    const old = recForm.id.value && state.receipts.find((r) => r.id === recForm.id.value);
    const items = rows.map(({ toFridge, nut, ...r }) => r);
    const rec = old ? { ...old, store, date: recForm.date.value, items } : { id: uid(), at: Date.now(), by: sync.myId, store, date: recForm.date.value, items };
    if (!put('receipts', rec)) return;
    let added = 0;
    if (!old) rows.filter((r) => r.toFridge).forEach((r) => {
      const c = CATEGORIES[r.category] || CATEGORIES.inne;
      put('products', {
        id: uid(), addedAt: Date.now(), by: sync.myId, name: r.name, category: r.category, emoji: '',
        qty: r.qty, unit: r.unit, expiry: addDays(c.shelfDays), code: '', store,
        unitPrice: r.price && r.qty ? r.price / r.qty : 0, receiptId: rec.id,
        ...(r.nut ? { nut: r.nut } : {}),
      });
      added++;
    });
    recDialog.close(); render();
    toast(old ? 'Zapisano paragon' : `Zapisano paragon (${zl(receiptTotal(rec))})${added ? ` · ${added} produktów w lodówce` : ''}`);
  });
  $('#btnDeleteReceipt').addEventListener('click', async () => {
    const r = state.receipts.find((x) => x.id === recForm.id.value);
    if (r && await askConfirm(`Usunąć paragon z ${r.store} (${zl(receiptTotal(r))})? Produkty zostaną w lodówce.`)) {
      del('receipts', r.id); recDialog.close(); render(); toast('Usunięto paragon');
    }
  });
  $('#btnReceiptManual').addEventListener('click', () => openReceiptDialog());

  /* Zdjęcie paragonu -> Claude odczytuje pozycje */
  async function shrinkImage(file, maxSide = 1600) {
    try {
      const bmp = await createImageBitmap(file);
      const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
      const c = document.createElement('canvas');
      c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      return await new Promise((res) => c.toBlob((b) => res(b || file), 'image/jpeg', 0.85));
    } catch (_) { return file; }
  }
  $('#btnReceiptPhoto').addEventListener('click', () => $('#receiptFile').click());
  $('#receiptFile').addEventListener('change', async (e) => {
    const file = e.target.files[0]; e.target.value = '';
    if (!file || !sync.sample) return;
    const btn = $('#btnReceiptPhoto');
    btn.disabled = true; btn.textContent = '⏳ Czytam paragon…';
    try {
      const img = await shrinkImage(file);
      const cats = Object.keys(CATEGORIES).join(', ');
      const data = await sync.sample.json(
        `Na zdjęciu jest paragon ze sklepu (najczęściej z Polski). Odczytaj go i odpowiedz wyłącznie obiektem JSON w tym kształcie:
{"store":"Biedronka","date":"2026-11-05","items":[{"name":"Mleko 2% 1l","qty":1,"unit":"l","price":3.49,"category":"nabial","food":true,"kcal":50,"p":3.4,"f":2,"c":4.8,"unitG":1000}]}
Zasady:
- store: nazwa sklepu (krótko, np. Lidl, Biedronka, Żabka).
- date: data zakupu w formacie RRRR-MM-DD; jeśli nieczytelna, wpisz "".
- items: każda kupiona pozycja. name po polsku, czytelnie, bez skrótów z paragonu, jeśli da się je rozwinąć.
- price: końcowa kwota za pozycję w zł, po rabatach, jako liczba.
- qty i unit: ilość i jednostka (szt, g, kg, ml, l, opak); przy produktach na wagę użyj kg.
- category: jedna z: ${cats}.
- food: true dla jedzenia i napojów, false dla chemii, kosmetyków, toreb itp.
- kcal, p, f, c: typowe wartości odżywcze na 100 g lub 100 ml (kalorie, białko, tłuszcz, węglowodany) — Twój najlepszy szacunek dla tego produktu; dla produktów niespożywczych pomiń.
- unitG: waga jednej sztuki lub opakowania w gramach, gdy unit to szt lub opak.
- Pomiń sumy, podatki, kaucje i płatności.`,
        { images: [img], modelTier: 'default' }
      );
      if (!data || !Array.isArray(data.items) || !data.items.length) throw { code: 'empty' };
      const items = data.items.map((it) => ({
        name: String(it.name || '').slice(0, 60), qty: Number(it.qty) || 1, unit: ['szt', 'g', 'kg', 'ml', 'l', 'opak'].includes(it.unit) ? it.unit : 'szt',
        price: round2(it.price), category: CATEGORIES[it.category] ? it.category : guessCategoryFromName(it.name), food: it.food !== false,
        nut: Number.isFinite(+it.kcal) && it.kcal !== null && it.kcal !== undefined ? { kcal: +it.kcal || 0, p: +it.p || 0, f: +it.f || 0, c: +it.c || 0, unit: +it.unitG || 100 } : null,
      })).filter((i) => i.name);
      openReceiptDialog(null, { store: String(data.store || '').slice(0, 40), date: data.date, items });
    } catch (err) {
      const code = err && err.code;
      if (code === 'not_granted') { toast('Bez zgody na użycie Claude nie odczytamy paragonu — wpisz go ręcznie.'); }
      else if (code === 'rate_limited') toast('Za dużo prób naraz. Spróbuj za chwilę.');
      else toast('Nie udało się odczytać paragonu. Zrób wyraźniejsze zdjęcie albo wpisz go ręcznie.');
    } finally {
      btn.disabled = false; btn.textContent = '📸 Zdjęcie paragonu';
    }
  });

  // ---------- Cele ----------
  const gDialog = $('#goalDialog'), gForm = $('#goalForm');
  $('#btnAddGoal').addEventListener('click', () => { gForm.reset(); gDialog.showModal(); });
  $('#goalPresets').addEventListener('click', (e) => {
    const b = e.target.closest('[data-g]'); if (!b) return;
    const [emoji, name, target] = b.dataset.g.split('|');
    gForm.emoji.value = emoji; gForm.name.value = name; gForm.target.value = target;
  });
  gForm.addEventListener('submit', (e) => {
    if (e.submitter && e.submitter.value === 'cancel') return;
    e.preventDefault();
    const ok = put('goals', { id: uid(), at: Date.now(), by: sync.myId, name: gForm.name.value.trim(), emoji: gForm.emoji.value.trim() || '🎯', target: parseFloat(gForm.target.value) || 1, saved: 0 });
    gDialog.close(); render(); if (ok) toast('Dodano cel');
  });
  const dDialog = $('#depositDialog'), dForm = $('#depositForm');
  $('#goalList').addEventListener('click', (e) => {
    const b = e.target.closest('[data-goal]'); if (!b) return;
    const g = state.goals.find((x) => x.id === b.dataset.goal); if (!g) return;
    dForm.reset();
    const avail = availableSavings();
    const remaining = Math.max(0, g.target - (g.saved || 0));
    $('#depositTitle').textContent = `${g.emoji || '🎯'} ${g.name}`;
    $('#depositHint').textContent = `Odłożone: ${zl(g.saved || 0)} z ${zl(g.target)}. Do rozdysponowania z oszczędności: ${zl(avail)}. Możesz też wpisać dowolną kwotę z własnej kieszeni.`;
    dForm.amount.value = round2(Math.min(avail, remaining)) || '';
    dForm.id.value = g.id;
    dDialog.showModal();
  });
  dForm.addEventListener('submit', (e) => {
    if (e.submitter && e.submitter.value === 'cancel') return;
    e.preventDefault();
    const g = state.goals.find((x) => x.id === dForm.id.value); if (!g) return;
    const amt = round2(parseFloat(dForm.amount.value) || 0);
    const ok = put('goals', { ...g, saved: round2((g.saved || 0) + amt) });
    dDialog.close(); render(); if (ok) toast(`Odłożono ${zl(amt)} na: ${g.name}`);
  });
  $('#btnDeleteGoal').addEventListener('click', async () => {
    const g = state.goals.find((x) => x.id === dForm.id.value); if (!g) return;
    dDialog.close();
    if (await askConfirm(`Usunąć cel „${g.name}”?`)) { del('goals', g.id); render(); }
  });

  /* Pomysły od Claude'a */
  $('#btnAskClaude').addEventListener('click', async () => {
    if (!sync.sample) return;
    const btn = $('#btnAskClaude'), out = $('#claudeIdeas');
    const all = computeBudget('all'), m = computeBudget('month');
    const summary = {
      dostepne_do_rozdysponowania_zl: availableSavings(),
      ten_miesiac: { wydatki: m.spent, oszczednosci_gotowanie: m.savedCooking, uratowane: m.savedRescue, zmarnowane: m.wasted },
      od_poczatku: { wydatki: all.spent, bilans: all.net, zmarnowane: all.wasted },
      sklepy: Object.fromEntries(Object.entries(all.byStore).map(([s, v]) => [s, round2(v.total)])),
      kategorie: Object.fromEntries(Object.entries(all.byCat).map(([c, v]) => [CATEGORIES[c].label, round2(v)])),
      roznice_cen: all.compare.slice(0, 5).map((c) => `${c.name}: ${c.cheapStore} ${round2(c.cheap)} zł vs ${c.dearStore} ${round2(c.dear)} zł`),
      cele: state.goals.map((g) => `${g.name}: ${g.saved || 0}/${g.target} zł`),
    };
    btn.disabled = true; out.textContent = 'Claude myśli…';
    try {
      await sync.sample(
        `Jesteś doradcą od domowego budżetu jedzeniowego. Na podstawie danych z aplikacji „wirtualna lodówka” zaproponuj po polsku 4 konkretne, krótkie pomysły (każdy 1–2 zdania, zacznij od emoji): jak wykorzystać zaoszczędzone pieniądze i gdzie jeszcze można oszczędzić. Odwołuj się do liczb. Bez wstępu i podsumowania, bez nagłówków, każdy pomysł w nowej linii.\n\nDane:\n${JSON.stringify(summary, null, 1)}`,
        { modelTier: 'quick', onText: ({ text }) => { out.textContent = text; } }
      );
    } catch (err) {
      out.textContent = err && err.code === 'not_granted' ? 'Bez zgody na użycie Claude nie pokażemy pomysłów.' : 'Nie udało się pobrać pomysłów. Spróbuj za chwilę.';
    } finally { btn.disabled = false; }
  });

  // ================= Dane przykładowe / reset =================
  $('#btnDemo').addEventListener('click', () => {
    const prices = { '5900820000011': 3.99, '5900820000028': 11.99, '5900820000035': 8.49, '5900820000042': 17.99, '5900820000059': 6.99, '5900820000066': 4.29, '5900820000073': 3.29, '5900820000080': 5.99, '5900820000097': 6.49, '5900820000103': 4.99, '5900820000110': 7.49, '5900820000127': 2.49, '5900820000165': 5.98, '5900820000141': 4.79, '5900820000158': 4.39 };
    const demo = [['5900820000011', 2], ['5900820000028', 15], ['5900820000035', 12], ['5900820000042', 1], ['5900820000059', 2], ['5900820000066', 400], ['5900820000073', 0], ['5900820000080', 1], ['5900820000097', 3], ['5900820000103', 2], ['5900820000110', 25], ['5900820000127', 20], ['5900820000165', 5], ['5900820000141', 200], ['5900820000158', -1]];
    demo.forEach(([code, days], i) => {
      const p = PRODUCT_DB[code];
      put('products', { id: uid(), addedAt: Date.now() - i, by: sync.myId, name: p.name, category: p.category, emoji: p.emoji, qty: p.qty, unit: p.unit, expiry: addDays(days), code, store: i % 2 ? 'Lidl' : 'Biedronka', unitPrice: prices[code] / p.qty });
    });
    // przykładowe paragony z dwóch sklepów
    const d = (n) => addDays(-n);
    put('receipts', { id: uid(), at: Date.now(), by: sync.myId, store: 'Biedronka', date: d(2), demo: true, items: [
      { name: 'Mleko 2%', qty: 1, unit: 'l', price: 3.99, category: 'nabial' }, { name: 'Jajka (10 szt.)', qty: 10, unit: 'szt', price: 11.99, category: 'nabial' },
      { name: 'Pierś z kurczaka', qty: 500, unit: 'g', price: 17.99, category: 'mieso' }, { name: 'Pomidory', qty: 4, unit: 'szt', price: 6.99, category: 'warzywa' },
      { name: 'Makaron spaghetti', qty: 500, unit: 'g', price: 4.29, category: 'suche' }, { name: 'Chleb żytni', qty: 1, unit: 'szt', price: 6.49, category: 'pieczywo' } ] });
    put('receipts', { id: uid(), at: Date.now(), by: sync.myId, store: 'Lidl', date: d(6), demo: true, items: [
      { name: 'Mleko 2%', qty: 1, unit: 'l', price: 3.49, category: 'nabial' }, { name: 'Jajka (10 szt.)', qty: 10, unit: 'szt', price: 12.99, category: 'nabial' },
      { name: 'Ser żółty gouda', qty: 250, unit: 'g', price: 8.49, category: 'nabial' }, { name: 'Pomidory', qty: 4, unit: 'szt', price: 5.49, category: 'warzywa' },
      { name: 'Banany', qty: 5, unit: 'szt', price: 4.99, category: 'owoce' }, { name: 'Masło', qty: 200, unit: 'g', price: 7.49, category: 'nabial' } ] });
    put('receipts', { id: uid(), at: Date.now(), by: sync.myId, store: 'Żabka', date: d(1), demo: true, items: [
      { name: 'Mleko 2%', qty: 1, unit: 'l', price: 4.99, category: 'nabial' }, { name: 'Jogurt naturalny', qty: 400, unit: 'g', price: 3.29, category: 'nabial' } ] });
    logEvent({ type: 'cooked', name: 'Spaghetti z sosem pomidorowym', servings: 3, cost: 14.2, eatOut: 3 * (state.settings.eatOutPrice || 30), saved: round2(3 * (state.settings.eatOutPrice || 30) - 14.2), rescuedValue: 6.99, demo: true });
    logEvent({ type: 'wasted', name: 'Sałata lodowa', category: 'warzywa', qty: 1, unit: 'szt', value: 4.49, demo: true });
    logEvent({ type: 'used', name: 'Jogurt truskawkowy', category: 'nabial', qty: 1, unit: 'szt', value: 2.79, rescued: true, demo: true });
    render(); toast('Wczytano przykładowe produkty i paragony');
  });
  $('#btnReset').addEventListener('click', async () => {
    const msg = sync.mode === 'shared' ? 'Usunąć WSZYSTKIE dane wspólnej lodówki? Znikną u wszystkich domowników.' : 'Usunąć wszystkie produkty, posiłki, paragony i cele?';
    if (await askConfirm(msg, 'Wyczyść')) {
      for (const col of COLS) [...state[col]].forEach((x) => del(col, x.id));
      render(); toast('Wyczyszczono dane');
    }
  });

  // ================= Render =================
  function render() {
    const active = $('.view.active').id;
    renderStats();
    if (active === 'view-fridge') renderFridge();
    if (active === 'view-meals') renderMeals();
    if (active === 'view-ideas') renderIdeas();
    if (active === 'view-scan') renderQrSamples();
    if (active === 'view-budget') renderBudget();
    renderHouse();
  }

  // ================= Start =================
  const local = loadLocal();
  if (local) state = local;
  fillCategorySelects();
  render();

  /* Funkcje online (wspólna lodówka, Claude) — włączają się, gdy strona działa w claude.ai */
  async function connect() {
    if (!window.claude || typeof window.claude.use !== 'function') return;
    const [db, user, sample] = await Promise.all([
      window.claude.use('db').catch(() => null),
      window.claude.use('user').catch(() => null),
      window.claude.use('sample').catch(() => null),
    ]);
    sync.user = user;
    if (user) {
      sync.myId = await user.id();
      const can = await user.can('data.write');
      if (can === false) sync.readOnly = true;
    }
    if (sample) {
      sync.sample = sample;
      const lim = await sample.limits().catch(() => null);
      $('#btnReceiptPhoto').hidden = !(lim && lim.images);
      $('#btnAskClaude').hidden = false;
    }
    if (!db) { render(); return; }

    sync.db = db; sync.mode = 'shared'; sync.status = 'connecting';
    state = { products: [], meals: [], receipts: [], events: [], goals: [], settings: { ...DEFAULT_SETTINGS } };
    render();
    const timer = setTimeout(() => { if (sync.status === 'connecting') { sync.status = 'stale'; renderHouse(); } }, 10000);
    let renderQueued = false;
    const scheduleRender = () => { if (renderQueued) return; renderQueued = true; requestAnimationFrame(() => { renderQueued = false; render(); }); };
    const onErr = (e) => { clearTimeout(timer); sync.status = 'error'; renderHouse(); if (e && e.code !== 'revoked') toast('Synchronizacja przerwana. Odśwież stronę.'); };
    COLS.forEach((col) => {
      db.collection(col).onSnapshot((snap) => {
        state[col] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (!snap.metadata.fromCache) {
          sync.loaded[col] = true;
          if (COLS.every((c) => sync.loaded[c])) { clearTimeout(timer); sync.status = 'ok'; }
        }
        scheduleRender();
      }, onErr);
    });
    if (sync.myId) {
      const col = db.collection('data/users/' + sync.myId);
      col.doc('diet').onSnapshot((snap) => {
        if (snap.exists) diet = snap.data();
        else if (diet && !snap.metadata.fromCache) saveDiet(diet); // przenieś dietę z przeglądarki
        scheduleRender();
      }, () => { });
      col.doc('day-' + todayISO()).onSnapshot((snap) => {
        if (snap.exists) { const d = snap.data(); diary = { date: d.date || todayISO(), entries: [...(d.entries || [])] }; }
        scheduleRender();
      }, () => { });
    }
    db.doc('meta/settings').onSnapshot((snap) => {
      state.settings = { ...DEFAULT_SETTINGS, ...(snap.exists ? snap.data() : {}) };
      scheduleRender();
    }, onErr);
  }
  connect();
})();
