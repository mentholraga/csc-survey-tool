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
       data-module="pay"        which module to run (default: full)
       data-survey="slug"       which survey to load (default: csc-compensation-2026)
       data-hide-title          hide the survey title (when the page has its own)

   Report request: put HubSpot's form embed code directly below the widget,
   inside this container. The widget keeps it hidden while someone is answering
   and reveals it when they reach their results:
       <div data-csc-report hidden> …HubSpot embed code… </div>
   The email address goes to HubSpot only. It never reaches the survey database.

   Requires 16_fixes.sql.
   ===================================================================== */
(function () {
  'use strict';
  var CSS = ":host{all:initial;display:block;font:16px/1.5 system-ui,-apple-system,'Segoe UI',sans-serif;color-scheme:light dark;}\n:host *{box-sizing:border-box}\n\n:host{\n  /* ---------------------------------------------------------------------\n     CSC brand palette, validated with the dataviz palette checker.\n     Accent must carry a data mark, so it needs >=3:1 against the surface it\n     sits on and a real separation from the de-emphasis gray:\n       light  #5036d5  contrast 7.4:1 on white, CVD dE 23.0 protan\n       dark   #6251ef  brand violet stepped to L 0.549 (inside the 0.48-0.67\n                       dark band), contrast >=3:1, CVD dE 22.5 protan\n     Rejected: #ff4dd8 sits at L 0.714, outside the dark band, and white text\n     on it is only 2.87:1. #00aeed / #56dedb / #f68af9 are all under 3:1 on the\n     light surface. They are used decoratively below, never for data.\n     --------------------------------------------------------------------- */\n  --plane:#f9f8f5; --surface-1:#ffffff;\n  --ink:#09100f; --ink-2:#4a5150; --muted:#7c8280;\n  --grid:#e6e4df; --axis:#c9c6bf; --border:#e4e1da;\n  --accent:var(--brand-2,#5036d5); --accent-ink:#ffffff; --context:#7c8280;\n  --accent-hover:var(--brand-2-hover,#3f28b8); --input-border:#cfcac0;\n  --track:#e6e4df; --box:#c9c6bf; --bad:#d03b3b;\n  --brand-pink:var(--brand-1,#ff4dd8); --brand-teal:#56dedb; --brand-blue:#00aeed;\n  --brand-grad:linear-gradient(90deg,var(--brand-1,#ff4dd8) 0%,var(--brand-2,#5036d5) 100%);\n  /* Fonts and brand colours come from the host page's variables (--sans, --serif,\n     --brand-1, --brand-2) when it defines them, so a community page sets its\n     brand once and the survey follows. The values after the commas are CSC's. */\n  --w-sans:var(--sans,'Poppins','Poppins Fallback',system-ui,-apple-system,'Segoe UI',sans-serif);\n  --w-serif:var(--serif,'IvyJournal','Times New Roman',serif);\n}\n@media (prefers-color-scheme:dark){:host(:not([data-theme=light])){\n  --plane:#09100f; --surface-1:#121a19;\n  --ink:#f9f8f5; --ink-2:#c2c7c5; --muted:#868c8a;\n  --grid:#1e2423; --axis:#2c3332; --border:rgba(249,248,245,0.12);\n  --accent:#6251ef; --accent-ink:#ffffff; --context:#868c8a;\n  --track:#1e2423; --box:#2c3332; --bad:#e66767; --input-border:#3a4241;\n  --brand-grad:linear-gradient(90deg,#ff4dd8 0%,#6f62ff 100%);\n}}\n:host([data-theme=dark]){\n  --plane:#09100f; --surface-1:#121a19;\n  --ink:#f9f8f5; --ink-2:#c2c7c5; --muted:#868c8a;\n  --grid:#1e2423; --axis:#2c3332; --border:rgba(249,248,245,0.12);\n  --accent:#6251ef; --accent-ink:#ffffff; --context:#868c8a;\n  --track:#1e2423; --box:#2c3332; --bad:#e66767; --input-border:#3a4241;\n  --brand-grad:linear-gradient(90deg,#ff4dd8 0%,#6f62ff 100%);\n}\n*{box-sizing:border-box}\n.root{margin:0;background:var(--plane);color:var(--ink);\n font:16px/1.55 'Poppins','Poppins Fallback',system-ui,-apple-system,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased}\n.wrap{max-width:560px;margin:0 auto;padding:16px 16px 64px}\n.brand{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}\n.brand b{font-size:12px;letter-spacing:.08em;font-weight:600}\n.brand .dot{display:inline-block;width:9px;height:9px;border-radius:50%;\n background-image:var(--brand-grad);margin-right:7px}\n.tt{background:transparent;border:1px solid var(--border);color:var(--ink-2);border-radius:7px;\n font:inherit;font-size:12px;padding:5px 9px;cursor:pointer}\n.title{font-size:24px;font-weight:700;line-height:1.22;margin:0 0 8px;letter-spacing:-.015em}\n.lede{color:var(--ink-2);font-size:15px;margin:0 0 20px}\n.card{background:var(--surface-1);border:1px solid var(--border);border-radius:12px;\n padding:18px 16px;margin-bottom:12px}\n.prog{display:flex;gap:5px;margin-bottom:18px}\n.prog i{flex:1;height:4px;border-radius:2px;background:var(--track);transition:background .2s}\n.prog i.on{background-image:var(--brand-grad)}\n.q{margin-bottom:26px}\n.q:last-child{margin-bottom:8px}\nlabel.qlab{display:block;font-size:16px;font-weight:600;margin-bottom:4px;line-height:1.35}\n.help{font-size:13px;color:var(--muted);margin-bottom:10px}\n.opts{display:grid;gap:7px}\n.opt{display:flex;align-items:flex-start;gap:10px;border:1px solid var(--border);border-radius:9px;\n padding:11px 12px;cursor:pointer;background:transparent;font:inherit;text-align:left;\n color:var(--ink);width:100%;line-height:1.35}\n.opt:hover{border-color:var(--accent)}\n.opt[aria-pressed=true],.opt.sel{border-color:var(--accent);background:color-mix(in oklab,var(--accent) 8%,transparent)}\n.opt .tick{flex:0 0 18px;height:18px;border:1.5px solid var(--axis);border-radius:50%;margin-top:1px}\n.opt.multi .tick{border-radius:5px}\n.opt.sel .tick{border-color:var(--accent);background:var(--accent);\n box-shadow:inset 0 0 0 3px var(--surface-1)}\ninput[type=text],input[type=number],input[type=email],select{\n width:100%;font:inherit;padding:12px;border:1px solid var(--border);border-radius:9px;\n background:var(--surface-1);color:var(--ink)}\ninput:focus,select:focus,.opt:focus-visible{outline:2px solid var(--accent);outline-offset:1px}\n.money{display:grid;grid-template-columns:112px 1fr;gap:8px}\n.zero{margin-top:9px;font-size:13.5px;color:var(--ink-2);display:flex;gap:8px;align-items:center;cursor:pointer}\n.err{color:var(--bad);font-size:13px;margin-top:7px;display:none}\n.err.on{display:block}\n.nav{display:flex;gap:8px;margin-top:6px}\n.btn{flex:1;font:inherit;font-size:15px;font-weight:600;padding:14px;border-radius:10px;cursor:pointer;\n border:1px solid var(--border);background:transparent;color:var(--ink)}\n.btn.pri{background:var(--accent);color:var(--accent-ink);border-color:transparent}\n.btn:disabled{opacity:.5;cursor:default}\n.hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}\n.consent{font-size:12.5px;color:var(--muted);margin-top:16px;line-height:1.55}\n\n/* ---------- results ---------- */\n.hero{background:var(--surface-1);border:1px solid var(--border);border-radius:12px;\n padding:22px 18px;margin-bottom:12px;border-top:3px solid transparent;\n border-image:var(--brand-grad) 1;border-image-slice:1;border-width:3px 0 0 0}\n.hero .fig{font-size:54px;line-height:1;font-weight:700;letter-spacing:-.02em;color:var(--accent)}\n.hero .sub{color:var(--ink-2);font-size:15px;margin-top:9px}\n.hero .sub b{color:var(--ink)}\n.hero .fx{color:var(--muted);font-size:12.5px;margin-top:11px;padding-top:11px;border-top:1px solid var(--border)}\n.seg{display:flex;gap:5px;margin-bottom:12px}\n.seg button{flex:1;font:inherit;font-size:13px;padding:10px;border-radius:8px;cursor:pointer;\n border:1px solid var(--border);background:var(--surface-1);color:var(--ink-2)}\n.seg button[aria-pressed=true]{background:var(--accent);color:var(--accent-ink);border-color:transparent;font-weight:600}\n.seg button:disabled{opacity:.45;cursor:not-allowed}\n.note{background:var(--surface-1);border:1px solid var(--border);border-radius:10px;\n padding:12px 13px;margin-bottom:12px;font-size:13px;color:var(--ink-2)}\n.note b{color:var(--ink)}\n.card h2{font-size:14px;margin:0 0 3px}\n.card .basis-mini{font-size:11.5px;color:var(--muted);margin:0 0 14px}\n.narr{font-size:14px;color:var(--ink-2);margin:14px 0 0}\n.narr b{color:var(--ink);font-weight:600}\nsvg{display:block;width:100%;overflow:visible}\ntext{font:11px 'Poppins','Poppins Fallback',system-ui,-apple-system,'Segoe UI',sans-serif;fill:var(--muted)}\ntext.you{fill:var(--accent);font-weight:700;font-size:12px}\ntext.val{fill:var(--ink-2);font-variant-numeric:tabular-nums}\n.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}\n.kpis.two{grid-template-columns:repeat(2,1fr)}\n.kpi{border:1px solid var(--border);border-radius:9px;padding:12px 9px;text-align:center}\n.kpi .v{font-size:26px;font-weight:700;line-height:1.1}\n.kpi .k{font-size:11px;color:var(--muted);margin-top:5px;line-height:1.3}\n.kpi .mine{font-size:10.5px;margin-top:6px;padding-top:6px;border-top:1px solid var(--border);color:var(--ink-2)}\n.gap-row{display:grid;grid-template-columns:1fr 46px;gap:10px;align-items:center;padding:8px 0}\n.gap-row+.gap-row{border-top:1px solid var(--border)}\n.bar{height:7px;background:var(--track);border-radius:4px;overflow:hidden;margin-top:5px}\n.bar i{display:block;height:100%;background:var(--accent);border-radius:4px}\n.gap-pct{text-align:right;font-size:13px;font-weight:600;color:var(--ink-2);font-variant-numeric:tabular-nums}\ndetails{margin-top:13px;border-top:1px solid var(--border);padding-top:10px}\nsummary{font-size:12px;color:var(--muted);cursor:pointer}\ntable{width:100%;border-collapse:collapse;margin-top:9px;font-size:12.5px}\nth,td{text-align:left;padding:5px 0;border-bottom:1px solid var(--border);font-variant-numeric:tabular-nums}\nth{color:var(--muted);font-weight:600}\n.foot{color:var(--muted);font-size:11.5px;margin-top:18px;line-height:1.6}\n.tipbox{position:fixed;pointer-events:none;opacity:0;transition:opacity .1s;background:var(--ink);\n color:var(--plane);padding:6px 9px;border-radius:6px;font-size:12px;z-index:99;white-space:nowrap}\n.spin{display:inline-block;width:15px;height:15px;border:2px solid rgba(255,255,255,.35);\n border-top-color:#fff;border-radius:50%;animation:sp .7s linear infinite;vertical-align:-2px}\n@keyframes sp{to{transform:rotate(360deg)}}\n.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}\n\n/* ---------- stage flow ---------- */\n.stagebar{display:flex;align-items:center;gap:8px;margin-bottom:14px;font-size:12px;color:var(--muted)}\n.stagebar .pips{display:flex;gap:4px;flex:1}\n.stagebar .pips i{flex:1;height:4px;border-radius:2px;background:var(--track)}\n.stagebar .pips i.done{background:var(--context)}\n.stagebar .pips i.now{background-image:var(--brand-grad)}\n.hero.mini .fig{font-size:40px}\n.hero.mini .sub{font-size:14px}\n.dbar{display:grid;grid-template-columns:1fr 42px;gap:10px;align-items:center;padding:7px 0}\n.dbar+.dbar{border-top:1px solid var(--border)}\n.dbar .lab{font-size:13.5px;line-height:1.3}\n.dbar.you .lab{font-weight:600;color:var(--ink)}\n.dbar .bar i{background:var(--context)}\n.dbar.you .bar i{background:var(--accent)}\n.dbar .pc{text-align:right;font-size:13px;font-weight:600;color:var(--ink-2);font-variant-numeric:tabular-nums}\n.dbar.you .pc{color:var(--accent)}\n.youtag{display:inline-block;font-size:10.5px;font-weight:700;letter-spacing:.04em;\n color:var(--accent-ink);background:var(--accent);border-radius:4px;padding:1px 5px;margin-left:6px;\n vertical-align:1px}\n.twob{display:grid;gap:10px;margin-top:4px}\n.twob .row .lab{font-size:13.5px;margin-bottom:4px}\n.twob .row.you .lab{font-weight:600;color:var(--ink)}\n.twob .row .bar{height:22px;border-radius:6px}\n.twob .row .bar i{background:var(--context);border-radius:6px}\n.twob .row.you .bar i{background:var(--accent)}\n.twob .row .v{font-size:12.5px;color:var(--ink-2);margin-top:4px;font-variant-numeric:tabular-nums}\n.qtr{position:relative;height:34px;margin:10px 0 4px}\n.qtr .track{position:absolute;top:14px;left:0;right:0;height:6px;background:var(--track);border-radius:3px}\n.qtr .box{position:absolute;top:11px;height:12px;background:var(--box);border-radius:3px}\n.qtr .med{position:absolute;top:7px;width:2px;height:20px;background:var(--ink-2)}\n.qtr .me{position:absolute;top:4px;width:3px;height:26px;background:var(--accent);border-radius:2px}\n.qtr .melab{position:absolute;top:-2px;font-size:11px;font-weight:700;color:var(--accent);transform:translateX(-50%)}\n.sup{background:var(--surface-1);border:1px dashed var(--border);border-radius:10px;\n padding:14px 13px;margin-bottom:12px;font-size:13.5px;color:var(--ink-2)}\n\n/* ---------- restyle to match the landing page ---------- */\n.root,text{font-family:var(--w-sans)}\nh1,.title{font-family:var(--w-serif);font-style:italic;font-weight:400;font-size:clamp(30px,5vw,40px);\n line-height:1.08;letter-spacing:-.03em;margin:0 0 10px;color:var(--ink)}\n.lede{font-size:16px;line-height:26px;font-weight:300;color:var(--ink);margin:0 0 22px}\n.card{border:0;border-radius:16px;box-shadow:inset 0 0 0 1px var(--border);padding:24px 22px}\n.card h2{font-size:19px;line-height:26px;font-weight:400;letter-spacing:-.01em;margin:0 0 4px}\n.narr{font-size:15px;line-height:24px;font-weight:300}\nlabel.qlab{font-weight:500}\n.opt{border-radius:8px}\ninput[type=text],input[type=number],input[type=email],select{font:300 16px var(--w-sans);padding:13px 14px;\n border:1px solid var(--input-border);border-radius:6px;background:var(--surface-1);color:var(--ink)}\ninput:focus,select:focus{outline:2px solid var(--accent);outline-offset:1px;border-color:transparent}\n.btn{display:inline-flex;align-items:center;justify-content:center;min-height:52px;padding:0 24px;\n border-radius:6px;font-size:16px;font-weight:500;border-color:var(--border)}\n.btn.pri:hover:not(:disabled){background:var(--accent-hover)}\n.seg button{border-radius:6px}\n.note,.sup{border-radius:12px}\n.hero{position:relative;overflow:hidden;border:0;border-image:none;border-radius:16px;\n box-shadow:inset 0 0 0 1px var(--border);padding:30px 22px 24px}\n.hero::before{content:\"\";position:absolute;left:0;right:0;top:0;height:4px;background-image:var(--brand-grad)}\n.hero .fig{font-weight:300;font-size:clamp(64px,12vw,88px);letter-spacing:-.05em;color:var(--ink)}\n.hero.mini .fig{font-size:clamp(52px,9vw,64px)}\n.hero .sub{font-size:16px;line-height:26px;font-weight:300}\n.kpi{border-radius:12px}\n.kpi .v{font-weight:300;font-size:34px;letter-spacing:-.03em}\n.card.accent{position:relative;overflow:hidden}\n.card.accent::before{content:\"\";position:absolute;left:0;top:0;bottom:0;width:4px;background-image:var(--brand-grad)}\n.consent{font-weight:300}\n";
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
      slug: mount.dataset.survey || 'csc-compensation-2026',
      // HubSpot's shareable link to the same report form. Shown as a fallback for
      // anyone whose ad blocker stops the embedded form loading. null = no link.
      reportFormUrl: 'https://share-eu1.hsforms.com/1VvhElB6vQ5iwrrGTKQP3lg2b1vun'
    };
    /* ===================================================================== */

    const $ = s => root.querySelector(s);
    const app = $('#app'), tip = $('#tip');
    const usd = v => '$' + Math.round(v).toLocaleString('en-US');
    const ord = n => n + (['th','st','nd','rd'][n % 100 >> 3 ^ 1 && n % 10] || 'th');
    // Anything typed by a person or returned as an error goes through this before
    // it touches innerHTML. Copy from the survey definition is trusted and may
    // contain entities on purpose, so it is not escaped.
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g,
      c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
    // basis labels appear mid-sentence: "among Individual contributors" reads wrong
    const midSentence = s => !s ? s
      : (s.split(' ')[0] === s.split(' ')[0].toUpperCase() ? s : s[0].toLowerCase() + s.slice(1));
    // Scroll to the top of the widget, not the top of the page. Only scrolls up,
    // and only when the widget's top is out of view: on a long article the reader
    // stays where they are.
    function toTop(smooth){
      const top = mount.getBoundingClientRect().top;
      if (top < 0) window.scrollTo({ top: window.scrollY + top - 16,
                                     behavior: smooth ? 'smooth' : 'auto' });
    }

    /* ---- device token: cookie first, then localStorage, then session only ---- */
    let TOKEN = null;   // kept for the page's lifetime, so it never changes mid-survey
    function deviceToken(){
      if (TOKEN) return TOKEN;
      const NAME = 'csc_bm_tok';
      const read = () => {
        // Both reads can throw on pages that block storage (sandboxed previews,
        // some privacy settings). Fall through rather than break the survey.
        try {
          const m = document.cookie.match(new RegExp('(?:^|; )' + NAME + '=([^;]*)'));
          if (m) return decodeURIComponent(m[1]);
        } catch (e) {}
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
      TOKEN = t;
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

    let DEF = null, Q = {}, screen = 0, answers = {}, startedAt = Date.now();
    let RESULT = null, activeCut = 'by_level';
    let lastView = null;                  // stage:screen last logged as viewed

    /* ===================================================================== *
       STAGE_FLOW
       Section 1 is the core (demographics and firmographics), written by
       submit_core with no results screen. Every later section goes through
       submit_stage, which writes and returns that section's comparison in one
       round trip. The pay section (results.mode = 'full') returns the full
       compensation payload; the rest return a hero and up to two cards.
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
    let DONE = [];   // sections this respondent has completed, as the server reports them
    const markDone = list => { if (Array.isArray(list)) DONE = list.slice(); };
    const isDone = n => DONE.indexOf(n) >= 0;
    /* The next section still to do: the first after this one in module order, then
       any skipped earlier. Order alone stopped being enough once a respondent can
       skip ahead to the pay section and come back for the rest. */
    function nextSection(){
      const s = sections(), i = s.indexOf(STAGE);
      const open = n => n !== STAGE && !isDone(n);
      return s.slice(i + 1).find(open) || s.find(open);
    }
    const allDone = () => sections().every(isDone);
    const isMulti = () => sections().length > 2;
    const paySection = () => sections().find(n => ((stageDef(n) || {}).results || {}).mode === 'full');
    /* Sections that share a display group and sit next to each other in the module
       read as one section: in the pay module, core runs straight into pay with
       nothing shown between them. Apart (pay last), they count separately. */
    function runs(){
      const out = [];
      sections().forEach(n => {
        const g = (stageDef(n) || {}).display_group, prev = out[out.length - 1];
        if (prev && g != null && prev.g === g) prev.members.push(n);
        else out.push({ g: g, members: [n] });
      });
      return out;
    }
    const stageCount = () => runs().length || 1;
    function stagePos(){
      const i = runs().findIndex(r => r.members.indexOf(STAGE) >= 0);
      return i < 0 ? 1 : i + 1;
    }
    const stageDef = n => (DEF.stages || []).find(x => x.n === n) || null;

    /* Section 1 writes nothing to the server until its last question, so a reload
       halfway through would throw all of it away. The draft is kept on the device
       only — same place the anonymous token already lives, nothing sent anywhere —
       and is cleared the moment the server has the answers. */
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
    (async function init(){
      render(`<div class="card" style="text-align:center;color:var(--muted)">Loading…</div>`);
      try {
        DEF = await rpc('get_survey', { p_slug: CONFIG.slug });
        if (!DEF) throw new Error('survey not open');
      } catch (e) {
        return render(`<div class="card"><h2>We can't load the survey right now</h2>
          <p class="narr">${esc(e.message)}. Please try again shortly.</p></div>`);
      }
      (DEF.questions || []).filter(q => q.type !== 'terminator').forEach(q => Q[q.key] = q);
      // Q must cover every stage: wire() looks options up by key to decide
      // whether an answer reveals another question.
      (DEF.stages || []).forEach(st => (st.questions || []).forEach(q => Q[q.key] = q));
      const p = new URLSearchParams(location.search);
      answers.__source = mount.dataset.src || p.get('src') || p.get('utm_source') || 'organic';
      MODULE = mount.dataset.module || p.get('module') || 'full';
      if (!(DEF.modules || {})[MODULE]) MODULE = 'full';
      STAGE = sections()[0];
      startedAt = Date.now();

      // Stop and resume. If the visitor has never started, get_progress returns
      // {found:false} and we fall through to the survey.
      try {
        PROGRESS = await rpc('get_progress',
          { p_survey_slug: CONFIG.slug, p_anon_token: deviceToken() });
      } catch (e) { PROGRESS = null; }

      if (PROGRESS && PROGRESS.found && (PROGRESS.stages_completed || []).length){
        clearDraft();
        Object.assign(answers, PROGRESS.answers || {});
        const done = PROGRESS.stages_completed || [];
        markDone(done);
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
          <p class="narr">They're saved in this browser only — nothing has been sent
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
      toTop();
    }

    function drawResume(todo){
      const done = PROGRESS.stages_completed || [];
      const next = (todo && todo[0]) || null;
      const nextTitle = next ? (stageDef(next) || {}).title : null;
      logEvent('resume');
      render(`
        <div class="title">Welcome back</div>
        <p class="lede">${next
          ? `You finished ${done.length} of ${stageCount()} sections.`
          : `You've finished all ${stageCount()} sections.`}</p>
        <div class="card">
          <h2>${next ? 'Carry on from &ldquo;' + nextTitle + '&rdquo;?' : 'Everything is saved'}</h2>
          <p class="narr">Your answers are saved against an anonymous ID kept in this
            browser. Nothing is tied to your name.</p>
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

    /* Read-only. get_results rebuilds the comparison from what is stored and writes
       nothing, so looking at your results can never change your answers. */
    async function replayStage(n){
      render(`<div class="card" style="text-align:center;color:var(--muted)">Loading…</div>`);
      STAGE = n;
      let r = null;
      try {
        r = await rpc('get_results', {
          p_survey_slug: CONFIG.slug, p_anon_token: deviceToken(), p_stage: n });
      } catch (e) { r = { ok: false, message: e.message }; }
      if (!r || r.ok === false){
        return render(`<div class="card"><h2>We couldn't load your results</h2>
          <p class="narr">${esc((r && r.message) || 'Please try again shortly.')}</p></div>`);
      }
      markDone(r.stages_completed);
      if (r.cuts){
        RESULT = r; FINAL = r.final || null;
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
    /* Sections that carry explicit screen numbers keep them. The rest are chunked
       at six questions a screen. */
    function screensFor(stage){
      const qs = (stageDef(stage) || {}).questions || [];
      if (qs.length && qs.some(q => q.screen != null)){
        const nums = [...new Set(qs.map(q => q.screen))].sort((a,b) => a - b);
        return nums.map(n => qs.filter(q => q.screen === n));
      }
      const out = [];
      for (let i = 0; i < qs.length; i += 6) out.push(qs.slice(i, i + 6));
      return out;
    }

    /* show_if: {key: value} shows the question when that answer was given;
       {key: [a, b]} shows it when any of them was. "Looking for another job" is
       asked only of people who want to move companies, either way. */
    function shownBy(cond){
      return Object.entries(cond).every(([k, v]) =>
        Array.isArray(v) ? v.indexOf(answers[k]) >= 0 : answers[k] === v);
    }

    function questionsFor(i){
      const sc = screensFor(STAGE)[i] || [];
      return sc.filter(q => !q.show_if || shownBy(q.show_if));
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
          // no list defined for this question (industry): free text
          : `<input type="text" data-qt="${q.key}" maxlength="80" value="${esc(v)}" placeholder="e.g. SaaS">`;
      } else if (q.type === 'number'){
        inner = `<input type="number" inputmode="numeric" data-qn="${q.key}" min="${q.min??0}" max="${q.max??99}"
          value="${v??''}" placeholder="e.g. 6">`;
      } else if (q.type === 'currency'){
        // Always hold a currency in answers, so it is saved, validated against and
        // sent. Before this it only existed if the respondent touched the select.
        if (!answers.base_salary_currency) answers.base_salary_currency = guessCurrency();
        const cur = answers.base_salary_currency;
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
        inner = `<input type="text" data-qt="${q.key}" maxlength="${q.max_length||80}" value="${esc(v)}">`;
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
    // happens in submit_stage using the same rates from the definition.
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
      const c = m[answers.country] || 'USD';
      // Only offer a currency the definition can actually convert.
      const rates = (DEF && DEF.fx_rates && DEF.fx_rates.per_usd) || {};
      return rates[c] ? c : 'USD';
    }

    function introCopy(){
      if (!(DEF.stages || []).length) return { title: DEF.title, subtitle: DEF.subtitle };
      const m = moduleDef();
      return { title: m.title || DEF.title, subtitle: m.subtitle || DEF.subtitle };
    }

    function stageBar(){
      if (STAGE === 1 && !(DEF.stages || []).length) return '';
      // One visible section (the pay module): a "Section 1 of 1" bar says nothing.
      if (stageCount() < 2) return '';
      let pips = '';
      const pos = stagePos();
      for (let i = 1; i <= stageCount(); i++)
        pips += `<i class="${i < pos ? 'done' : i === pos ? 'now' : ''}"></i>`;
      return `<div class="stagebar"><span>Section ${stagePos()} of ${stageCount()}</span>
        <span class="pips">${pips}</span></div>`;
    }

    /* Sections that share a display group (core and pay) run back to back with
       nothing between them, so the progress bar runs across both. Restarting it
       at the first pay question would read as starting over. */
    function groupProgress(){
      const run = runs().find(r => r.members.indexOf(STAGE) >= 0) || { members: [STAGE] };
      let total = 0, done = 0;
      run.members.forEach(n => {
        if (n === STAGE) done = total + screen;
        total += screensFor(n).length;
      });
      return { total: total, done: done };
    }

    function drawScreen(){
      // The results footer lives outside #app and persists across renders, so it has
      // to be cleared by hand.
      if ($('#foot')) $('#foot').innerHTML = '';
      showReportForm(false);
      const scr = screensFor(STAGE), qs = questionsFor(screen);
      const first = screen === 0, last = screen === scr.length - 1;
      const sd = stageDef(STAGE) || {};
      const veryFirst = STAGE === sections()[0] && first;
      render(`
        ${veryFirst ? `${mount.dataset.hideTitle !== undefined ? ''
             : `<h1 class="title">${introCopy().title}</h1>`}
           <p class="lede">${introCopy().subtitle}</p>` : ''}
        ${!veryFirst && first ? `<div class="title">${sd.title}</div>
           <p class="lede">${sd.subtitle || ''}</p>` : ''}
        ${stageBar()}
        ${(() => { const gp = groupProgress();
          return `<div class="prog" role="progressbar" aria-valuenow="${gp.done+1}" aria-valuemax="${gp.total}">
          ${Array.from({ length: gp.total }, (_, i) => `<i class="${i <= gp.done ? 'on' : ''}"></i>`).join('')}</div>`; })()}
        <div class="card">${qs.map(fieldHTML).join('')}</div>
        <div class="hp"><label>Leave this empty<input type="text" id="hp" tabindex="-1" autocomplete="off"></label></div>
        <div class="nav">
          ${screen>0?`<button class="btn" type="button" id="back">Back</button>`:''}
          <button class="btn pri" type="button" id="next">
            ${last ? (STAGE === 1 ? 'See my comparison' : 'See how I compare') : 'Continue'}</button>
        </div>
        ${!veryFirst ? `<p class="consent">${(DEF.resume && DEF.resume.copy &&
            DEF.resume.copy.on_leave) || 'Saved as you go — come back in this browser any time.'}</p>` : ''}
        ${veryFirst?`<p class="consent">${DEF.consent_text}</p>`:''}`);
      wire();
      // Log a view once per screen. drawScreen also runs when an answer reveals a
      // follow-up, and logging then would count the same view several times.
      const vk = STAGE + ':' + screen;
      if (vk !== lastView){
        lastView = vk;
        qs.forEach(q => logEvent('question_view', { p_question: q.key }));
      }
      toTop();
    }

    function wire(){
      // Save on every answer, not just on Continue.
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
        answers[el.dataset.qs] = el.value || undefined;
        clearErr(el.dataset.qs);
        if (el.dataset.qs === 'country') answers.base_salary_currency = guessCurrency();
        touch();
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
      if (cur) cur.onchange = () => { answers.base_salary_currency = cur.value; touch();
        app.querySelectorAll('[data-curecho]').forEach(e => e.textContent = cur.value); };
      if ($('#back')) $('#back').onclick = () => { screen--; drawScreen(); };
      $('#next').onclick = onNext;
    }

    /* Does anything in this stage branch on this key? `reveals` can sit on the
       option or on the question, and show_if can name the key directly, so all
       three are checked. */
    function revealsSomething(key){
      if ((Q[key] && Q[key].options || []).some(o => o.reveals)) return true;
      if (Q[key] && Q[key].reveals) return true;
      const pool = (stageDef(STAGE) || {}).questions || [];
      return pool.some(q => q.show_if && Object.keys(q.show_if).indexOf(key) >= 0);
    }

    function showErr(k, msg){ const e = app.querySelector(`[data-err="${k}"]`);
      if (e){ e.textContent = msg; e.classList.add('on'); return; }
      // No slot for this error means the question is required but not on screen —
      // a branching bug, not a respondent mistake. Say so rather than leaving a
      // Continue button that does nothing.
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

    /* Only send questions that were actually shown: a question hidden by its
       show_if was never asked. */
    function stagePayload(n){
      const payload = {};
      ((stageDef(n) || {}).questions || []).forEach(q => {
        const shown = !q.show_if ||
          shownBy(q.show_if);
        if (shown && answers[q.key] !== undefined) payload[q.key] = answers[q.key];
      });
      return payload;
    }

    /* =====================================================================
       submit
       ===================================================================== */
    async function submitCore(){
      const btn = $('#next');
      btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Saving…';
      try {
        const r = await rpc('submit_core', {
          p_survey_slug: CONFIG.slug,
          p_anon_token: deviceToken(),
          p_answers: stagePayload(1),
          p_source: answers.__source,
          p_module: MODULE,
          p_referrer: document.referrer || null,
          p_duration_ms: Date.now() - startedAt,
          p_honeypot: ($('#hp') && $('#hp').value) || null
          // p_ip deliberately not sent: the server reads it from the request headers
        });
        if (!r || r.ok === false) return submitFailed(r);
        clearDraft();                       // the server has the core now
        markDone(r.stages_completed);
        // No results screen here, by design: the payoff is one section away.
        const nx = nextSection();
        if (!nx) return drawStopped();
        STAGE = nx; screen = 0; startedAt = Date.now();
        drawScreen();
      } catch (e){ submitFailed({ error: 'network', message: e.message }); }
    }

    function submitFailed(r){
      const btn = $('#next');
      if (btn){ btn.disabled = false; btn.textContent = 'Try again'; }
      const map = {
        too_fast: 'Please take a moment over the questions and try again.',
        invalid_salary: 'That salary figure doesn\'t look right — please check it.',
        unsupported_currency: r && r.message,
        missing_currency: 'Please choose the currency you are paid in.',
        rate_limited: 'A few too many submissions from your network just now. Please try again later.',
        rejected: 'Something went wrong with that submission.',
        survey_not_open: 'This survey has closed.',
        network: 'We couldn\'t reach the server. Please check your connection and try again.'
      };
      const msg = (r && map[r.error]) || (r && r.message) || 'Something went wrong.';
      let box = app.querySelector('#failbox');
      if (!box){
        box = document.createElement('div'); box.id = 'failbox'; box.className = 'note';
        const nav = app.querySelector('.nav');
        if (nav) nav.before(box); else app.appendChild(box);
      }
      box.innerHTML = `<b>${esc(msg)}</b>`;
      box.scrollIntoView({ block:'center', behavior:'smooth' });
    }

    /* =====================================================================
       sections 2-7: submit and comparison
       ===================================================================== */
    async function submitStage(isPay){
      const btn = $('#next');
      btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Comparing…';
      const payload = stagePayload(STAGE);
      // The currency is not a question in its own right, so stagePayload never
      // picks it up. Without this line every non-dollar salary was stored as dollars.
      if (isPay) payload.base_salary_currency = answers.base_salary_currency || guessCurrency();
      try {
        const r = await rpc('submit_stage', {
          p_survey_slug: CONFIG.slug, p_anon_token: deviceToken(),
          p_stage: STAGE, p_answers: payload, p_duration_ms: Date.now() - startedAt });
        if (!r || r.ok === false) return submitFailed(r);
        markDone(r.stages_completed);
        if (isPay){
          RESULT = r; FINAL = r.final || null;
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

    /* Headlines carry {placeholders} that name keys in the payload. */
    function fillHeadline(c){
      const h = c.headline || '';
      // share_* values are percentages. Without the sign, "{share_your_answer} of
      // your peers" reads as a head count, which is both wrong and against house style.
      return h.replace(/\{(\w+)\}/g, (m, k) =>
        c[k] == null ? '' : (/^share/.test(k) && !/%/.test(h.slice(h.indexOf(m) + m.length, h.indexOf(m) + m.length + 1))
                             ? c[k] + '%' : c[k]));
    }

    function drawStageResults(){
      const cuts = STAGE_RESULT.results || {};
      const res = cuts[activeCut] || cuts.by_level || cuts.by_economy || {};
      const sd = stageDef(STAGE) || {};
      const last = allDone();
      const isFull = isMulti();
      const cutOk = k => cuts[k] && cuts[k].hero && cuts[k].hero.available !== false;

      render(`
        <div class="title">${sd.title}</div>
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
        activeCut = b.dataset.scut; drawStageResults(); toTop(true); });
      const go = $('#stageGo');
      if (go) go.onclick = () => {
        logEvent('continue_click');
        STAGE = nextSection(); screen = 0; startedAt = Date.now(); drawScreen(); };
      const stop = $('#stageStop');
      if (stop) stop.onclick = () => { logEvent('leave_click'); drawStopped(); };
      const skip = $('#stageSkip');
      if (skip) skip.onclick = () => {
        logEvent('skip_to_pay');
        STAGE = paySection(); screen = 0; startedAt = Date.now(); drawScreen(); };
      wireResults();
      logEvent('results_view');
      toTop();
    }

    function continueHTML(){
      const nx = nextSection(), next = stageDef(nx) || {};
      const pay = paySection();
      // Pay still to come, and not next: say it's at the end, and offer to go
      // straight to it. There is deliberately no "done for now" button here: closing
      // the tab still saves progress, and the only exit offered keeps the salary.
      const payLater = pay && !isDone(pay) && nx !== pay;
      return `<div class="card">
        <h2>Next: ${next.title || ''}</h2>
        <p class="narr">${next.subtitle || ''} About
          ${Math.max(1, Math.round((next.estimated_seconds||60)/60))} minute${
          (next.estimated_seconds||60) >= 90 ? 's' : ''}.${payLater ? ' Your pay comparison comes at the end.' : ''}</p>
        <div class="nav" style="margin-top:14px">
          <button class="btn pri" type="button" id="stageGo">Keep going</button>
          ${payLater ? `<button class="btn" type="button" id="stageSkip">Skip to the pay questions</button>` : ''}
        </div>
      </div>`;
    }

    function drawStopped(){
      if ($('#foot')) $('#foot').innerHTML = '';
      render(`<div class="title">Saved</div>
        <div class="card">
          <h2>You can pick this up any time</h2>
          <p class="narr">Your answers are saved against an anonymous ID kept in this
            browser. Come back to this page in the same browser and you'll carry on from
            where you stopped. Nothing is tied to your name.</p>
        </div>
        ${unlockHTML(null)}
        ${asksHTML()}`);
      wireResults();
      toTop();
    }

    /* ---- the cross-stage cards ---------------------------------------------- */
    /* No cut toggle on these, deliberately: the same card can change sign between
       the within-level and pooled views. */
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
       compensation results
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
      const shownKeys = new Set(Q.benefits ? visibleOptions(Q.benefits).map(o => o.key) : []);
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
            ${avail?'':'disabled title="'+esc((RESULT.cuts[c.key]||{}).message||'Not available for you')+'"'}>
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

      ${allDone() && isMulti() ? finalHTML() : ''}
      ${continuePromptHTML()}
      ${unlockHTML(otherCut)}
      ${asksHTML()}`);

      $('#foot').innerHTML = `${RESULT.vintage ? RESULT.vintage + '. ' : ''}No comparison is shown on fewer than
        ${RESULT.threshold} responses. Individual answers are never published or attributed.
        Figures normalised to US dollars.`;
      wireResults();
      toTop();
    }

    /* The offer to carry on, shown under the full pay results and never above
       them. */
    function continuePromptHTML(){
      const nx = nextSection();
      if (!nx) return crossSellHTML();      // end of a short module
      const cp = (stageDef(STAGE) || {}).continue_prompt;
      const nd = stageDef(nx) || {};
      // Counted, not taken from the definition: with skipping, "five more" may be wrong.
      const left = sections().filter(n => !isDone(n)).length;
      return `<div class="card accent">
        <h2>${left > 1 ? left + ' more short sections' : 'One more short section'}</h2>
        <p class="narr">${cp ? cp.body : (nd.subtitle || '')}</p>
        <div class="nav" style="margin-top:14px">
          <button class="btn pri" type="button" id="s1go">Keep going</button>
        </div></div>`;
    }

    function completedStages(){
      if (DONE.length) return DONE;
      return (STAGE_RESULT && STAGE_RESULT.stages_completed)
          || (RESULT && RESULT.stages_completed)
          || (PROGRESS && PROGRESS.stages_completed) || sections();
    }

    /* End of a short module: offer the others. They're shorter now, because the
       core is already answered. */
    function crossSellHTML(){
      const mods = DEF.modules || {};
      const done = completedStages();
      const offers = Object.keys(mods)
        .filter(k => k !== MODULE && k !== 'full')
        .map(k => ({ key: k, m: mods[k], topic: (mods[k].sections || [])[1] }))
        .filter(o => o.topic && done.indexOf(o.topic) < 0)
        .slice(0, 2);
      if (!offers.length) return '';
      return `<div class="card accent">
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

    /* The report form lives on the host page, outside the shadow root, because
       HubSpot's embed renders into the page and cannot reach inside the widget.
       Keeping it outside is also the point: the email never touches this code. */
    const reportForm = () => document.querySelector('[data-csc-report]');
    function showReportForm(on){ const f = reportForm(); if (f) f.hidden = !on; }

    function asksHTML(){
      const form = reportForm(), url = CONFIG.reportFormUrl;
      if (!form && !url){
        console.warn('[CSC] No report form: add <div data-csc-report hidden> to the page, or set reportFormUrl.');
        return '';
      }
      return `<div class="card" id="asks">
        <h2>Want the full report?</h2>
        <p class="narr">${form ? 'The form is just below your results.'
          : "Request a copy using the link below. It's separate from the survey, so your answers stay anonymous."}</p>
        <div class="nav" style="margin-top:14px">
          ${form ? `<button class="btn pri" type="button" id="toReport">Go to the form</button>` : ''}
          ${url ? `<a class="btn${form ? '' : ' pri'}" href="${esc(url)}" target="_blank" rel="noopener"
              style="text-align:center;text-decoration:none">${form ? 'Open it in a new tab' : 'Request the report'}</a>` : ''}
        </div>
      </div>`;
    }

    function wireResults(){
      showReportForm(!!$('#asks'));
      const toReport = $('#toReport');
      // Deliberately not logged: a click time could be matched to HubSpot's
      // submission time and re-link an email to a set of answers.
      if (toReport) toReport.onclick = () => {
        reportForm().scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
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
        const done = completedStages();
        const todo = sections().filter(n => done.indexOf(n) < 0);
        STAGE = todo.length ? todo[0] : sections()[sections().length - 1];
        screen = 0; startedAt = Date.now();
        logEvent('continue_click');
        drawScreen();
      });
      app.querySelectorAll('[data-cut]').forEach(b => b.onclick = () => {
        activeCut = b.dataset.cut; drawResults(); toTop(true); });
      app.querySelectorAll('[data-tip]').forEach(el => {
        el.style.cursor='crosshair';
        el.addEventListener('mousemove', e => { tip.innerHTML = el.dataset.tip; tip.style.opacity=1;
          tip.style.left = Math.min(innerWidth - tip.offsetWidth - 8, e.clientX + 12) + 'px';
          tip.style.top = (e.clientY - 34) + 'px'; });
        el.addEventListener('mouseleave', () => tip.style.opacity = 0);
      });
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
