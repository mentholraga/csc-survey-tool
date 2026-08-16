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
  var CSS = ":host{display:block;all:initial;font:16px/1.5 system-ui,-apple-system,'Segoe UI',sans-serif;color-scheme:light dark;}\n:host *{box-sizing:border-box}\n\n:host{\n  /* ---------------------------------------------------------------------\n     CSC brand palette, validated with the dataviz palette checker.\n     Accent must carry a data mark, so it needs >=3:1 against the surface it\n     sits on and a real separation from the de-emphasis gray:\n       light  #5036d5  contrast 7.4:1 on white, CVD dE 23.0 protan\n       dark   #6251ef  brand violet stepped to L 0.549 (inside the 0.48-0.67\n                       dark band), contrast >=3:1, CVD dE 22.5 protan\n     Rejected: #ff4dd8 sits at L 0.714, outside the dark band, and white text\n     on it is only 2.87:1. #00aeed / #56dedb / #f68af9 are all under 3:1 on the\n     light surface. They are used decoratively below, never for data.\n     --------------------------------------------------------------------- */\n  --plane:#f9f8f5; --surface-1:#ffffff;\n  --ink:#09100f; --ink-2:#4a5150; --muted:#7c8280;\n  --grid:#e6e4df; --axis:#c9c6bf; --border:rgba(9,16,15,0.10);\n  --accent:#5036d5; --accent-ink:#ffffff; --context:#7c8280;\n  --track:#e6e4df; --box:#c9c6bf; --bad:#d03b3b;\n  --brand-pink:#ff4dd8; --brand-teal:#56dedb; --brand-blue:#00aeed;\n  --brand-grad:linear-gradient(90deg,#ff4dd8 0%,#5036d5 100%);\n}\n@media (prefers-color-scheme:dark){:host(:not([data-theme=light])){\n  --plane:#09100f; --surface-1:#121a19;\n  --ink:#f9f8f5; --ink-2:#c2c7c5; --muted:#868c8a;\n  --grid:#1e2423; --axis:#2c3332; --border:rgba(249,248,245,0.12);\n  --accent:#6251ef; --accent-ink:#ffffff; --context:#868c8a;\n  --track:#1e2423; --box:#2c3332; --bad:#e66767;\n  --brand-grad:linear-gradient(90deg,#ff4dd8 0%,#6f62ff 100%);\n}}\n:host([data-theme=dark]){\n  --plane:#09100f; --surface-1:#121a19;\n  --ink:#f9f8f5; --ink-2:#c2c7c5; --muted:#868c8a;\n  --grid:#1e2423; --axis:#2c3332; --border:rgba(249,248,245,0.12);\n  --accent:#6251ef; --accent-ink:#ffffff; --context:#868c8a;\n  --track:#1e2423; --box:#2c3332; --bad:#e66767;\n  --brand-grad:linear-gradient(90deg,#ff4dd8 0%,#6f62ff 100%);\n}\n*{box-sizing:border-box}\n.root{margin:0;background:var(--plane);color:var(--ink);\n font:16px/1.55 'Poppins','Poppins Fallback',system-ui,-apple-system,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased}\n.wrap{max-width:560px;margin:0 auto;padding:16px 16px 64px}\n.brand{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}\n.brand b{font-size:12px;letter-spacing:.08em;font-weight:600}\n.brand .dot{display:inline-block;width:9px;height:9px;border-radius:50%;\n background-image:var(--brand-grad);margin-right:7px}\n.tt{background:transparent;border:1px solid var(--border);color:var(--ink-2);border-radius:7px;\n font:inherit;font-size:12px;padding:5px 9px;cursor:pointer}\n.title{font-size:24px;font-weight:700;line-height:1.22;margin:0 0 8px;letter-spacing:-.015em}\n.lede{color:var(--ink-2);font-size:15px;margin:0 0 20px}\n.card{background:var(--surface-1);border:1px solid var(--border);border-radius:12px;\n padding:18px 16px;margin-bottom:12px}\n.prog{display:flex;gap:5px;margin-bottom:18px}\n.prog i{flex:1;height:4px;border-radius:2px;background:var(--track);transition:background .2s}\n.prog i.on{background-image:var(--brand-grad)}\n.q{margin-bottom:26px}\n.q:last-child{margin-bottom:8px}\nlabel.qlab{display:block;font-size:16px;font-weight:600;margin-bottom:4px;line-height:1.35}\n.help{font-size:13px;color:var(--muted);margin-bottom:10px}\n.opts{display:grid;gap:7px}\n.opt{display:flex;align-items:flex-start;gap:10px;border:1px solid var(--border);border-radius:9px;\n padding:11px 12px;cursor:pointer;background:transparent;font:inherit;text-align:left;\n color:var(--ink);width:100%;line-height:1.35}\n.opt:hover{border-color:var(--accent)}\n.opt[aria-pressed=true],.opt.sel{border-color:var(--accent);background:color-mix(in oklab,var(--accent) 8%,transparent)}\n.opt .tick{flex:0 0 18px;height:18px;border:1.5px solid var(--axis);border-radius:50%;margin-top:1px}\n.opt.multi .tick{border-radius:5px}\n.opt.sel .tick{border-color:var(--accent);background:var(--accent);\n box-shadow:inset 0 0 0 3px var(--surface-1)}\ninput[type=text],input[type=number],input[type=email],select{\n width:100%;font:inherit;padding:12px;border:1px solid var(--border);border-radius:9px;\n background:var(--surface-1);color:var(--ink)}\ninput:focus,select:focus,.opt:focus-visible{outline:2px solid var(--accent);outline-offset:1px}\n.money{display:grid;grid-template-columns:112px 1fr;gap:8px}\n.zero{margin-top:9px;font-size:13.5px;color:var(--ink-2);display:flex;gap:8px;align-items:center;cursor:pointer}\n.err{color:var(--bad);font-size:13px;margin-top:7px;display:none}\n.err.on{display:block}\n.nav{display:flex;gap:8px;margin-top:6px}\n.btn{flex:1;font:inherit;font-size:15px;font-weight:600;padding:14px;border-radius:10px;cursor:pointer;\n border:1px solid var(--border);background:transparent;color:var(--ink)}\n.btn.pri{background:var(--accent);color:var(--accent-ink);border-color:transparent}\n.btn:disabled{opacity:.5;cursor:default}\n.hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}\n.consent{font-size:12.5px;color:var(--muted);margin-top:16px;line-height:1.55}\n\n/* ---------- results ---------- */\n.hero{background:var(--surface-1);border:1px solid var(--border);border-radius:12px;\n padding:22px 18px;margin-bottom:12px;border-top:3px solid transparent;\n border-image:var(--brand-grad) 1;border-image-slice:1;border-width:3px 0 0 0}\n.hero .fig{font-size:54px;line-height:1;font-weight:700;letter-spacing:-.02em;color:var(--accent)}\n.hero .sub{color:var(--ink-2);font-size:15px;margin-top:9px}\n.hero .sub b{color:var(--ink)}\n.hero .fx{color:var(--muted);font-size:12.5px;margin-top:11px;padding-top:11px;border-top:1px solid var(--border)}\n.seg{display:flex;gap:5px;margin-bottom:12px}\n.seg button{flex:1;font:inherit;font-size:13px;padding:10px;border-radius:8px;cursor:pointer;\n border:1px solid var(--border);background:var(--surface-1);color:var(--ink-2)}\n.seg button[aria-pressed=true]{background:var(--accent);color:var(--accent-ink);border-color:transparent;font-weight:600}\n.seg button:disabled{opacity:.45;cursor:not-allowed}\n.note{background:var(--surface-1);border:1px solid var(--border);border-radius:10px;\n padding:12px 13px;margin-bottom:12px;font-size:13px;color:var(--ink-2)}\n.note b{color:var(--ink)}\n.card h2{font-size:14px;margin:0 0 3px}\n.card .basis-mini{font-size:11.5px;color:var(--muted);margin:0 0 14px}\n.narr{font-size:14px;color:var(--ink-2);margin:14px 0 0}\n.narr b{color:var(--ink);font-weight:600}\nsvg{display:block;width:100%;overflow:visible}\ntext{font:11px 'Poppins','Poppins Fallback',system-ui,-apple-system,'Segoe UI',sans-serif;fill:var(--muted)}\ntext.you{fill:var(--accent);font-weight:700;font-size:12px}\ntext.val{fill:var(--ink-2);font-variant-numeric:tabular-nums}\n.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}\n.kpis.two{grid-template-columns:repeat(2,1fr)}\n.kpi{border:1px solid var(--border);border-radius:9px;padding:12px 9px;text-align:center}\n.kpi .v{font-size:26px;font-weight:700;line-height:1.1}\n.kpi .k{font-size:11px;color:var(--muted);margin-top:5px;line-height:1.3}\n.kpi .mine{font-size:10.5px;margin-top:6px;padding-top:6px;border-top:1px solid var(--border);color:var(--ink-2)}\n.gap-row{display:grid;grid-template-columns:1fr 46px;gap:10px;align-items:center;padding:8px 0}\n.gap-row+.gap-row{border-top:1px solid var(--border)}\n.bar{height:7px;background:var(--track);border-radius:4px;overflow:hidden;margin-top:5px}\n.bar i{display:block;height:100%;background:var(--accent);border-radius:4px}\n.gap-pct{text-align:right;font-size:13px;font-weight:600;color:var(--ink-2);font-variant-numeric:tabular-nums}\ndetails{margin-top:13px;border-top:1px solid var(--border);padding-top:10px}\nsummary{font-size:12px;color:var(--muted);cursor:pointer}\ntable{width:100%;border-collapse:collapse;margin-top:9px;font-size:12.5px}\nth,td{text-align:left;padding:5px 0;border-bottom:1px solid var(--border);font-variant-numeric:tabular-nums}\nth{color:var(--muted);font-weight:600}\n.foot{color:var(--muted);font-size:11.5px;margin-top:18px;line-height:1.6}\n.tipbox{position:fixed;pointer-events:none;opacity:0;transition:opacity .1s;background:var(--ink);\n color:var(--plane);padding:6px 9px;border-radius:6px;font-size:12px;z-index:99;white-space:nowrap}\n.spin{display:inline-block;width:15px;height:15px;border:2px solid rgba(255,255,255,.35);\n border-top-color:#fff;border-radius:50%;animation:sp .7s linear infinite;vertical-align:-2px}\n@keyframes sp{to{transform:rotate(360deg)}}\n.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}\n\n/* ---------- stage flow ---------- */\n.stagebar{display:flex;align-items:center;gap:8px;margin-bottom:14px;font-size:12px;color:var(--muted)}\n.stagebar .pips{display:flex;gap:4px;flex:1}\n.stagebar .pips i{flex:1;height:4px;border-radius:2px;background:var(--track)}\n.stagebar .pips i.done{background:var(--context)}\n.stagebar .pips i.now{background-image:var(--brand-grad)}\n.hero.mini .fig{font-size:40px}\n.hero.mini .sub{font-size:14px}\n.dbar{display:grid;grid-template-columns:1fr 42px;gap:10px;align-items:center;padding:7px 0}\n.dbar+.dbar{border-top:1px solid var(--border)}\n.dbar .lab{font-size:13.5px;line-height:1.3}\n.dbar.you .lab{font-weight:600;color:var(--ink)}\n.dbar .bar i{background:var(--context)}\n.dbar.you .bar i{background:var(--accent)}\n.dbar .pc{text-align:right;font-size:13px;font-weight:600;color:var(--ink-2);font-variant-numeric:tabular-nums}\n.dbar.you .pc{color:var(--accent)}\n.youtag{display:inline-block;font-size:10.5px;font-weight:700;letter-spacing:.04em;\n color:var(--accent-ink);background:var(--accent);border-radius:4px;padding:1px 5px;margin-left:6px;\n vertical-align:1px}\n.twob{display:grid;gap:10px;margin-top:4px}\n.twob .row .lab{font-size:13.5px;margin-bottom:4px}\n.twob .row.you .lab{font-weight:600;color:var(--ink)}\n.twob .row .bar{height:22px;border-radius:6px}\n.twob .row .bar i{background:var(--context);border-radius:6px}\n.twob .row.you .bar i{background:var(--accent)}\n.twob .row .v{font-size:12.5px;color:var(--ink-2);margin-top:4px;font-variant-numeric:tabular-nums}\n.qtr{position:relative;height:34px;margin:10px 0 4px}\n.qtr .track{position:absolute;top:14px;left:0;right:0;height:6px;background:var(--track);border-radius:3px}\n.qtr .box{position:absolute;top:11px;height:12px;background:var(--box);border-radius:3px}\n.qtr .med{position:absolute;top:7px;width:2px;height:20px;background:var(--ink-2)}\n.qtr .me{position:absolute;top:4px;width:3px;height:26px;background:var(--accent);border-radius:2px}\n.qtr .melab{position:absolute;top:-2px;font-size:11px;font-weight:700;color:var(--accent);transform:translateX(-50%)}\n.sup{background:var(--surface-1);border:1px dashed var(--border);border-radius:10px;\n padding:14px 13px;margin-bottom:12px;font-size:13.5px;color:var(--ink-2)}\n";
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

    /* ===================================================================== *
       STAGE_FLOW
       Stage 1 is the compensation module and is untouched: same screens, same
       submit_response call, same results screen. Stages 2-7 come from
       DEF.stages[] and go through submit_stage, which returns that stage's
       interim comparison in the same round trip as the write.
     * ===================================================================== */
    let STAGE = 1, STAGE_RESULT = null, FINAL = null, PROGRESS = null;
    let MODULE = 'full';

    /* A module is a named list of sections over the same definition — core + pay,
       core + AI, core + team. Chosen with data-module on the embed. Same widget,
       same database, same response row: the core is answered once per person, ever,
       so a second module is an update to their existing row rather than a new one. */
    function moduleDef(){
      const m = (DEF.modules || {})[MODULE];
      if (m) return m;
      const full = (DEF.modules || {}).full;
      return full || { sections: (DEF.stages || []).map(x => x.n), title: DEF.title,
                       subtitle: DEF.subtitle };
    }
    const sections   = () => moduleDef().sections || [];
    const sectionIx  = () => sections().indexOf(STAGE);
    const nextSection = () => sections()[sectionIx() + 1];
    const isLastSection = () => sectionIx() === sections().length - 1;
    /* Core and pay share a display group, so the full survey still reads as one
       opening section followed by five — which is what the respondent experiences,
       since nothing is shown between them. */
    function stageCount(){
      const seen = {};
      sections().forEach(n => { const st = stageDef(n) || {};
        seen[st.display_group != null ? 'g' + st.display_group : 's' + n] = 1; });
      return Object.keys(seen).length || 1;
    }
    function stagePos(){
      const seen = [];
      for (const n of sections()){
        const st = stageDef(n) || {};
        const k = st.display_group != null ? 'g' + st.display_group : 's' + n;
        if (seen.indexOf(k) < 0) seen.push(k);
        if (n === STAGE) return seen.length;
      }
      return 1;
    }
    const stageDef = n => (DEF.stages || []).find(x => x.n === n) || null;

    /* Section 1 is now seventeen questions and writes nothing to the server until
       the last of them, so a reload halfway through would throw all of it away. The
       draft is kept on the device only — same place the anonymous token already
       lives, no new identity, nothing sent anywhere — and is cleared the moment the
       server has the answers. */
    const DRAFT_KEY = 'csc_bm_draft';
    function saveDraft(){
      try {
        if (STAGE !== 1) return;
        localStorage.setItem(DRAFT_KEY, JSON.stringify(
          { v: 1, slug: CONFIG.slug, screen: screen, answers: answers, at: Date.now() }));
      } catch (e) {}
    }
    function readDraft(){
      try {
        const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
        if (!d || d.slug !== CONFIG.slug) return null;
        // A month-old draft is a different person's session more often than it is the
        // same person finishing what they started.
        if (Date.now() - (d.at || 0) > 30 * 24 * 3600 * 1000) return null;
        return Object.keys(d.answers || {}).filter(k => k !== '__source').length ? d : null;
      } catch (e) { return null; }
    }
    function clearDraft(){ try { localStorage.removeItem(DRAFT_KEY); } catch (e) {} }

    /* Fire and forget. Analytics must never be able to break a submission, so
       every call is unawaited and every failure is swallowed. */
    function logEvent(kind, extra){
      try {
        rpc('log_event', Object.assign({
          p_survey_slug: CONFIG.slug, p_anon_token: deviceToken(),
          p_kind: kind, p_stage: STAGE }, extra || {})).catch(()=>{});
      } catch (e) {}
    }

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
      // Q must cover every stage, not just stage 1: wire() looks options up by key
      // to decide whether an answer reveals another question, and a missing entry
      // throws on the first click of stage 2.
      (DEF.stages || []).forEach(st => (st.questions || []).forEach(q => Q[q.key] = q));
      SCREENS = [...new Set(DEF.questions.filter(q => q.type !== 'terminator').map(q => q.screen))].sort();
      const p = new URLSearchParams(location.search);
      answers.__source = mount.dataset.src || p.get('src') || p.get('utm_source') || 'organic';
      // `mount` only exists in the embedded build; the standalone HTML falls back
      // to the query string, which is also how you preview a module before publishing.
      MODULE = (typeof mount !== 'undefined' && mount.dataset.module)
               || p.get('module') || 'full';
      if (!(DEF.modules || {})[MODULE]) MODULE = 'full';
      STAGE = sections()[0];
      startedAt = Date.now();

      // Stop and resume. The device token already exists for dedup, so this costs
      // no new identity and no email address. If the visitor has never started,
      // get_progress returns {found:false} and we fall through to the survey.
      try {
        PROGRESS = await rpc('get_progress',
          { p_survey_slug: CONFIG.slug, p_anon_token: deviceToken() });
      } catch (e) { PROGRESS = null; }

      if (PROGRESS && PROGRESS.found && (PROGRESS.stages_completed || []).length){
        clearDraft();
        Object.assign(answers, PROGRESS.answers || {});
        const done = PROGRESS.stages_completed || [];
        const todo = sections().filter(n => done.indexOf(n) < 0);
        // Someone who did the AI module and has come back for pay should not be
        // asked the core again — that is the entire point of one row per person.
        if (todo.length && done.indexOf(1) >= 0 && todo.indexOf(1) < 0){
          STAGE = todo[0]; screen = 0; startedAt = Date.now();
          logEvent('resume');
          return drawScreen();
        }
        return drawResume(todo);
      }
      const draft = readDraft();
      if (draft){
        Object.assign(answers, draft.answers || {});
        answers.__source = draft.answers.__source || answers.__source;
        return drawDraftResume(draft);
      }
      logEvent('stage_view');
      drawScreen();
    })();

    function drawDraftResume(draft){
      const answered = Object.keys(draft.answers || {})
        .filter(k => k !== '__source' && k !== 'base_salary_currency').length;
      render(`
        <div class="title">Pick up where you left off?</div>
        <p class="lede">You'd answered ${answered} question${answered===1?'':'s'}.</p>
        <div class="card">
          <h2>Your answers are still here</h2>
          <p class="narr">They're saved on this device only — nothing has been sent
            anywhere and nothing is tied to your name or your email address.</p>
          <div class="nav" style="margin-top:16px">
            <button class="btn pri" type="button" id="draftGo">Carry on</button>
            <button class="btn" type="button" id="draftNew">Start again</button>
          </div>
        </div>`);
      $('#draftGo').onclick = () => {
        STAGE = 1; screen = Math.min(draft.screen || 0, screensFor(1).length - 1);
        startedAt = Date.now(); logEvent('resume'); drawScreen();
      };
      $('#draftNew').onclick = () => {
        clearDraft();
        Object.keys(answers).forEach(k => { if (k !== '__source') delete answers[k]; });
        STAGE = 1; screen = 0; startedAt = Date.now(); drawScreen();
      };
      window.scrollTo({ top: 0 });
    }

    function drawResume(todo){
      const done = PROGRESS.stages_completed || [];
      const next = (todo && todo[0]) || null;
      const r = (DEF.resume && DEF.resume.copy) || {};
      const nextTitle = next ? (stageDef(next) || {}).title : null;
      logEvent('resume');
      render(`
        <div class="title">Welcome back</div>
        <p class="lede">${next
          ? `You finished ${done.length} of ${stageCount()} sections.`
          : `You've finished all ${stageCount()} sections.`}</p>
        <div class="card">
          <h2>${next ? 'Carry on from &ldquo;' + nextTitle + '&rdquo;?' : 'Everything is saved'}</h2>
          <p class="narr">Your answers are saved on this device. Nothing is tied to your
            name or your email address.</p>
          <div class="nav" style="margin-top:16px">
            ${next ? `<button class="btn pri" type="button" id="resumeGo">Carry on</button>` : ''}
            <button class="btn" type="button" id="resumeResults">Show me my results</button>
          </div>
        </div>`);
      const go = $('#resumeGo');
      if (go) go.onclick = () => { STAGE = next; screen = 0; startedAt = Date.now(); drawScreen(); };
      $('#resumeResults').onclick = () => {
        // The last section they finished that actually shows something.
        const shown = done.filter(n => ((stageDef(n) || {}).results || {}).mode !== 'none');
        replayStage(shown.length ? Math.max.apply(null, shown) : 2);
      };
    }

    /* Re-runs the last completed stage's submit to get its comparison back. The
       upsert makes that idempotent — it rewrites the same answers to the same
       response row — so "show me my results" costs one round trip and no data. */
    async function replayStage(n){
      render(`<div class="card" style="text-align:center;color:var(--muted)">Loading…</div>`);
      STAGE = n;
      const st = stageDef(n) || {};
      const isPay = (st.results || {}).mode === 'full';
      const payload = {};
      (stageDef(n).questions || []).forEach(q => {
        if (answers[q.key] !== undefined) payload[q.key] = answers[q.key]; });
      const r = await rpc('submit_stage', {
        p_survey_slug: CONFIG.slug, p_anon_token: deviceToken(),
        p_stage: n, p_answers: payload, p_duration_ms: 999999 });
      if (!r || r.ok === false) return submitFailed(r);
      if (isPay){
        RESULT = r;
        activeCut = r.cuts.by_level && r.cuts.by_level.available && !r.cuts.by_level.unclassified
          ? 'by_level' : 'by_economy';
        return drawResults();
      }
      STAGE_RESULT = r; FINAL = r.final || null;
      drawStageResults();
    }

    function render(html){ app.innerHTML = html; }

    /* =====================================================================
       survey screens
       ===================================================================== */
    /* Stage 1 keeps its authored screen numbers. Stages 2-7 are chunked at six
       questions a screen — stage 7 has twelve, and twelve at once after six
       sections is where people close the tab. */
    function screensFor(stage){
      const qs = (stageDef(stage) || {}).questions || [];
      // Section 1 carries explicit screen numbers, because its order is the whole
      // point of the design: demographics, then the firmographics, then the pay
      // questions, and only then the comparison. Chunking it by array position would
      // put the payoff back where it was.
      if (qs.length && qs.some(q => q.screen != null)){
        const nums = [...new Set(qs.map(q => q.screen))].sort((a,b) => a - b);
        return nums.map(n => qs.filter(q => q.screen === n));
      }
      const out = [];
      for (let i = 0; i < qs.length; i += 6) out.push(qs.slice(i, i + 6));
      return out;
    }

    function questionsFor(i){
      const sc = screensFor(STAGE)[i] || [];
      return sc.filter(q => !q.show_if ||
        Object.entries(q.show_if).every(([k,v]) => answers[k] === v));
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

    /* DEF.title and DEF.subtitle are the rollback copy for the old widget and still
       describe the compensation-only survey. The staged widget uses its own. */
    function introCopy(){
      if (!(DEF.stages || []).length) return { title: DEF.title, subtitle: DEF.subtitle };
      const m = moduleDef();
      return { title: m.title || DEF.title, subtitle: m.subtitle || DEF.subtitle };
    }

    function stageBar(){
      if (STAGE === 1 && !(DEF.stages || []).length) return '';
      const sd = stageDef(STAGE) || {};
      let pips = '';
      const pos = stagePos();
      for (let i = 1; i <= stageCount(); i++)
        pips += `<i class="${i < pos ? 'done' : i === pos ? 'now' : ''}"></i>`;
      return `<div class="stagebar"><span>Section ${stagePos()} of ${stageCount()}</span>
        <span class="pips">${pips}</span></div>`;
    }

    function drawScreen(){
      // The results footer lives outside #app and persists across renders, so it has
      // to be cleared by hand or stage 1's vintage line trails every later screen.
      if ($('#foot')) $('#foot').innerHTML = '';
      const scr = screensFor(STAGE), qs = questionsFor(screen);
      const first = screen === 0, last = screen === scr.length - 1;
      const sd = stageDef(STAGE) || {};
      const veryFirst = STAGE === sections()[0] && first;
      render(`
        ${veryFirst ? `<h1>${introCopy().title}</h1>
           <p class="lede">${introCopy().subtitle}</p>` : ''}
        ${!veryFirst && first ? `<div class="title">${sd.title}</div>
           <p class="lede">${sd.subtitle || ''}</p>` : ''}
        ${stageBar()}
        <div class="prog" role="progressbar" aria-valuenow="${screen+1}" aria-valuemax="${scr.length}">
          ${scr.map((_,i)=>`<i class="${i<=screen?'on':''}"></i>`).join('')}</div>
        <div class="card">${qs.map(fieldHTML).join('')}</div>
        <div class="hp"><label>Leave this empty<input type="text" id="hp" tabindex="-1" autocomplete="off"></label></div>
        <div class="nav">
          ${screen>0?`<button class="btn" type="button" id="back">Back</button>`:''}
          <button class="btn pri" type="button" id="next">
            ${last ? (STAGE === 1 ? 'See my comparison' : 'See how I compare') : 'Continue'}</button>
        </div>
        ${!veryFirst ? `<p class="consent">${(DEF.resume && DEF.resume.copy &&
            DEF.resume.copy.on_leave) || 'Saved on this device — you can come back any time.'}</p>` : ''}
        ${veryFirst?`<p class="consent">${DEF.consent_text}</p>`:''}`);
      wire();
      qs.forEach(q => logEvent('question_view', { p_question: q.key }));
      window.scrollTo({ top: 0 });
    }

    function wire(){
      // Save on every answer, not just on Continue. Saving only at the screen
      // boundary loses whatever was answered on the current screen, which is the
      // most likely thing to be lost and the most annoying to re-enter.
      const touch = () => saveDraft();
      app.querySelectorAll('[data-q]').forEach(b => b.onclick = () => {
        answers[b.dataset.q] = b.dataset.v; clearErr(b.dataset.q); touch();
        if (revealsSomething(b.dataset.q)) drawScreen();
        else { app.querySelectorAll(`[data-q="${b.dataset.q}"]`).forEach(x=>{
          x.classList.toggle('sel', x===b); x.setAttribute('aria-pressed', x===b); }); }
      });
      app.querySelectorAll('[data-qm]').forEach(b => b.onclick = () => {
        const k = b.dataset.qm, set = new Set(answers[k] || []);
        set.has(b.dataset.v) ? set.delete(b.dataset.v) : set.add(b.dataset.v);
        answers[k] = [...set]; touch();
        b.classList.toggle('sel'); b.setAttribute('aria-pressed', b.classList.contains('sel'));
      });
      app.querySelectorAll('[data-qs]').forEach(el => el.onchange = () => {
        answers[el.dataset.qs] = el.value || undefined; touch();
        clearErr(el.dataset.qs);
        if (el.dataset.qs === 'country') answers.base_salary_currency = guessCurrency();
        drawScreen();
      });
      app.querySelectorAll('[data-qn]').forEach(el => el.oninput = () => {
        answers[el.dataset.qn] = el.value === '' ? undefined : Number(el.value); touch(); clearErr(el.dataset.qn); });
      app.querySelectorAll('[data-qc]').forEach(el => el.oninput = () => {
        answers[el.dataset.qc] = el.value === '' ? undefined : Number(el.value); touch(); clearErr(el.dataset.qc);
        const z = app.querySelector(`[data-qz="${el.dataset.qc}"]`); if (z) z.checked = false; });
      app.querySelectorAll('[data-qz]').forEach(el => el.onchange = () => {
        const k = el.dataset.qz;
        answers[k] = el.checked ? 0 : undefined; touch();
        const i = app.querySelector(`[data-qc="${k}"]`); if (i) i.value = el.checked ? 0 : '';
        clearErr(k); });
      app.querySelectorAll('[data-qt]').forEach(el => el.oninput = () => {
        answers[el.dataset.qt] = el.value || undefined; touch(); clearErr(el.dataset.qt); });
      const cur = app.querySelector('[data-cur]');
      if (cur) cur.onchange = () => { answers.base_salary_currency = cur.value;
        app.querySelectorAll('[data-curecho]').forEach(e => e.textContent = cur.value); };
      if ($('#back')) $('#back').onclick = () => { screen--; drawScreen(); };
      $('#next').onclick = onNext;
    }

    /* Module A put `reveals` on the OPTION ('Something else' reveals a text box).
       The staged questions put it on the QUESTION (courses_taken reveals two
       follow-ups), so the original check missed them: the follow-ups counted as
       visible for validation but were never rendered, and Continue then failed with
       no error anywhere on screen. Rather than depend on where `reveals` was
       written, ask the only question that matters — does anything in this stage
       branch on this key. */
    function revealsSomething(key){
      if ((Q[key] && Q[key].options || []).some(o => o.reveals)) return true;
      if (Q[key] && Q[key].reveals) return true;
      const pool = STAGE === 1 ? (DEF.questions || [])
                               : ((stageDef(STAGE) || {}).questions || []);
      return pool.some(q => q.show_if && Object.keys(q.show_if).indexOf(key) >= 0);
    }

    function showErr(k, msg){ const e = app.querySelector(`[data-err="${k}"]`);
      if (e){ e.textContent = msg; e.classList.add('on'); return; }
      // No slot for this error means the question is required but not on screen —
      // a branching bug, not a respondent mistake. Say so rather than leaving a
      // Continue button that does nothing, which is what the reveal bug produced.
      let box = app.querySelector('#stuck');
      if (!box){
        box = document.createElement('div');
        box.id = 'stuck'; box.className = 'err on';
        (app.querySelector('.nav') || app).insertAdjacentElement('beforebegin', box);
      }
      box.textContent = 'Something went wrong with this question. Please reload the page — your answers are saved.';
      if (console && console.warn) console.warn('no error slot for', k, msg);
    }
    function clearErr(k){ const e = app.querySelector(`[data-err="${k}"]`);
      if (e) e.classList.remove('on'); }

    function onNext(){
      const qs = questionsFor(screen);
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
      qs.forEach(q => { if (answers[q.key] !== undefined) logEvent('question_answer', { p_question: q.key }); });
      if (screen < screensFor(STAGE).length - 1){ screen++; saveDraft(); return drawScreen(); }
      logEvent('stage_complete');
      submitSection();
    }

    /* One place that decides how a finished section is written and what comes back:
         core  -> submit_core, no results, straight on
         pay   -> submit_stage, the full compensation screen
         rest  -> submit_stage, hero and up to two cards                        */
    function submitSection(){
      const st = stageDef(STAGE) || {};
      const mode = (st.results || {}).mode;
      if (st.is_core) return submitCore();
      return submitStage(mode === 'full');
    }

    /* =====================================================================
       submit
       ===================================================================== */
    async function submitCore(){
      const btn = $('#next');
      btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Saving…';
      const payload = {};
      ((stageDef(1) || {}).questions || []).forEach(q => {
        const shown = !q.show_if ||
          Object.entries(q.show_if).every(([k,v]) => answers[k] === v);
        if (shown && answers[q.key] !== undefined) payload[q.key] = answers[q.key];
      });
      try {
        const r = await rpc('submit_core', {
          p_survey_slug: CONFIG.slug,
          p_anon_token: deviceToken(),
          p_answers: payload,
          p_source: answers.__source,
          p_module: MODULE,
          p_referrer: document.referrer || null,
          p_duration_ms: Date.now() - startedAt,
          p_honeypot: ($('#hp') && $('#hp').value) || null,
          p_ip: null
        });
        if (!r || r.ok === false) return submitFailed(r);
        clearDraft();                       // the server has the core now
        // No results screen here, by design. In every module the payoff is one
        // section away, and stopping to say "here is your tenure" would spend
        // attention on the least interesting thing we know about them.
        const nx = nextSection();
        if (!nx) return drawStopped();
        STAGE = nx; screen = 0; startedAt = Date.now();
        drawScreen();
      } catch (e){ submitFailed({ error: 'network', message: e.message }); }
    }

    /* The old all-in-one submit_response path. Nothing calls it in the module flow;
       it stays so the legacy entry point is still exercised and can be reverted to. */
    async function submitLegacy(){
      const btn = $('#next');
      btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Working out your comparison…';
      const payload = {};
      // Section 1 now carries the firmographics too, so the payload is built from
      // the stage, not from the legacy DEF.questions list — which still holds the
      // old thirteen and is only there so an older widget.js can be rolled back to.
      ((stageDef(1) || {}).questions || DEF.questions || []).forEach(q => {
        if (q.type === 'terminator') return;
        const shown = !q.show_if ||
          Object.entries(q.show_if).every(([k,v]) => answers[k] === v);
        if (shown && answers[q.key] !== undefined) payload[q.key] = answers[q.key];
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
        clearDraft();          // the server has it now; the device copy is redundant
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
       stages 2-7: submit and interim comparison
       ===================================================================== */
    async function submitStage(isPay){
      const btn = $('#next');
      btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Comparing…';
      const payload = {};
      (stageDef(STAGE).questions || []).forEach(q => {
        // A question hidden by its show_if was never asked, so it must not be sent.
        const shown = !q.show_if ||
          Object.entries(q.show_if).every(([k,v]) => answers[k] === v);
        if (shown && answers[q.key] !== undefined) payload[q.key] = answers[q.key];
      });
      try {
        const r = await rpc('submit_stage', {
          p_survey_slug: CONFIG.slug, p_anon_token: deviceToken(),
          p_stage: STAGE, p_answers: payload, p_duration_ms: Date.now() - startedAt });
        if (!r || r.ok === false) return submitFailed(r);
        if (isPay){
          // Same payload shape submit_response returned, so the tested compensation
          // screen renders it without knowing anything changed.
          RESULT = r;
          activeCut = r.cuts.by_level && r.cuts.by_level.available && !r.cuts.by_level.unclassified
            ? 'by_level' : 'by_economy';
          return drawResults();
        }
        STAGE_RESULT = r; FINAL = r.final || null;
        drawStageResults();
      } catch (e){ submitFailed({ error: 'network', message: e.message }); }
    }

    /* ---- one card, dispatched on the style the definition declared ---------- */
    function pct(n){ return Math.max(0, Math.min(100, Math.round(n))); }

    function cardBasis(c){
      const b = c.basis || {};
      return `<p class="basis-mini">${b.label || ''}${c.n != null ? ' · n=' + c.n : ''}${
        b.suppressed && b.suppressed_from
          ? ' · not enough ' + midSentence(b.suppressed_from) + ' yet' : ''}</p>`;
    }

    function suppressedCard(c){
      return `<div class="sup"><b>${c.title || ''}</b><br>
        Not enough responses to show this yet${c.needed ? ' — ' + c.needed + ' more needed' : ''}.
        It unlocks as more people take the survey.</div>`;
    }

    function styleCard(c, isHero){
      if (!c) return '';
      if (c.available === false) return suppressedCard(c);
      const head = `<h2>${c.title || ''}</h2>${cardBasis(c)}`;

      if (c.style === 'share_yes'){
        const mine = c.your_answer === 'yes';
        return `<div class="card ${isHero?'hero mini':''}">
          ${isHero ? `<div class="fig">${c.share_yes}%</div>
            <div class="sub">${fillHeadline(c)}</div>${cardBasis(c)}`
            : `${head}<div class="kpis two">
               <div class="kpi"><div class="v">${c.share_yes}%</div><div class="k">of your peers said yes</div>
                 <div class="mine">You: ${mine ? 'yes' : 'no'}</div></div>
               <div class="kpi"><div class="v">${100 - c.share_yes}%</div><div class="k">said no</div></div>
            </div>`}</div>`;
      }

      if (c.style === 'distribution_choice'){
        const rows = (c.distribution || []).map(d => `
          <div class="dbar ${d.is_you?'you':''}">
            <div><div class="lab">${d.label}${d.is_you?'<span class="youtag">YOU</span>':''}</div>
              <div class="bar"><i style="width:${pct(d.share)}%"></i></div></div>
            <div class="pc">${d.share}%</div></div>`).join('');
        return `<div class="card">${head}${rows}
          ${c.share_your_answer != null && c.your_answer_label ? `<p class="narr">
            <b>${c.share_your_answer}%</b> of your peers answered the same as you.</p>` : ''}</div>`;
      }

      if (c.style === 'count_vs_peers'){
        const max = Math.max(c.total_options, c.your_count, c.p75_count);
        const X = v => (v / max) * 100;
        return `<div class="card ${isHero?'hero mini':''}">
          ${isHero ? `<div class="fig">${c.your_count}<span style="font-size:22px;color:var(--ink-2)">
             /${c.total_options}</span></div>
            <div class="sub">${fillHeadline(c)}</div>` : head}
          <div class="qtr">
            <div class="track"></div>
            <div class="box" style="left:${X(c.p25_count)}%;width:${X(c.p75_count)-X(c.p25_count)}%"></div>
            <div class="med" style="left:${X(c.median_count)}%"></div>
            <div class="me" style="left:${X(c.your_count)}%"></div>
            <div class="melab" style="left:${X(c.your_count)}%">you</div>
          </div>
          <p class="narr">Middle half of your peers: <b>${c.p25_count}&ndash;${c.p75_count}</b>.
            Median <b>${c.median_count}</b>. You're higher than <b>${c.percentile}%</b> of them.</p>
          ${isHero ? cardBasis(c) : ''}
          <p class="foot" style="margin-top:10px">Counts people who picked at least one.</p></div>`;
      }

      if (c.style === 'distribution_numeric'){
        const rows = (c.buckets || []).map(b => `
          <div class="dbar ${b.is_you?'you':''}">
            <div><div class="lab">${b.label} year${b.label==='1'?'':'s'}${b.is_you?'<span class="youtag">YOU</span>':''}</div>
              <div class="bar"><i style="width:${pct(b.share)}%"></i></div></div>
            <div class="pc">${b.share}%</div></div>`).join('');
        return `<div class="card ${isHero?'hero mini':''}">
          ${isHero ? `<div class="fig">${c.your_value}<span style="font-size:22px;color:var(--ink-2)">
              yr${c.your_value===1?'':'s'}</span></div>
            <div class="sub">${fillHeadline(c)}</div>` : head}
          <div style="margin-top:14px">${rows}</div>
          <p class="narr">Median <b>${c.median}</b>. You're longer-serving than
            <b>${c.percentile}%</b> of your peers.</p>
          ${isHero ? cardBasis(c) : ''}</div>`;
      }

      if (c.style === 'gap_vs_peers'){
        const g = c.gaps || [];
        if (!g.length) return `<div class="card">${head}
          <p class="narr">Nothing your peers are doing that you aren't.</p></div>`;
        return `<div class="card">${head}
          ${g.map(x => `<div class="gap-row">
            <div><div>${x.label}</div><div class="bar"><i style="width:${pct(x.share)}%"></i></div></div>
            <div class="gap-pct">${x.share}%</div></div>`).join('')}</div>`;
      }
      return '';
    }

    /* Headlines carry {placeholders} that name keys in the payload. The generator
       validates every one of them against the style's contract, so a missing value
       here means the payload changed and the build check was skipped. */
    function fillHeadline(c){
      const h = c.headline || '';
      return h.replace(/\{(\w+)\}/g, (m, k) => c[k] != null ? c[k] : '');
    }

    function drawStageResults(){
      const cuts = STAGE_RESULT.results || {};
      const res = cuts[activeCut] || cuts.by_level || cuts.by_economy || {};
      const alt = activeCut === 'by_level' ? 'by_economy' : 'by_level';
      const sd = stageDef(STAGE) || {};
      const last = isLastSection();
      const isFull = MODULE === 'full';
      const cutOk = k => cuts[k] && cuts[k].hero && cuts[k].hero.available !== false;

      render(`
        <div class="title">${last && isFull ? "Here's the whole picture" : sd.title}</div>
        ${stageBar()}
        <div class="seg" role="group">
          ${(DEF.display_cuts||[]).map(c => `<button data-scut="${c.key}"
            aria-pressed="${activeCut===c.key}" ${cutOk(c.key)?'':'disabled'}>${c.toggle_label}</button>`).join('')}
        </div>
        ${styleCard(res.hero, true)}
        ${(res.cards || []).map(c => styleCard(c, false)).join('')}
        ${last && isFull ? finalHTML() : ''}
        ${last ? (isFull ? '' : crossSellHTML()) : continueHTML()}
        ${last ? unlockHTML(null) : ''}
        ${last ? asksHTML() : ''}
        <p class="foot" id="sfoot"></p>`);

      if ($('#foot')) $('#foot').innerHTML = '';
      $('#sfoot').innerHTML = `No comparison is shown on fewer than
        ${STAGE_RESULT.threshold || 30} responses. Individual answers are never published
        or attributed. Sections you've finished: ${(STAGE_RESULT.stages_completed||[]).join(', ')}.`;

      app.querySelectorAll('[data-scut]').forEach(b => b.onclick = () => {
        activeCut = b.dataset.scut; drawStageResults(); window.scrollTo({top:0,behavior:'smooth'}); });
      const go = $('#stageGo');
      if (go) go.onclick = () => {
        logEvent('continue_click');
        STAGE = nextSection(); screen = 0; startedAt = Date.now(); drawScreen(); };
      const stop = $('#stageStop');
      if (stop) stop.onclick = () => { logEvent('leave_click'); drawStopped(); };
      wireResults();
      logEvent('results_view');
      window.scrollTo({ top: 0 });
    }

    function continueHTML(){
      const next = stageDef(nextSection()) || {};
      return `<div class="card">
        <h2>Next: ${next.title || ''}</h2>
        <p class="narr">${next.subtitle || ''} About
          ${Math.max(1, Math.round((next.estimated_seconds||60)/60))} minute${
          (next.estimated_seconds||60) >= 90 ? 's' : ''}.</p>
        <div class="nav" style="margin-top:14px">
          <button class="btn pri" type="button" id="stageGo">Keep going</button>
          <button class="btn" type="button" id="stageStop">I'm done for now</button>
        </div></div>`;
    }

    function drawStopped(){
      if ($('#foot')) $('#foot').innerHTML = '';
      render(`<div class="title">Saved</div>
        <div class="card">
          <h2>You can pick this up any time</h2>
          <p class="narr">Your answers are saved on this device. Come back to this page and
            you'll carry on from where you stopped. Nothing is tied to your name or your
            email address.</p>
        </div>
        ${unlockHTML(null)}
        ${asksHTML()}`);
      wireResults();
      window.scrollTo({ top: 0 });
    }

    /* ---- the cross-stage cards ---------------------------------------------- */
    /* No cut toggle on these, deliberately. Within the IC band, peers who took a
       course earn 20% more; pooled across everyone the same card reads 8% less,
       because execs earn most and take fewest courses. Letting someone flip a
       toggle and watch the answer change sign would cost more trust than a
       suppressed card does. */
    function finalHTML(){
      const cards = FINAL || [];
      if (!cards.length) return '';
      const fs = DEF.final_screen || {};
      const body = cards.map(c => {
        if (c.available === false) return `<div class="sup"><b>${c.title}</b><br>
          ${c.message || 'Not enough responses in your group yet to split this fairly.'}</div>`;
        const max = Math.max(c.lo.median, c.hi.median) || 1;
        const row = x => `<div class="row ${x.is_you?'you':''}">
          <div class="lab">${x.label}${x.is_you?'<span class="youtag">YOU</span>':''}</div>
          <div class="bar"><i style="width:${pct(x.median/max*100)}%"></i></div>
          <div class="v">${usd(x.median)} median · n=${x.n}</div></div>`;
        return `<div class="card"><h2>${c.title}</h2>
          <p class="basis-mini">${(c.basis||{}).label || ''} · base salary</p>
          <div class="twob">${row(c.lo)}${row(c.hi)}</div>
          <p class="narr">Median base salary is ${c.gap_pct >= 0
            ? `<b>${c.gap_pct}% higher</b>` : `<b>${Math.abs(c.gap_pct)}% lower</b>`}
            among ${midSentence(c.hi.label)}.</p>
          ${c.caveat ? `<p class="foot" style="margin-top:8px">${c.caveat}</p>` : ''}</div>`;
      }).join('');
      return `<div class="note"><b>${fs.headline || "Here's the whole picture"}</b><br>
        ${fs.intro || ''}</div>${body}`;
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

      ${continuePromptHTML()}
      ${unlockHTML(otherCut)}
      ${asksHTML()}`);

      $('#foot').innerHTML = `${RESULT.vintage ? RESULT.vintage + '. ' : ''}No comparison is shown on fewer than
        ${RESULT.threshold} responses. Individual answers are never published or attributed.
        Figures normalised to US dollars.`;
      wireResults();
    }

    /* The offer to carry on, shown under the full stage 1 results and never above
       them. Stage 1's six cards are all still there: weakening the one screen that
       converts, in order to manufacture a reason to continue, would break the promise
       the landing page makes. The reason to continue is the cross-stage cards at the
       end, which are genuinely impossible from the pay questions alone. */
    function continuePromptHTML(){
      const nx = nextSection();
      if (!nx) return crossSellHTML();      // end of a short module
      const cp = (stageDef(STAGE) || {}).continue_prompt;
      const nd = stageDef(nx) || {};
      const left = sections().length - sectionIx() - 1;
      return `<div class="card" style="border-image:var(--brand-grad) 1;border-image-slice:1;border-width:0 0 0 3px">
        <h2>${cp ? cp.headline : 'Next: ' + (nd.title || '')}</h2>
        <p class="narr">${cp ? cp.body : (nd.subtitle || '')}</p>
        <div class="nav" style="margin-top:14px">
          <button class="btn pri" type="button" id="s1go">${cp ? cp.cta : 'Keep going'}</button>
          ${left > 1 ? '' : `<button class="btn" type="button" id="s1stop">No thanks</button>`}
        </div></div>`;
    }

    /* End of a short module. The warmest audience this tool ever has is someone who
       has just been given a comparison, and the next module costs them only its own
       questions because the core is already answered. */
    function crossSellHTML(){
      const mods = DEF.modules || {};
      const done = (STAGE_RESULT && STAGE_RESULT.stages_completed)
                || (PROGRESS && PROGRESS.stages_completed) || sections();
      const offers = Object.keys(mods)
        .filter(k => k !== MODULE && k !== 'full')
        .map(k => ({ key: k, m: mods[k], topic: (mods[k].sections || [])[1] }))
        .filter(o => o.topic && done.indexOf(o.topic) < 0)
        .slice(0, 2);
      if (!offers.length) return '';
      return `<div class="card" style="border-image:var(--brand-grad) 1;border-image-slice:1;border-width:0 0 0 3px">
        <h2>One more comparison?</h2>
        <p class="narr">You've already answered the questions about you, so these are
          shorter — just the topic itself.</p>
        ${offers.map(o => `<button class="btn" type="button" data-mod="${o.key}"
            style="width:100%;text-align:left;margin-top:9px">
            <b>${o.m.title}</b><br>
            <span style="font-size:13px;font-weight:400;color:var(--ink-2)">${
              ((stageDef(o.topic) || {}).questions || []).length} questions · ${o.m.promise || ''}</span>
          </button>`).join('')}
      </div>`;
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
      const s1 = $('#s1go');
      if (s1) s1.onclick = () => {
        const nx = nextSection();
        if (!nx) return;
        logEvent('continue_click');
        STAGE = nx; screen = 0; startedAt = Date.now(); drawScreen();
      };
      const s1s = $('#s1stop');
      if (s1s) s1s.onclick = () => { logEvent('leave_click'); drawStopped(); };
      app.querySelectorAll('[data-mod]').forEach(b => b.onclick = () => {
        // Switching module in place: same page, same row, straight into the topic.
        MODULE = b.dataset.mod;
        const done = (STAGE_RESULT && STAGE_RESULT.stages_completed)
                  || (RESULT && RESULT.stages_completed) || [1];
        const todo = sections().filter(n => done.indexOf(n) < 0);
        STAGE = todo.length ? todo[0] : sections()[sections().length - 1];
        screen = 0; startedAt = Date.now();
        logEvent('continue_click');
        drawScreen();
      });
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
        const panel = $('#askPanel').checked;

        // The database first, HubSpot second. Before this the only place the address
        // went was a HubSpot post that isn't configured yet, so the screen said
        // "we've recorded your request" while recording nothing. Blockers stop
        // api.hsforms.com often enough that this would still be the right order once
        // HubSpot is wired up.
        let rec = null;
        try {
          rec = await rpc('record_report_request', {
            p_survey_slug: CONFIG.slug, p_anon_token: deviceToken(),
            p_email: email, p_panel_opt_in: panel, p_source: answers.__source });
        } catch (e) { rec = null; }

        if (!rec || rec.ok === false){
          const e = app.querySelector('[data-err="email"]');
          e.textContent = rec && rec.error === 'bad_email'
            ? "That address doesn't look right — could you check it?"
            : rec && rec.error === 'rate_limited'
              ? "We already have that request. Nothing else to do."
              : 'We could not save that just now. Please try again in a moment.';
          e.classList.add('on');
          send.disabled = false; send.innerHTML = 'Send me the report';
          return;
        }

        const ok = await sendToHubSpot(email, panel);
        try {
          rpc('mark_report_request_delivered', {
            p_survey_slug: CONFIG.slug, p_anon_token: deviceToken(),
            p_delivered: !!ok }).catch(()=>{});
        } catch (e) {}

        const done = $('#askDone');
        done.style.display = 'block';
        // True whether or not HubSpot took it, because the database has it either way.
        done.innerHTML = `<b>Done.</b> We'll email the report to ${email} when it publishes.`;
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
