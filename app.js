/* Lodówka+ — logika aplikacji */
(() => {
  'use strict';

  // ---------- Narzędzia ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const fmtNum = (n) => Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100).replace('.', ',');

  const todayISO = () => toISO(new Date());
  function toISO(d) {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  function addDays(days, from = new Date()) {
    const d = new Date(from); d.setDate(d.getDate() + Number(days)); return toISO(d);
  }
  function daysLeft(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    const exp = new Date(y, m - 1, d);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    return Math.round((exp - now) / 86400000);
  }
  function plDays(n) {
    n = Math.abs(n);
    return n === 1 ? '1 dzień' : `${n} dni`;
  }
  function expiryInfo(iso) {
    const d = daysLeft(iso);
    if (d < 0) return { cls: 'expired', text: `Po terminie ${plDays(d)}`, d };
    if (d === 0) return { cls: 'today', text: 'Kończy się dziś', d };
    if (d === 1) return { cls: 'soon', text: 'Do jutra', d };
    if (d <= 3) return { cls: 'soon', text: `Jeszcze ${plDays(d)}`, d };
    return { cls: 'ok', text: `Jeszcze ${plDays(d)}`, d };
  }
  const fmtDate = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });

  // ---------- Stan ----------
  const STORE_KEY = 'lodowka-plus-v1';
  let state = { products: [], meals: [] };
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) state = Object.assign({ products: [], meals: [] }, JSON.parse(raw));
    } catch (_) { /* brak dostępu do storage – działamy w pamięci */ }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_) { }
  }
  const productById = (id) => state.products.find((p) => p.id === id);

  // ---------- Toast ----------
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  // ---------- Nawigacja ----------
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

  // ---------- Renderowanie: lodówka ----------
  function renderStats() {
    const soon = state.products.filter((p) => { const d = daysLeft(p.expiry); return d >= 0 && d <= 3; }).length;
    const expired = state.products.filter((p) => daysLeft(p.expiry) < 0).length;
    $('#stats').innerHTML = `
      <div class="stat"><b>${state.products.length}</b><span>produktów</span></div>
      <div class="stat warn"><b>${soon}</b><span>kończy się</span></div>
      <div class="stat bad"><b>${expired}</b><span>po terminie</span></div>
      <div class="stat good"><b>${state.meals.length}</b><span>posiłków</span></div>`;
  }

  function renderAlerts() {
    const urgent = state.products
      .map((p) => ({ p, d: daysLeft(p.expiry) }))
      .filter((x) => x.d <= 2)
      .sort((a, b) => a.d - b.d);
    if (!urgent.length) { $('#alerts').innerHTML = ''; return; }
    const names = urgent.slice(0, 4).map((x) => `<b>${esc(x.p.name)}</b>`).join(', ');
    const more = urgent.length > 4 ? ` i ${urgent.length - 4} inne` : '';
    $('#alerts').innerHTML = `
      <div class="alert">
        <span class="alert-icon">⏰</span>
        <div><b>Uwaga na daty!</b> ${names}${more} — wykorzystaj je jak najszybciej.</div>
        <button class="btn small" data-goto="ideas">Co z tego zrobić?</button>
      </div>`;
  }

  function renderFridge() {
    renderStats();
    renderAlerts();
    const q = norm($('#search').value);
    const cat = $('#filterCat').value;
    const sortBy = $('#sortBy').value;
    let list = state.products.filter((p) => (!q || norm(p.name).includes(q)) && (!cat || p.category === cat));
    list.sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name, 'pl')
      : sortBy === 'added' ? (b.addedAt || 0) - (a.addedAt || 0)
      : a.expiry.localeCompare(b.expiry));

    $('#fridgeEmpty').hidden = state.products.length > 0;
    $('#productList').innerHTML = list.map((p) => {
      const info = expiryInfo(p.expiry);
      const c = CATEGORIES[p.category] || CATEGORIES.inne;
      const total = Math.max(1, c.shelfDays);
      const pct = Math.max(0, Math.min(100, (info.d / total) * 100));
      return `
        <article class="product ${info.cls}" data-id="${p.id}">
          <div class="product-top">
            <span class="product-emoji">${esc(p.emoji || c.emoji)}</span>
            <div class="product-main">
              <h3>${esc(p.name)}</h3>
              <span class="muted small">${esc(c.label)}</span>
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
          <div class="muted small">Ważne do: ${fmtDate(p.expiry)}</div>
        </article>`;
    }).join('') || (state.products.length ? '<p class="muted">Brak produktów pasujących do filtra.</p>' : '');
  }

  function stepFor(unit) {
    return { g: 50, ml: 50, kg: 0.1, l: 0.1 }[unit] || 1;
  }
  $('#productList').addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) { const card = e.target.closest('.product'); if (card) openProductDialog(productById(card.dataset.id)); return; }
    if (t.dataset.edit) openProductDialog(productById(t.dataset.edit));
    if (t.dataset.inc || t.dataset.dec) {
      const p = productById(t.dataset.inc || t.dataset.dec);
      const step = stepFor(p.unit);
      p.qty = Math.round((p.qty + (t.dataset.inc ? step : -step)) * 100) / 100;
      if (p.qty <= 0) {
        state.products = state.products.filter((x) => x !== p);
        toast(`Zużyto: ${p.name}`);
      }
      save(); render();
    }
  });
  ['#search', '#filterCat', '#sortBy'].forEach((s) => $(s).addEventListener('input', renderFridge));

  // ---------- Dialog produktu ----------
  const pDialog = $('#productDialog');
  const pForm = $('#productForm');

  function fillCategorySelects() {
    const opts = Object.entries(CATEGORIES).map(([k, c]) => `<option value="${k}">${c.emoji} ${c.label}</option>`).join('');
    $('#productCategory').innerHTML = opts;
    $('#filterCat').innerHTML = '<option value="">Wszystkie kategorie</option>' + opts;
  }

  function openProductDialog(p = null, scanned = null) {
    pForm.reset();
    const data = p || scanned || {};
    const isEdit = !!p;
    $('#productDialogTitle').textContent = isEdit ? 'Edytuj produkt' : 'Dodaj produkt';
    $('#btnDeleteProduct').hidden = !isEdit;
    const category = data.category || 'inne';
    pForm.name.value = data.name || '';
    pForm.category.value = category;
    pForm.emoji.value = data.emoji || '';
    pForm.qty.value = data.qty ?? 1;
    pForm.unit.value = data.unit || 'szt';
    pForm.expiry.value = data.expiry || addDays(data.days ?? CATEGORIES[category].shelfDays);
    pForm.code.value = data.code || '';
    pForm.id.value = isEdit ? p.id : '';
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

  pForm.category.addEventListener('change', () => {
    if (!pForm.id.value) pForm.expiry.value = addDays(CATEGORIES[pForm.category.value].shelfDays);
  });
  $('#quickDates').addEventListener('click', (e) => {
    const b = e.target.closest('[data-days]');
    if (b) pForm.expiry.value = addDays(b.dataset.days);
  });

  pForm.addEventListener('submit', (e) => {
    if (e.submitter && e.submitter.value === 'cancel') return;
    e.preventDefault();
    const f = pForm;
    const entry = {
      name: f.name.value.trim(),
      category: f.category.value,
      emoji: f.emoji.value.trim(),
      qty: Math.max(0, parseFloat(f.qty.value) || 0),
      unit: f.unit.value,
      expiry: f.expiry.value,
      code: f.code.value,
    };
    if (f.id.value) {
      Object.assign(productById(f.id.value), entry);
      toast('Zapisano zmiany');
    } else {
      // Ten sam produkt z tą samą datą — zwiększ ilość
      const same = state.products.find((p) => norm(p.name) === norm(entry.name) && p.expiry === entry.expiry && p.unit === entry.unit);
      if (same) { same.qty += entry.qty; toast(`Zwiększono ilość: ${same.name}`); }
      else { state.products.push({ id: uid(), addedAt: Date.now(), ...entry }); toast(`Dodano do lodówki: ${entry.name}`); }
    }
    save(); pDialog.close(); render();
  });

  $('#btnDeleteProduct').addEventListener('click', () => {
    const id = pForm.id.value;
    const p = productById(id);
    if (p && confirm(`Usunąć „${p.name}” z lodówki?`)) {
      state.products = state.products.filter((x) => x.id !== id);
      save(); pDialog.close(); render(); toast('Usunięto produkt');
    }
  });
  $('#btnAddManual').addEventListener('click', () => openProductDialog());

  // ---------- Skanowanie ----------
  let scanner = null;
  let scanning = false;

  function getScanner() {
    if (!window.Html5Qrcode) { toast('Nie udało się wczytać modułu skanera'); return null; }
    if (!scanner) {
      $('#reader').innerHTML = '';
      scanner = new Html5Qrcode('reader', { verbose: false });
    }
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
    } catch (err) {
      $('#scanStatus').textContent = 'Brak dostępu do aparatu. Zezwól na użycie kamery lub skanuj ze zdjęcia.';
    }
  }
  async function stopScan() {
    if (scanner && scanning) {
      scanning = false;
      try { await scanner.stop(); } catch (_) { }
    }
    $('#btnStartScan').disabled = false; $('#btnStopScan').disabled = true;
  }
  $('#btnStartScan').addEventListener('click', startScan);
  $('#btnStopScan').addEventListener('click', () => { stopScan(); $('#scanStatus').textContent = 'Aparat zatrzymany.'; });
  $('#scanFile').addEventListener('change', async (e) => {
    const file = e.target.files[0]; if (!file) return;
    await stopScan();
    const s = getScanner(); if (!s) return;
    try { handleCode(await s.scanFile(file, false)); }
    catch (_) { toast('Nie znaleziono kodu na zdjęciu'); }
    e.target.value = '';
  });
  $('#codeForm').addEventListener('submit', (e) => {
    e.preventDefault();
    handleCode($('#codeInput').value.trim());
    $('#codeInput').value = '';
  });

  function guessCategory(tags = []) {
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
    const timer = setTimeout(() => ctrl.abort(), 6000);
    try {
      const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,product_name_pl,brands,categories_tags`, { signal: ctrl.signal });
      const j = await r.json();
      if (j.status !== 1 || !j.product) return null;
      const p = j.product;
      const name = [p.product_name_pl || p.product_name, p.brands && p.brands.split(',')[0]].filter(Boolean).join(' — ');
      if (!name) return null;
      return { name, category: guessCategory(p.categories_tags), qty: 1, unit: 'szt' };
    } catch (_) { return null; } finally { clearTimeout(timer); }
  }

  async function handleCode(raw) {
    if (!raw) return;
    const text = raw.trim();
    // 1) QR z danymi produktu w JSON: {"name":"Mleko","category":"nabial","days":7}
    if (text.startsWith('{')) {
      try {
        const d = JSON.parse(text);
        if (d.name) {
          const cat = CATEGORIES[d.category] ? d.category : 'inne';
          return openProductDialog(null, { name: d.name, category: cat, qty: d.qty ?? 1, unit: d.unit || 'szt', emoji: d.emoji, expiry: d.expiry, days: d.days, code: d.code || 'QR', _source: 'dane z kodu QR' });
        }
      } catch (_) { /* to nie JSON */ }
    }
    // 2) Kod kreskowy EAN/UPC
    const digits = text.replace(/\s/g, '');
    if (/^\d{8,14}$/.test(digits)) {
      if (PRODUCT_DB[digits]) return openProductDialog(null, { ...PRODUCT_DB[digits], code: digits, _source: 'baza Lodówka+' });
      $('#scanStatus').textContent = `Szukam kodu ${digits} w Open Food Facts…`;
      toast('Szukam produktu…');
      const found = await lookupOpenFoodFacts(digits);
      $('#scanStatus').textContent = 'Gotowe. Możesz zeskanować kolejny produkt.';
      return openProductDialog(null, found ? { ...found, code: digits, _source: 'Open Food Facts' } : { code: digits });
    }
    // 3) Dowolny tekst — traktujemy jako nazwę
    openProductDialog(null, { name: text.slice(0, 60), category: 'inne', _source: 'tekst z kodu', code: 'QR' });
  }

  function renderQrSamples() {
    const box = $('#qrSamples');
    if (box.dataset.ready) return;
    box.dataset.ready = '1';
    const sample = ['5900820000011', '5900820000028', '5900820000042', '5900820000080', '5900820000059', '5900820000103'];
    box.innerHTML = sample.map((code) => {
      const p = PRODUCT_DB[code];
      return `<button class="qr-sample" data-code="${code}" title="Kliknij, aby „zeskanować”">
        <div class="qr" id="qr-${code}"></div>
        <span>${p.emoji} ${esc(p.name)}</span>
      </button>`;
    }).join('');
    if (window.QRCode) {
      sample.forEach((code) => new QRCode(document.getElementById(`qr-${code}`), { text: code, width: 108, height: 108, correctLevel: QRCode.CorrectLevel.M }));
    } else {
      sample.forEach((code) => { document.getElementById(`qr-${code}`).innerHTML = `<code>${code}</code>`; });
    }
    box.addEventListener('click', (e) => {
      const b = e.target.closest('[data-code]');
      if (b) handleCode(b.dataset.code);
    });
  }

  // ---------- Dopasowanie przepisów ----------
  function productsMatching(ing) {
    return state.products
      .filter((p) => p.qty > 0)
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
    return { recipe: r, rows, have, need: required.length, rescued, score, pct: Math.round((have / required.length) * 100) };
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

  // ---------- Sugestie ----------
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
            <span>${esc(p.emoji || CATEGORIES[p.category]?.emoji || '📦')} <b>${esc(p.name)}</b> <span class="badge ${i.cls}">${i.text}</span></span>
            <span class="muted small">${esc(RESCUE_TIPS[p.category] || RESCUE_TIPS.inne)}</span></li>`; }).join('')}
        </ul>
      </div>` : '';

    const matches = RECIPES
      .filter((r) => ideaType === 'all' || r.type.includes(ideaType))
      .map(matchRecipe)
      .sort((a, b) => b.score - a.score);

    $('#ideaList').innerHTML = matches.map((m) => {
      const r = m.recipe;
      const ready = m.have === m.need;
      return `
      <article class="idea ${ready ? 'ready' : ''}" data-recipe="${r.id}">
        <div class="idea-head">
          <span class="idea-emoji">${r.emoji}</span>
          <div>
            <h3>${esc(r.name)}</h3>
            <span class="muted small">⏱ ${r.time} min · ${r.type.join(', ')}</span>
          </div>
        </div>
        <div class="match"><div class="match-bar"><span style="width:${m.pct}%"></span></div>
          <span class="small">${ready ? '✅ Masz wszystko!' : `Masz ${m.have} z ${m.need} składników`}</span></div>
        <div class="ing-chips">
          ${m.rows.map((x) => `<span class="ing ${x.product ? 'have' : x.ing.optional ? 'opt' : 'miss'}">${x.product ? '✓' : x.ing.optional ? '○' : '✗'} ${esc(x.ing.label)}</span>`).join('')}
        </div>
        ${m.rescued.length ? `<div class="rescues small">♻️ Wykorzysta: ${m.rescued.map((p) => esc(p.name)).join(', ')}</div>` : ''}
      </article>`;
    }).join('') || '<p class="muted">Brak przepisów dla tego rodzaju posiłku.</p>';
  }

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
      <h4>Składniki</h4>
      <ul class="recipe-ings">
        ${m.rows.map((x) => {
          if (x.product) { const i = expiryInfo(x.product.expiry); return `<li class="have">✓ ${esc(x.ing.label)} — <i>${esc(x.product.name)}</i> <span class="badge ${i.cls}">${i.text}</span></li>`; }
          return `<li class="${x.ing.optional ? 'opt' : 'miss'}">${x.ing.optional ? '○' : '✗'} ${esc(x.ing.label)} ${x.ing.optional ? '<span class="muted small">(opcjonalnie)</span>' : '<span class="muted small">— do kupienia</span>'}</li>`;
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
    m.rows.filter((x) => x.product).forEach((x) => { preset[x.product.id] = defaultPortion(x.product); });
    openMealDialog(null, { name: m.recipe.name, type: m.recipe.type[0], notes: m.recipe.steps.join('\n'), preset });
  });

  function defaultPortion(p) {
    const d = { szt: 2, g: 200, ml: 200, kg: 0.5, l: 0.5, opak: 1 }[p.unit] ?? 1;
    return Math.min(p.qty, d);
  }

  // ---------- Posiłki ----------
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
        <span class="pick-name">${esc(p.emoji || CATEGORIES[p.category]?.emoji || '')} ${esc(p.name)}
          <span class="badge ${i.cls}">${i.text}</span></span>
        <span class="pick-qty"><input type="number" min="0" step="any" max="${p.qty}" value="${on ? chosen[p.id] : defaultPortion(p)}" data-qty="${p.id}" aria-label="Ilość">
          <span class="muted small">/ ${fmtNum(p.qty)} ${esc(p.unit)}</span></span>
      </label>`;
    }).join('') || '<p class="muted">Lodówka jest pusta.</p>';
    mDialog.showModal();
  }
  $('#ingredientPicker').addEventListener('change', (e) => {
    if (e.target.matches('[type=checkbox]')) e.target.closest('.pick').classList.toggle('on', e.target.checked);
    if (e.target.matches('[data-qty]')) {
      const cb = e.target.closest('.pick').querySelector('[type=checkbox]');
      cb.checked = true; e.target.closest('.pick').classList.add('on');
    }
  });

  mForm.addEventListener('submit', (e) => {
    if (e.submitter && e.submitter.value === 'cancel') return;
    e.preventDefault();
    const items = $$('#ingredientPicker [type=checkbox]:checked').map((cb) => {
      const p = productById(cb.dataset.pid);
      const qty = parseFloat($(`[data-qty="${cb.dataset.pid}"]`, mForm).value) || 0;
      return { productId: p.id, name: p.name, emoji: p.emoji || CATEGORIES[p.category]?.emoji || '', qty, unit: p.unit };
    });
    if (!items.length) { toast('Wybierz przynajmniej jeden składnik'); return; }
    const data = { name: mForm.name.value.trim(), type: mForm.type.value, servings: parseInt(mForm.servings.value, 10) || 1, notes: mForm.notes.value.trim(), items };
    if (mForm.id.value) Object.assign(state.meals.find((m) => m.id === mForm.id.value), data);
    else state.meals.unshift({ id: uid(), createdAt: Date.now(), cooked: 0, ...data });
    save(); mDialog.close();
    toast('Zapisano posiłek');
    showView('meals');
  });

  function mealStatus(meal) {
    let earliest = null, missing = 0;
    const rows = meal.items.map((it) => {
      const p = productById(it.productId);
      const ok = p && p.qty >= it.qty;
      if (!ok) missing++;
      if (p && (!earliest || p.expiry < earliest)) earliest = p.expiry;
      return { it, p, ok };
    });
    return { rows, earliest, missing };
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
    const r = bestRecipeForMeal(meal);
    if (r) {
      out.push(...r.tips.map((t) => '💡 ' + t));
      const missingIngs = r.ingredients.filter((ing) => !meal.items.some((i) => ing.keys.some((k) => ` ${norm(i.name)} `.includes(` ${k}`))));
      const inFridge = missingIngs.map((ing) => productsMatching(ing)[0]).filter(Boolean);
      if (inFridge.length) out.push(`➕ Możesz dodać z lodówki: ${inFridge.map((p) => p.name).join(', ')}.`);
    }
    const byCat = new Set(st.rows.filter((x) => x.p).map((x) => x.p.category));
    if (byCat.has('mieso')) out.push('🍗 Mięso przechowuj w najzimniejszej części lodówki, a resztki zjedz w ciągu 2 dni.');
    if (meal.servings > 2) out.push(`🥡 ${meal.servings} porcje — nadmiar zapakuj do pojemnika i zamroź.`);
    if (!out.length) out.push('👍 Wszystko gotowe — smacznego!');
    return { tips: out, recipe: r };
  }

  function renderMeals() {
    $('#mealsEmpty').hidden = state.meals.length > 0;
    $('#mealList').innerHTML = state.meals.map((meal) => {
      const st = mealStatus(meal);
      const sug = mealSuggestions(meal, st);
      const ei = st.earliest ? expiryInfo(st.earliest) : null;
      return `
      <article class="meal" data-meal="${meal.id}">
        <div class="meal-head">
          <div>
            <span class="tag">${esc(meal.type)}</span>
            <h3>${esc(meal.name)}</h3>
            <span class="muted small">${meal.servings} porcje · ${meal.items.length} składników${meal.cooked ? ` · ugotowano ${meal.cooked}×` : ''}</span>
          </div>
          ${ei ? `<div class="eat-by ${ei.cls}"><span class="small">Zjedz do</span><b>${fmtDate(st.earliest)}</b></div>` : ''}
        </div>
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
          <button class="btn" data-edit-meal="${meal.id}">Edytuj</button>
          <span class="spacer"></span>
          <button class="btn danger ghost" data-del-meal="${meal.id}">Usuń</button>
        </div>
      </article>`;
    }).join('');
  }

  $('#mealList').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.openRecipe) return openRecipe(b.dataset.openRecipe);
    const meal = state.meals.find((m) => m.id === (b.dataset.cook || b.dataset.editMeal || b.dataset.delMeal));
    if (!meal) return;
    if (b.dataset.editMeal) openMealDialog(meal);
    if (b.dataset.delMeal && confirm(`Usunąć posiłek „${meal.name}”?`)) {
      state.meals = state.meals.filter((m) => m !== meal); save(); render(); toast('Usunięto posiłek');
    }
    if (b.dataset.cook) {
      const used = [];
      meal.items.forEach((it) => {
        const p = productById(it.productId); if (!p) return;
        p.qty = Math.round(Math.max(0, p.qty - it.qty) * 100) / 100;
        used.push(p.name);
      });
      const gone = state.products.filter((p) => p.qty <= 0).map((p) => p.name);
      state.products = state.products.filter((p) => p.qty > 0);
      meal.cooked = (meal.cooked || 0) + 1;
      save(); render();
      toast(`Smacznego! Zużyto składniki${gone.length ? ` (skończyło się: ${gone.join(', ')})` : ''}.`);
    }
  });
  $('#btnNewMeal').addEventListener('click', () => openMealDialog());
  $('#btnNewMeal2').addEventListener('click', () => openMealDialog());

  // ---------- Dane demonstracyjne / reset ----------
  $('#btnDemo').addEventListener('click', () => {
    const demo = [
      ['5900820000011', 2], ['5900820000028', 15], ['5900820000035', 12], ['5900820000042', 1],
      ['5900820000059', 2], ['5900820000066', 400], ['5900820000073', 0], ['5900820000080', 1],
      ['5900820000097', 3], ['5900820000103', 2], ['5900820000110', 25], ['5900820000127', 20],
      ['5900820000165', 5], ['5900820000141', 200], ['5900820000158', -1],
    ];
    demo.forEach(([code, days], i) => {
      const p = PRODUCT_DB[code];
      state.products.push({ id: uid(), addedAt: Date.now() - i, name: p.name, category: p.category, emoji: p.emoji, qty: p.qty, unit: p.unit, expiry: addDays(days), code });
    });
    save(); render(); toast('Wczytano przykładowe produkty');
  });
  $('#btnReset').addEventListener('click', () => {
    if (confirm('Usunąć wszystkie produkty i posiłki?')) {
      state = { products: [], meals: [] }; save(); render(); toast('Wyczyszczono dane');
    }
  });

  // ---------- Start ----------
  function render() {
    const active = $('.view.active').id;
    renderStats();
    if (active === 'view-fridge') renderFridge();
    if (active === 'view-meals') renderMeals();
    if (active === 'view-ideas') renderIdeas();
    if (active === 'view-scan') renderQrSamples();
  }

  load();
  fillCategorySelects();
  render();
})();
