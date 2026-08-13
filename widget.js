/* =====================================================================
   CSC compensation benchmark — embeddable widget
   ---------------------------------------------------------------------
   Drop this on any page:
       <div data-csc-benchmark></div>
       <script src="https://YOUR-HOST/widget.js" defer></script>

   Renders inside a shadow root, so the host theme's CSS cannot reach it and
   its CSS cannot leak out. Optional attributes on the mount div:
       data-src="newsletter"    source tag for this placement
       data-theme="light|dark"  force a theme (default: follows the OS)
   ===================================================================== */
(function () {
  'use strict';
  var CSS = ":host{display:block;all:initial;font:16px/1.5 system-ui,-apple-system,'Segoe UI',sans-serif;color-scheme:light dark;}\n:host *{box-sizing:border-box}\n\n:host{\n  /* ---------------------------------------------------------------------\n     CSC brand palette, validated with the dataviz palette checker.\n     Accent must carry a data mark, so it needs >=3:1 against the surface it\n     sits on and a real separation from the de-emphasis gray:\n       light  #5036d5  contrast 7.4:1 on white, CVD dE 23.0 protan\n       dark   #6251ef  brand violet stepped to L 0.549 (inside the 0.48-0.67\n                       dark band), contrast >=3:1, CVD dE 22.5 protan\n     Rejected: #ff4dd8 sits at L 0.714, outside the dark band, and white text\n     on it is only 2.87:1. #00aeed / #56dedb / #f68af9 are all under 3:1 on the\n     light surface. They are used decoratively below, never for data.\n     --------------------------------------------------------------------- */\n  --plane:#f9f8f5; --surface-1:#ffffff;\n  --ink:#09100f; --ink-2:#4a5150; --muted:#7c8280;\n  --grid:#e6e4df; --axis:#c9c6bf; --border:rgba(9,16,15,0.10);\n  --accent:#5036d5; --accent-ink:#ffffff; --context:#7c8280;\n  --track:#e6e4df; --box:#c9c6bf; --bad:#d03b3b;\n  --brand-pink:#ff4dd8; --brand-teal:#56dedb; --brand-blue:#00aeed;\n  --brand-grad:linear-gradient(90deg,#ff4dd8 0%,#5036d5 100%);\n}\n@media (prefers-color-scheme:dark){:host(:not([data-theme=light])){\n  --plane:#09100f; --surface-1:#121a19;\n  --ink:#f9f8f5; --ink-2:#c2c7c5; --muted:#868c8a;\n  --grid:#1e2423; --axis:#2c3332; --border:rgba(249,248,245,0.12);\n  --accent:#6251ef; --accent-ink:#ffffff; --context:#868c8a;\n  --track:#1e2423; --box:#2c3332; --bad:#e66767;\n  --brand-grad:linear-gradient(90deg,#ff4dd8 0%,#6f62ff 100%);\n}}\n:host([data-theme=dark]){\n  --plane:#09100f; --surface-1:#121a19;\n  --ink:#f9f8f5; --ink-2:#c2c7c5; --muted:#868c8a;\n  --grid:#1e2423; --axis:#2c3332; --border:rgba(249,248,245,0.12);\n  --accent:#6251ef; --accent-ink:#ffffff; --context:#868c8a;\n  --track:#1e2423; --box:#2c3332; --bad:#e66767;\n  --brand-grad:linear-gradient(90deg,#ff4dd8 0%,#6f62ff 100%);\n}\n*{box-sizing:border-box}\n.root{margin:0;background:var(--plane);color:var(--ink);\n font:16px/1.55 'Poppins','Poppins Fallback',system-ui,-apple-system,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased}\n.wrap{max-width:560px;margin:0 auto;padding:16px 16px 64px}\n.brand{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}\n.brand b{font-size:12px;letter-spacing:.08em;font-weight:600}\n.brand .dot{display:inline-block;width:9px;height:9px;border-radius:50%;\n background-image:var(--brand-grad);margin-right:7px}\n.tt{background:transparent;border:1px solid var(--border);color:var(--ink-2);border-radius:7px;\n font:inherit;font-size:12px;padding:5px 9px;cursor:pointer}\n.title{font-size:24px;font-weight:700;line-height:1.22;margin:0 0 8px;letter-spacing:-.015em}\n.lede{color:var(--ink-2);font-size:15px;margin:0 0 20px}\n.card{background:var(--surface-1);border:1px solid var(--border);border-radius:12px;\n padding:18px 16px;margin-bottom:12px}\n.prog{display:flex;gap:5px;margin-bottom:18px}\n.prog i{flex:1;height:4px;border-radius:2px;background:var(--track);transition:background .2s}\n.prog i.on{background-image:var(--brand-grad)}\n.q{margin-bottom:26px}\n.q:last-child{margin-bottom:8px}\nlabel.qlab{display:block;font-size:16px;font-weight:600;margin-bottom:4px;line-height:1.35}\n.help{font-size:13px;color:var(--muted);margin-bottom:10px}\n.opts{display:grid;gap:7px}\n.opt{display:flex;align-items:flex-start;gap:10px;border:1px solid var(--border);border-radius:9px;\n padding:11px 12px;cursor:pointer;background:transparent;font:inherit;text-align:left;\n color:var(--ink);width:100%;line-height:1.35}\n.opt:hover{border-color:var(--accent)}\n.opt[aria-pressed=true],.opt.sel{border-color:var(--accent);background:color-mix(in oklab,var(--accent) 8%,transparent)}\n.opt .tick{flex:0 0 18px;height:18px;border:1.5px solid var(--axis);border-radius:50%;margin-top:1px}\n.opt.multi .tick{border-radius:5px}\n.opt.sel .tick{border-color:var(--accent);background:var(--accent);\n box-shadow:inset 0 0 0 3px var(--surface-1)}\ninput[type=text],input[type=number],input[type=email],select{\n width:100%;font:inherit;padding:12px;border:1px solid var(--border);border-radius:9px;\n background:var(--surface-1);color:var(--ink)}\ninput:focus,select:focus,.opt:focus-visible{outline:2px solid var(--accent);outline-offset:1px}\n.money{display:grid;grid-template-columns:112px 1fr;gap:8px}\n.zero{margin-top:9px;font-size:13.5px;color:var(--ink-2);display:flex;gap:8px;align-items:center;cursor:pointer}\n.err{color:var(--bad);font-size:13px;margin-top:7px;display:none}\n.err.on{display:block}\n.nav{display:flex;gap:8px;margin-top:6px}\n.btn{flex:1;font:inherit;font-size:15px;font-weight:600;padding:14px;border-radius:10px;cursor:pointer;\n border:1px solid var(--border);background:transparent;color:var(--ink)}\n.btn.pri{background:var(--accent);color:var(--accent-ink);border-color:transparent}\n.btn:disabled{opacity:.5;cursor:default}\n.hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}\n.consent{font-size:12.5px;color:var(--muted);margin-top:16px;line-height:1.55}\n\n/* ---------- results ---------- */\n.hero{background:var(--surface-1);border:1px solid var(--border);border-radius:12px;\n padding:22px 18px;margin-bottom:12px;border-top:3px solid transparent;\n border-image:var(--brand-grad) 1;border-image-slice:1;border-width:3px 0 0 0}\n.hero .fig{font-size:54px;line-height:1;font-weight:700;letter-spacing:-.02em;color:var(--accent)}\n.hero .sub{color:var(--ink-2);font-size:15px;margin-top:9px}\n.hero .sub b{color:var(--ink)}\n.hero .fx{color:var(--muted);font-size:12.5px;margin-top:11px;padding-top:11px;border-top:1px solid var(--border)}\n.seg{display:flex;gap:5px;margin-bottom:12px}\n.seg button{flex:1;font:inherit;font-size:13px;padding:10px;border-radius:8px;cursor:pointer;\n border:1px solid var(--border);background:var(--surface-1);color:var(--ink-2)}\n.seg button[aria-pressed=true]{background:var(--accent);color:var(--accent-ink);border-color:transparent;font-weight:600}\n.seg button:disabled{opacity:.45;cursor:not-allowed}\n.note{background:var(--surface-1);border:1px solid var(--border);border-radius:10px;\n padding:12px 13px;margin-bottom:12px;font-size:13px;color:var(--ink-2)}\n.note b{color:var(--ink)}\n.card h2{font-size:14px;margin:0 0 3px}\n.card .basis-mini{font-size:11.5px;color:var(--muted);margin:0 0 14px}\n.narr{font-size:14px;color:var(--ink-2);margin:14px 0 0}\n.narr b{color:var(--ink);font-weight:600}\nsvg{display:block;width:100%;overflow:visible}\ntext{font:11px 'Poppins','Poppins Fallback',system-ui,-apple-system,'Segoe UI',sans-serif;fill:var(--muted)}\ntext.you{fill:var(--accent);font-weight:700;font-size:12px}\ntext.val{fill:var(--ink-2);font-variant-numeric:tabular-nums}\n.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}\n.kpis.two{grid-template-columns:repeat(2,1fr)}\n.kpi{border:1px solid var(--border);border-radius:9px;padding:12px 9px;text-align:center}\n.kpi .v{font-size:26px;font-weight:700;line-height:1.1}\n.kpi .k{font-size:11px;color:var(--muted);margin-top:5px;line-height:1.3}\n.kpi .mine{font-size:10.5px;margin-top:6px;padding-top:6px;border-top:1px solid var(--border);color:var(--ink-2)}\n.gap-row{display:grid;grid-template-columns:1fr 46px;gap:10px;align-items:center;padding:8px 0}\n.gap-row+.gap-row{border-top:1px solid var(--border)}\n.bar{height:7px;background:var(--track);border-radius:4px;overflow:hidden;margin-top:5px}\n.bar i{display:block;height:100%;background:var(--accent);border-radius:4px}\n.gap-pct{text-align:right;font-size:13px;font-weight:600;color:var(--ink-2);font-variant-numeric:tabular-nums}\ndetails{margin-top:13px;border-top:1px solid var(--border);padding-top:10px}\nsummary{font-size:12px;color:var(--muted);cursor:pointer}\ntable{width:100%;border-collapse:collapse;margin-top:9px;font-size:12.5px}\nth,td{text-align:left;padding:5px 0;border-bottom:1px solid var(--border);font-variant-numeric:tabular-nums}\nth{color:var(--muted);font-weight:600}\n.foot{color:var(--muted);font-size:11.5px;margin-top:18px;line-height:1.6}\n.tipbox{position:fixed;pointer-events:none;opacity:0;transition:opacity .1s;background:var(--ink);\n color:var(--plane);padding:6px 9px;border-radius:6px;font-size:12px;z-index:99;white-space:nowrap}\n.spin{display:inline-block;width:15px;height:15px;border:2px solid rgba(255,255,255,.35);\n border-top-color:#fff;border-radius:50%;animation:sp .7s linear infinite;vertical-align:-2px}\n@keyframes sp{to{transform:rotate(360deg)}}\n.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}\n";
  var SHELL_HTML = '<div class="root"><div id="app" aria-live="polite"></div>' +
                   '<div class="foot" id="foot"></div><div class="tipbox" id="tip" role="status"></div></div>';

  function boot(mount) {
    if (mount.__csc) return;              // never mount twice
    mount.__csc = true;
    var root = mount.attachShadow({ mode: 'open' });
    root.innerHTML = '<style>' + CSS + '</style>' + SHELL_HTML;
    if (mount.dataset.theme) root.host.setAttribute('data-theme', mount.dataset.theme);
    start(root, mount);
  }

  function start(root, mount) {
    /* =====================================================================
       CONFIG — the only part you need to edit
       ===================================================================== */
    const CONFIG = {
      url:  'https://spnbwiqpkitezdqofzmn.supabase.co',
      key:  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwbmJ3aXFwa2l0ZXpkcW9mem1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MzU2ODAsImV4cCI6MjEwMjExMTY4MH0.g2w_xFLdG2O8ltoAR8MS1d0JfUYYyGGtGwHYO7LDGWQ',
      slug: 'csc-compensation-2026',
      // HubSpot: fill these in and the report request starts posting to your form.
      // Until then the button records the opt-in locally and tells the user we'll
      // be in touch, rather than silently failing.
      hubspot: { portalId: null, formGuid: null }
    };
    /* ===================================================================== */

    const $ = s => root.querySelector(s);
    const app = $('#app'), tip = $('#tip');
    const money = (v, c) => (c && c !== 'USD' ? '' : '$') + Math.round(v).toLocaleString('en-US') + (c && c !== 'USD' ? ' ' + c : '');
    const usd = v => '$' + Math.round(v).toLocaleString('en-US');
    const ord = n => n + (['th','st','nd','rd'][n % 100 >> 3 ^ 1 && n % 10] || 'th');
    // basis labels appear mid-sentence: "among Individual contributors" reads wrong
    const midSentence = s => !s ? s
      : (s.split(' ')[0] === s.split(' ')[0].toUpperCase() ? s : s[0].toLowerCase() + s.slice(1));

    /* ---- device token: cookie first, then localStorage, then session only ---- */
    function deviceToken(){
      const NAME = 'csc_bm_tok';
      const read = () => {
        const m = document.cookie.match(new RegExp('(?:^|; )' + NAME + '=([^;]*)'));
        if (m) return decodeURIComponent(m[1]);
        try { return localStorage.getItem(NAME); } catch (e) { return null; }
      };
      let t = read();
      if (!t) {
        t = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now());
        try {
          document.cookie = NAME + '=' + encodeURIComponent(t) +
            ';path=/;max-age=' + (60*60*24*730) + ';SameSite=Lax' +
            (location.protocol === 'https:' ? ';Secure' : '');
        } catch (e) {}
        try { localStorage.setItem(NAME, t); } catch (e) {}
      }
      return t;
    }

    async function rpc(fn, args){
      const r = await fetch(CONFIG.url + '/rest/v1/rpc/' + fn, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: CONFIG.key,
                   Authorization: 'Bearer ' + CONFIG.key },
        body: JSON.stringify(args || {})
      });
      const text = await r.text();
      let body; try { body = JSON.parse(text); } catch (e) { body = text; }
      if (!r.ok) throw new Error((body && body.message) || ('HTTP ' + r.status));
      return body;
    }

    /* ---- countries. Names MUST match the classification list in the survey
       definition, or the economy tier comes out wrong. ---- */
    const COUNTRIES = ["United States","United Kingdom","Canada","Australia","New Zealand","Ireland","Germany","France","Netherlands","Belgium","Spain","Portugal","Italy","Austria","Switzerland","Sweden","Denmark","Norway","Finland","Iceland","Luxembourg","Greece","Malta","Cyprus","Czechia","Slovakia","Slovenia","Estonia","Latvia","Lithuania","Croatia","Poland","Hungary","Romania","Bulgaria","Serbia","Macedonia","Bosnia and Herzegovina","Albania","Ukraine","Turkey","Israel","United Arab Emirates","Saudi Arabia","Qatar","Egypt","Morocco","Algeria","Tunisia","Nigeria","Kenya","Ghana","South Africa","India","Pakistan","Bangladesh","Sri Lanka","Singapore","Malaysia","Indonesia","Thailand","Vietnam","Philippines","China","Hong Kong","Taiwan","Japan","South Korea","Brazil","Mexico","Argentina","Chile","Colombia","Peru","Uruguay","Costa Rica","Panama","Guatemala","Trinidad & Tobago","Jamaica","Armenia","Georgia","Kazakhstan","Russia","Other"];

    let DEF = null, Q = {}, SCREENS = [], screen = 0, answers = {}, startedAt = Date.now();
    let RESULT = null, activeCut = 'by_level';

    /* =====================================================================
       boot
       ===================================================================== */
    (async function boot(){
      render(`<div class="card" style="text-align:center;color:var(--muted)">Loading…</div>`);
      try {
        DEF = await rpc('get_survey', { p_slug: CONFIG.slug });
        if (!DEF) throw new Error('survey not open');
      } catch (e) {
        return render(`<div class="card"><h2>We can't load the survey right now</h2>
          <p class="narr">${e.message}. Please try again shortly.</p></div>`);
      }
      DEF.questions.filter(q => q.type !== 'terminator').forEach(q => Q[q.key] = q);
      SCREENS = [...new Set(DEF.questions.filter(q => q.type !== 'terminator').map(q => q.screen))].sort();
      const p = new URLSearchParams(location.search);
      answers.__source = mount.dataset.src || p.get('src') || p.get('utm_source') || 'organic';
      startedAt = Date.now();
      drawScreen();
    })();

    function render(html){ app.innerHTML = html; }

    /* =====================================================================
       survey screens
       ===================================================================== */
    function questionsFor(s){
      return DEF.questions.filter(q => q.screen === s && q.type !== 'terminator')
        .filter(q => !q.show_if || Object.entries(q.show_if).every(([k,v]) => answers[k] === v));
    }

    function fieldHTML(q){
      const v = answers[q.key];
      let inner = '';
      if (q.type === 'single'){
        inner = `<div class="opts" role="group">` + q.options.map(o =>
          `<button type="button" class="opt${v===o.key?' sel':''}" data-q="${q.key}" data-v="${o.key}"
            aria-pressed="${v===o.key}"><span class="tick"></span><span>${o.label}</span></button>`).join('') + `</div>`;
      } else if (q.type === 'multi'){
        const sel = new Set(v || []);
        inner = `<div class="opts" role="group">` + visibleOptions(q).map(o =>
          `<button type="button" class="opt multi${sel.has(o.key)?' sel':''}" data-qm="${q.key}" data-v="${o.key}"
            aria-pressed="${sel.has(o.key)}"><span class="tick"></span><span>${o.label}</span></button>`).join('') + `</div>`;
      } else if (q.type === 'single_searchable'){
        const list = q.options ? q.options.map(o => o.label)
                   : q.options_source === 'iso_country_list' ? COUNTRIES : null;
        inner = list
          ? `<select data-qs="${q.key}"><option value="">Select…</option>` +
            list.map(c => `<option${v===c?' selected':''}>${c}</option>`).join('') + `</select>`
          // no list defined for this question (industry): free text, same as the
          // annual survey collects
          : `<input type="text" data-qt="${q.key}" maxlength="80" value="${v??''}" placeholder="e.g. SaaS">`;
      } else if (q.type === 'number'){
        inner = `<input type="number" inputmode="numeric" data-qn="${q.key}" min="${q.min??0}" max="${q.max??99}"
          value="${v??''}" placeholder="e.g. 6">`;
      } else if (q.type === 'currency'){
        const cur = answers.base_salary_currency || guessCurrency();
        const list = Object.keys((DEF.fx_rates && DEF.fx_rates.per_usd) || {USD:1}).sort();
        const isBase = q.key === 'base_salary';
        inner = `<div class="money">
          ${isBase ? `<select data-cur="1">${list.map(c=>`<option${c===cur?' selected':''}>${c}</option>`).join('')}</select>`
                   : `<div style="display:flex;align-items:center;padding-left:2px;color:var(--muted);font-size:14px" data-curecho>${cur}</div>`}
          <input type="number" inputmode="numeric" data-qc="${q.key}" value="${v??''}" placeholder="0" min="0">
        </div>`;
        if (q.allow_zero) inner += `<label class="zero"><input type="checkbox" data-qz="${q.key}"
          ${v===0?'checked':''}> ${q.zero_label}</label>`;
      } else if (q.type === 'text'){
        inner = `<input type="text" data-qt="${q.key}" maxlength="${q.max_length||80}" value="${v??''}">`;
      }
      return `<div class="q" data-qwrap="${q.key}">
        <label class="qlab">${q.label}${q.required===false?' <span style="font-weight:400;color:var(--muted)">(optional)</span>':''}</label>
        ${q.help_text?`<div class="help">${q.help_text}</div>`:''}
        ${inner}
        <div class="err" data-err="${q.key}"></div></div>`;
    }

    function visibleOptions(q){
      const c = answers.country;
      return q.options.filter(o =>
        (!o.show_if_country || o.show_if_country === c) &&
        (!o.hide_if_country || o.hide_if_country !== c));
    }

    // Approximate USD value, for VALIDATION ONLY. The authoritative conversion
    // happens in submit_response using the same rates from the definition.
    function toUsdApprox(amount){
      const rates = (DEF.fx_rates && DEF.fx_rates.per_usd) || {};
      const r = rates[answers.base_salary_currency || 'USD'];
      return (r && r > 0) ? amount / r : amount;
    }

    function guessCurrency(){
      const m = { 'United Kingdom':'GBP','Canada':'CAD','Australia':'AUD','New Zealand':'NZD',
        'India':'INR','Singapore':'SGD','Israel':'ILS','Switzerland':'CHF','Sweden':'SEK',
        'Denmark':'DKK','Norway':'NOK','Poland':'PLN','South Africa':'ZAR','Brazil':'BRL',
        'United Arab Emirates':'AED','Japan':'JPY','Turkey':'TRY','Philippines':'PHP',
        'Germany':'EUR','France':'EUR','Netherlands':'EUR','Belgium':'EUR','Spain':'EUR',
        'Italy':'EUR','Portugal':'EUR','Austria':'EUR','Ireland':'EUR','Finland':'EUR',
        'Greece':'EUR','Croatia':'EUR','Slovenia':'EUR','Slovakia':'EUR','Estonia':'EUR',
        'Latvia':'EUR','Lithuania':'EUR','Luxembourg':'EUR','Malta':'EUR','Cyprus':'EUR' };
      return m[answers.country] || 'USD';
    }

    function drawScreen(){
      const s = SCREENS[screen], qs = questionsFor(s);
      const first = screen === 0;
      render(`
        ${first ? (mount.dataset.hideTitle !== undefined ? '' : `<div class="title">${DEF.title}</div>`) + `<p class="lede">${DEF.subtitle}</p>` : ''}
        <div class="prog" role="progressbar" aria-valuenow="${screen+1}" aria-valuemax="${SCREENS.length}">
          ${SCREENS.map((_,i)=>`<i class="${i<=screen?'on':''}"></i>`).join('')}</div>
        <div class="card">${qs.map(fieldHTML).join('')}</div>
        <div class="hp"><label>Leave this empty<input type="text" id="hp" tabindex="-1" autocomplete="off"></label></div>
        <div class="nav">
          ${screen>0?`<button class="btn" type="button" id="back">Back</button>`:''}
          <button class="btn pri" type="button" id="next">
            ${screen===SCREENS.length-1?'See my comparison':'Continue'}</button>
        </div>
        ${first?`<p class="consent">${DEF.consent_text}</p>`:''}`);
      wire();
      window.scrollTo({ top: 0 });
    }

    function wire(){
      app.querySelectorAll('[data-q]').forEach(b => b.onclick = () => {
        answers[b.dataset.q] = b.dataset.v; clearErr(b.dataset.q);
        if ((Q[b.dataset.q].options || []).some(o => o.reveals)) drawScreen();
        else { app.querySelectorAll(`[data-q="${b.dataset.q}"]`).forEach(x=>{
          x.classList.toggle('sel', x===b); x.setAttribute('aria-pressed', x===b); }); }
      });
      app.querySelectorAll('[data-qm]').forEach(b => b.onclick = () => {
        const k = b.dataset.qm, set = new Set(answers[k] || []);
        set.has(b.dataset.v) ? set.delete(b.dataset.v) : set.add(b.dataset.v);
        answers[k] = [...set];
        b.classList.toggle('sel'); b.setAttribute('aria-pressed', b.classList.contains('sel'));
      });
      app.querySelectorAll('[data-qs]').forEach(el => el.onchange = () => {
        answers[el.dataset.qs] = el.value || undefined;
        clearErr(el.dataset.qs);
        if (el.dataset.qs === 'country') answers.base_salary_currency = guessCurrency();
        drawScreen();
      });
      app.querySelectorAll('[data-qn]').forEach(el => el.oninput = () => {
        answers[el.dataset.qn] = el.value === '' ? undefined : Number(el.value); clearErr(el.dataset.qn); });
      app.querySelectorAll('[data-qc]').forEach(el => el.oninput = () => {
        answers[el.dataset.qc] = el.value === '' ? undefined : Number(el.value); clearErr(el.dataset.qc);
        const z = app.querySelector(`[data-qz="${el.dataset.qc}"]`); if (z) z.checked = false; });
      app.querySelectorAll('[data-qz]').forEach(el => el.onchange = () => {
        const k = el.dataset.qz;
        answers[k] = el.checked ? 0 : undefined;
        const i = app.querySelector(`[data-qc="${k}"]`); if (i) i.value = el.checked ? 0 : '';
        clearErr(k); });
      app.querySelectorAll('[data-qt]').forEach(el => el.oninput = () => {
        answers[el.dataset.qt] = el.value || undefined; clearErr(el.dataset.qt); });
      const cur = app.querySelector('[data-cur]');
      if (cur) cur.onchange = () => { answers.base_salary_currency = cur.value;
        app.querySelectorAll('[data-curecho]').forEach(e => e.textContent = cur.value); };
      if ($('#back')) $('#back').onclick = () => { screen--; drawScreen(); };
      $('#next').onclick = onNext;
    }

    function showErr(k, msg){ const e = app.querySelector(`[data-err="${k}"]`);
      if (e){ e.textContent = msg; e.classList.add('on'); } }
    function clearErr(k){ const e = app.querySelector(`[data-err="${k}"]`);
      if (e) e.classList.remove('on'); }

    function onNext(){
      const qs = questionsFor(SCREENS[screen]);
      let ok = true;
      for (const q of qs){
        const v = answers[q.key];
        const empty = v === undefined || v === '' || (Array.isArray(v) && !v.length);
        if (q.required !== false && empty && q.type !== 'multi'){
          showErr(q.key, 'Please answer this one.'); ok = false; continue;
        }
        if (q.type === 'number' && v !== undefined && (v < (q.min??0) || v > (q.max??99))){
          showErr(q.key, `Please enter a number between ${q.min??0} and ${q.max??99}.`); ok = false;
        }
        if (q.key === 'base_salary' && v !== undefined){
          const val = q.validation || {}, cur = answers.base_salary_currency || 'USD';
          const inUsd = toUsdApprox(v);
          if (inUsd < (val.min ?? 1000)){
            showErr(q.key, (val.soft_prompt_message || 'Did you mean {value},000?').replace('{value}', v));
            ok = false;
          } else if (inUsd > (val.max ?? 2000000)){
            showErr(q.key, `That works out to about ${usd(inUsd)} — please check the figure${
              cur !== 'USD' ? ' and the currency' : ''}.`);
            ok = false;
          }
        }
      }
      if (!ok) return app.querySelector('.err.on')?.scrollIntoView({ block:'center', behavior:'smooth' });
      if (screen < SCREENS.length - 1){ screen++; return drawScreen(); }
      submit();
    }

    /* =====================================================================
       submit
       ===================================================================== */
    async function submit(){
      const btn = $('#next');
      btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Working out your comparison…';
      const payload = {};
      DEF.questions.filter(q => q.type !== 'terminator').forEach(q => {
        if (answers[q.key] !== undefined) payload[q.key] = answers[q.key];
      });
      payload.base_salary_currency = answers.base_salary_currency || 'USD';
      try {
        const r = await rpc('submit_response', {
          p_survey_slug: CONFIG.slug,
          p_anon_token: deviceToken(),
          p_answers: payload,
          p_source: answers.__source,
          p_referrer: document.referrer || null,
          p_duration_ms: Date.now() - startedAt,
          p_honeypot: ($('#hp') && $('#hp').value) || null,
          p_ip: null                      // set server-side by a proxy if you add one
        });
        if (!r || r.ok === false) return submitFailed(r);
        RESULT = r;
        activeCut = r.cuts.by_level && r.cuts.by_level.available && !r.cuts.by_level.unclassified
          ? 'by_level' : 'by_economy';
        drawResults();
      } catch (e){
        submitFailed({ error: 'network', message: e.message });
      }
    }

    function submitFailed(r){
      const btn = $('#next');
      if (btn){ btn.disabled = false; btn.textContent = 'Try again'; }
      const map = {
        too_fast: 'Please take a moment over the questions and try again.',
        invalid_salary: 'That salary figure doesn\'t look right — please check it.',
        unsupported_currency: r && r.message,
        rate_limited: 'A few too many submissions from your network just now. Please try again later.',
        rejected: 'Something went wrong with that submission.',
        survey_not_open: 'This survey has closed.',
        network: 'We couldn\'t reach the server. Please check your connection and try again.'
      };
      const msg = (r && map[r.error]) || (r && r.message) || 'Something went wrong.';
      let box = app.querySelector('#failbox');
      if (!box){ box = document.createElement('div'); box.id = 'failbox'; box.className = 'note';
        app.querySelector('.nav').before(box); }
      box.innerHTML = `<b>${msg}</b>`;
      box.scrollIntoView({ block:'center', behavior:'smooth' });
    }

    /* =====================================================================
       results
       ===================================================================== */
    function benefitLabel(key){
      const q = Q.benefits;
      const o = q && q.options.find(o => o.key === key);
      return o ? o.label : key;
    }

    function distribution(st, yourVal, label){
      const W=480,H=96,L=6,R=6,pw=W-L-R,y=44,h=16;
      const lo=Math.min(st.p10,yourVal)*0.94, hi=Math.max(st.p90,yourVal)*1.06;
      const x=v=>L+(v-lo)/(hi-lo)*pw;
      return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
        <rect x="${x(st.p10)}" y="${y}" width="${Math.max(2,x(st.p90)-x(st.p10))}" height="${h}" rx="4" fill="var(--track)"/>
        <rect x="${x(st.p25)}" y="${y}" width="${Math.max(2,x(st.p75)-x(st.p25))}" height="${h}" rx="3" fill="var(--box)"
          data-tip="Middle half of peers<br>${usd(st.p25)} – ${usd(st.p75)}"/>
        <line x1="${x(st.median)}" x2="${x(st.median)}" y1="${y-5}" y2="${y+h+5}" stroke="var(--ink-2)" stroke-width="2"/>
        <text class="val" x="${x(st.median)}" y="${y+h+19}" text-anchor="middle">${usd(st.median)}</text>
        <text x="${x(st.median)}" y="${y+h+32}" text-anchor="middle">peer median</text>
        <circle cx="${x(yourVal)}" cy="${y+h/2}" r="8" fill="var(--accent)" stroke="var(--surface-1)" stroke-width="2"
          data-tip="You<br>${usd(yourVal)}"/>
        <text class="you" x="${x(yourVal)}" y="${y-11}" text-anchor="middle">You · ${usd(yourVal)}</text>
        <text x="${L}" y="${y+h+19}">${usd(st.p10)}</text>
        <text x="${W-R}" y="${y+h+19}" text-anchor="end">${usd(st.p90)}</text></svg>`;
    }

    function scatter(tr){
      const pts = tr.points || [];
      if (!pts.length) return '';
      const ys = pts.map(p=>p.y).sort((a,b)=>a-b);
      const cap = ys[Math.floor(ys.length*0.97)] || ys[ys.length-1];
      const shown = pts.filter(p=>p.y<=cap), dropped = pts.length-shown.length;
      const W=480,H=250,L=54,R=10,T=14,B=34,pw=W-L-R,ph=H-T-B;
      const yourX = tr.your_point.x, yourY = tr.your_point.y;
      const x1 = Math.max(...shown.map(p=>p.x), yourX) + 1;
      const y1 = Math.max(...shown.map(p=>p.y), yourY) * 1.08;
      const X=v=>L+v/x1*pw, Y=v=>T+ph-v/y1*ph;
      let g='';
      for(let i=1;i<=4;i++){ const v=y1*i/4;
        g+=`<line x1="${L}" x2="${W-R}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--grid)" stroke-width="1"/>
            <text class="val" x="${L-8}" y="${Y(v)+4}" text-anchor="end">$${Math.round(v/1000)}k</text>`; }
      let xt=''; const step = x1>22?5:x1>12?4:2;
      for(let v=0;v<=x1-1;v+=step) xt+=`<text x="${X(v)}" y="${H-14}" text-anchor="middle">${v}</text>`;
      let fit='';
      if (tr.fit){
        const pathPts=[];
        for(let v=Math.min(...shown.map(p=>p.x)); v<=Math.max(...shown.map(p=>p.x)); v++)
          pathPts.push(`${X(v)},${Y(Math.exp(+tr.fit.intercept + +tr.fit.slope*v))}`);
        if (pathPts.length>1) fit=`<path d="M${pathPts.join('L')}" fill="none" stroke="var(--accent)"
          stroke-width="2" stroke-opacity="0.55" stroke-linecap="round"/>`;
      }
      return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Your salary and experience against peers">
        ${g}${xt}<line x1="${L}" x2="${W-R}" y1="${T+ph}" y2="${T+ph}" stroke="var(--axis)" stroke-width="1"/>
        <text x="${L+pw/2}" y="${H-1}" text-anchor="middle">years of experience in customer success</text>
        ${shown.map(p=>`<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="4" fill="var(--context)" fill-opacity="0.45"
          data-tip="A peer<br>${p.x} yrs · ${usd(p.y)}"/>`).join('')}
        ${fit}
        <circle cx="${X(yourX)}" cy="${Y(yourY)}" r="9" fill="var(--accent)" stroke="var(--surface-1)" stroke-width="2"
          data-tip="You<br>${yourX} yrs · ${usd(yourY)}"/>
        <text class="you" x="${X(yourX)}" y="${Y(yourY)-16}" text-anchor="middle">You</text></svg>
        ${dropped?`<p class="basis-mini" style="margin:8px 0 0">Excludes ${dropped} respondent${dropped>1?'s':''}
          earning above ${usd(cap)}, to keep the scale readable.</p>`:''}`;
    }

    function table(rows){
      return `<details><summary>Show the numbers</summary><table><tbody>${rows.map(r=>
        `<tr><th>${r[0]}</th><td style="text-align:right">${r[1]}</td></tr>`).join('')}</tbody></table></details>`;
    }

    function drawResults(){
      const you = RESULT.you, cut = RESULT.cuts[activeCut] || {};
      const cutDef = (DEF.display_cuts || []).find(c => c.key === activeCut) || {};
      const other = activeCut === 'by_level' ? 'by_economy' : 'by_level';
      const otherCut = RESULT.cuts[other] || {};
      const b = cut.basis || {};
      const st = cut.base_salary;

      if (!cut.available){
        render(`<div class="card"><h2>Thanks — you're in</h2>
          <p class="narr">${cut.message || cut.share_prompt ||
            'We don\'t have enough responses yet to show you a comparison. You\'ll be among the first to see it when we do.'}</p></div>
          ${asksHTML()}`);
        return wireResults();
      }

      const diff = Math.round((you.base_salary_usd / st.median - 1) * 100);
      const shownKeys = new Set(visibleOptions(Q.benefits).map(o => o.key));
      const gaps = (cut.benefits_gap || []).filter(g => shownKeys.has(g.key)).slice(0, 5);
      const fxLine = you.entered_currency && you.entered_currency !== 'USD'
        ? `<div class="fx">You entered ${you.entered_currency}. Converted at ${you.fx_rate} to
           ${usd(you.base_salary_usd)} so it can be compared. All figures shown in US dollars.</div>` : '';

      render(`
      <div class="hero">
        <div class="fig">${ord(st.your_percentile)}</div>
        <div class="sub">percentile for base salary among <b>${midSentence(b.label)}</b>.
          Your ${usd(you.base_salary_usd)} is <b>${diff>=0?diff+'% above':Math.abs(diff)+'% below'}</b>
          the peer median of ${usd(st.median)}.</div>
        ${fxLine}
      </div>

      ${RESULT.duplicate?`<div class="note"><b>You've already completed this one.</b> Here's your comparison again.</div>`:''}

      <div class="seg" role="group" aria-label="Choose your comparison group">
        ${(DEF.display_cuts||[]).map(c=>{
          const avail = RESULT.cuts[c.key] && RESULT.cuts[c.key].available && !RESULT.cuts[c.key].unclassified;
          return `<button type="button" data-cut="${c.key}" aria-pressed="${c.key===activeCut}"
            ${avail?'':'disabled title="'+((RESULT.cuts[c.key]||{}).message||'Not available for you')+'"'}>
            ${c.toggle_label}</button>`;}).join('')}
      </div>

      ${b.suppressed?`<div class="note"><b>Why this group?</b> We only had
        ${(cut.n!=null?cut.n:'a few')} responses from ${b.suppressed_from||'your exact group'} — below our
        ${RESULT.threshold}-response minimum — so we widened the comparison rather than show you a figure
        we can't stand behind.</div>`:''}
      ${cutDef.caveat_required && cutDef.caveat_line && !b.suppressed
        ? `<div class="note">${cutDef.caveat_line}</div>` : ''}

      <div class="card"><h2>Base salary</h2>
        <p class="basis-mini">${b.label} · n=${b.n}</p>
        ${distribution(st, you.base_salary_usd, 'Your base salary against the peer distribution')}
        <p class="narr">A quarter of your peers earn under ${usd(st.p25)}; a quarter earn over ${usd(st.p75)}.</p>
        ${table([['Your base salary',usd(you.base_salary_usd)],['Peer median',usd(st.median)],
          ['25th percentile',usd(st.p25)],['75th percentile',usd(st.p75)],
          ['10th percentile',usd(st.p10)],['90th percentile',usd(st.p90)],['Responses',b.n]])}
      </div>

      ${cut.trend && cut.trend.points && cut.trend.points.length ? `<div class="card">
        <h2>Salary against years of experience</h2>
        <p class="basis-mini">${b.label}, every level · n=${cut.trend.n}</p>
        ${scatter(cut.trend)}
        <p class="narr">This uses <b>every respondent in your comparison group</b> rather than a narrow
          slice, so it works even where the group is small.</p></div>` : ''}

      <div class="card"><h2>Total compensation</h2>
        <p class="basis-mini">Base + bonus + stock · ${b.label} · n=${b.n}</p>
        ${distribution(cut.total_comp, you.total_comp_usd, 'Your total compensation against peers')}
        <p class="narr">Your ${usd(you.total_comp_usd)} puts you in the
          <b>${ord(cut.total_comp.your_percentile)} percentile</b> on total compensation.</p>
      </div>

      <div class="card"><h2>How your peers are paid</h2>
        <p class="basis-mini">${b.label} · n=${b.n}</p>
        <div class="kpis">
          <div class="kpi"><div class="v">${cut.shares.commission}%</div><div class="k">get commission</div>
            <div class="mine">You: ${answers.commission === 'yes' ? 'yes':'no'}</div></div>
          <div class="kpi"><div class="v">${cut.shares.bonus}%</div><div class="k">get a bonus</div>
            <div class="mine">You: ${answers.bonus_annual>0?'yes':'no'}</div></div>
          <div class="kpi"><div class="v">${cut.shares.stock}%</div><div class="k">get stock</div>
            <div class="mine">You: ${answers.stock_annual>0?'yes':'no'}</div></div>
        </div>
      </div>

      ${gaps.length?`<div class="card"><h2>Benefits your peers get that you don't</h2>
        <p class="basis-mini">Share of ${b.label} who receive each · n=${b.n}</p>
        ${gaps.map(g=>`<div class="gap-row">
          <div><div>${benefitLabel(g.key)}</div><div class="bar"><i style="width:${g.peer_pct}%"></i></div></div>
          <div class="gap-pct">${g.peer_pct}%</div></div>`).join('')}
        </div>`:''}

      <div class="card"><h2>You're not alone</h2>
        <p class="basis-mini">${b.label} · n=${b.n}</p>
        <div class="kpis two">
          <div class="kpi"><div class="v">${cut.sentiment.not_reflective}%</div>
            <div class="k">say their salary doesn't reflect their role</div></div>
          <div class="kpi"><div class="v">${cut.sentiment.unhappy}%</div>
            <div class="k">aren't happy with their compensation</div></div>
        </div>
      </div>

      ${unlockHTML(otherCut)}
      ${asksHTML()}`);

      $('#foot').innerHTML = `${RESULT.vintage ? RESULT.vintage + '. ' : ''}No comparison is shown on fewer than
        ${RESULT.threshold} responses. Individual answers are never published or attributed.
        Figures normalised to US dollars.`;
      wireResults();
    }

    function unlockHTML(otherCut){
      const u = DEF.results_screen && DEF.results_screen.unlock_card;
      const gap = otherCut && otherCut.available === false && otherCut.needed;
      return `<div class="card">
        <h2>${u ? u.headline : 'Want your exact peer group?'}</h2>
        <p class="narr">${u ? u.body : ''}</p>
        ${gap?`<p class="narr" style="margin-top:10px"><b>${otherCut.share_prompt}</b>
          Know someone else in customer success? The more people who take this, the sharper
          everyone's comparison gets.</p>`
          :`<p class="narr" style="margin-top:10px">Know someone else in customer success?
          The more people who take this, the sharper everyone's comparison gets.</p>`}
      </div>`;
    }

    function asksHTML(){
      const asks = (DEF.post_results_asks && DEF.post_results_asks.asks) || [];
      const report = asks.find(a => a.key === 'report_request') || {};
      const panel  = asks.find(a => a.key === 'panel_opt_in') || {};
      return `<div class="card" id="asks">
        <h2>${report.copy || 'Send me the full report'}</h2>
        <p class="basis-mini" style="margin-bottom:12px">Optional. Your answers stay anonymous either way —
          this is a separate permission.</p>
        <div class="q" style="margin-bottom:14px">
          <input type="email" id="askEmail" placeholder="you@company.com" autocomplete="email">
          <div class="err" data-err="email"></div>
        </div>
        <label class="zero" style="margin-bottom:14px"><input type="checkbox" id="askPanel">
          ${panel.copy || 'Send me the next module when it opens'}</label>
        <button class="btn pri" type="button" id="askSend">Send me the report</button>
        <div id="askDone" class="note" style="display:none;margin:12px 0 0"></div>
      </div>`;
    }

    function wireResults(){
      app.querySelectorAll('[data-cut]').forEach(b => b.onclick = () => {
        activeCut = b.dataset.cut; drawResults(); window.scrollTo({top:0,behavior:'smooth'}); });
      app.querySelectorAll('[data-tip]').forEach(el => {
        el.style.cursor='crosshair';
        el.addEventListener('mousemove', e => { tip.innerHTML = el.dataset.tip; tip.style.opacity=1;
          tip.style.left = Math.min(innerWidth - tip.offsetWidth - 8, e.clientX + 12) + 'px';
          tip.style.top = (e.clientY - 34) + 'px'; });
        el.addEventListener('mouseleave', () => tip.style.opacity = 0);
      });
      const send = $('#askSend');
      if (send) send.onclick = async () => {
        const email = ($('#askEmail').value || '').trim();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){
          const e = app.querySelector('[data-err="email"]');
          e.textContent = 'Please enter a valid email address.'; e.classList.add('on'); return;
        }
        send.disabled = true; send.innerHTML = '<span class="spin"></span> Sending…';
        const ok = await sendToHubSpot(email, $('#askPanel').checked);
        const done = $('#askDone');
        done.style.display = 'block';
        done.innerHTML = ok
          ? `<b>Done.</b> We'll email the report to ${email} when it publishes.`
          : `<b>Noted.</b> We've recorded your request for ${email}.`;
        send.style.display = 'none';
      };
    }

    async function sendToHubSpot(email, panelOptIn){
      const { portalId, formGuid } = CONFIG.hubspot;
      if (!portalId || !formGuid){
        // Not configured yet. Fail visibly in the console rather than silently.
        console.warn('[CSC] HubSpot not configured — set CONFIG.hubspot.portalId and formGuid.');
        return false;
      }
      const hutk = (document.cookie.match(/(?:^|; )hubspotutk=([^;]*)/) || [])[1];
      try {
        const r = await fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formGuid}`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({
            fields: [
              { name:'email', value: email },
              { name:'csc_module_a_completed', value:'true' },
              { name:'csc_panel_opt_in', value: panelOptIn ? 'true' : 'false' }
            ],
            context: { hutk: hutk ? decodeURIComponent(hutk) : undefined,
                       pageUri: location.href, pageName: 'CSC compensation benchmark — results' },
            legalConsentOptions: { consent: {
              consentToProcess: true,
              text: 'I agree to receive the CSC Customer Success Compensation Report and related research updates.',
              communications: [{ value:true, subscriptionTypeId: 999,
                text:'Email me CSC research and reports.' }] } }
          })
        });
        return r.ok;
      } catch (e){ console.warn('[CSC] HubSpot submit failed', e); return false; }
    }
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  ready(function () {
    var nodes = document.querySelectorAll('[data-csc-benchmark]');
    for (var i = 0; i < nodes.length; i++) boot(nodes[i]);
  });
})();