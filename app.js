/* BrainHub — comportamento do site (sem dependências) */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement;

  /* ======================================================================
     1. Preferências de acessibilidade
     ====================================================================== */
  var KEY = 'brainhub.prefs';
  var THEMES = [
    { id: 'lavanda',  name: 'Lavanda',        desc: 'Escuro, calmo',      bg: '#0c0920', fg: '#b8a9ff', line: '#3a2f78' },
    { id: 'calmo',    name: 'Névoa',          desc: 'Claro, suave',       bg: '#edf1f7', fg: '#4553c2', line: '#c4cde0' },
    { id: 'suave',    name: 'Papel',          desc: 'Tom quente, sem brilho', bg: '#f5eee2', fg: '#9a4f1c', line: '#e0d2bb' },
    { id: 'contraste',name: 'Alto contraste', desc: 'Preto e amarelo',    bg: '#000000', fg: '#ffe14d', line: '#ffffff' }
  ];
  var ACCENTS = [
    { name: 'Padrão do tema', value: null },
    { name: 'Lilás', value: '#b8a9ff' },
    { name: 'Azul', value: '#7fb4ff' },
    { name: 'Verde', value: '#6fd1a1' },
    { name: 'Âmbar', value: '#f2c56b' },
    { name: 'Rosa', value: '#f5a3c7' },
    { name: 'Azul escuro', value: '#2f46c9' }
  ];
  var FONTS = [
    { id: 'atkinson', name: 'Atkinson Hyperlegible', note: 'Letras bem distintas', css: "'Atkinson Hyperlegible',Verdana,sans-serif" },
    { id: 'lexend',   name: 'Lexend',               note: 'Fluência de leitura',  css: "'Lexend',Verdana,sans-serif" },
    { id: 'inter',    name: 'Inter',                note: 'Neutra e limpa',       css: "'Inter',system-ui,sans-serif" },
    { id: 'opendys',  name: 'OpenDyslexic',         note: 'Base pesada nas letras', css: "'OpenDyslexic','Comic Sans MS',sans-serif" },
    { id: 'sistema',  name: 'Fonte do sistema',     note: 'A que seu aparelho usa', css: "system-ui,-apple-system,'Segoe UI',Verdana,sans-serif" }
  ];
  var DEFAULTS = { theme: 'lavanda', accent: null, font: 'atkinson', size: 100, lh: '1.6', ls: '0', measure: '1120',
                   motionOff: false, glassOff: false, soft: false, focus: false, underline: false, bigTouch: false };

  function mq(q) { return window.matchMedia && window.matchMedia(q).matches; }
  function systemDefaults() {
    var d = Object.assign({}, DEFAULTS);
    if (mq('(prefers-contrast: more)')) d.theme = 'contraste';
    else if (mq('(prefers-color-scheme: light)')) d.theme = 'calmo';
    if (mq('(prefers-reduced-motion: reduce)')) d.motionOff = true;
    if (mq('(prefers-reduced-transparency: reduce)')) d.glassOff = true;
    return d;
  }
  var prefs = (function () {
    try { var s = JSON.parse(localStorage.getItem(KEY)); if (s) return Object.assign(systemDefaults(), s); } catch (e) {}
    return systemDefaults();
  })();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) {} }

  function luminance(hex) {
    var c = hex.replace('#', ''); if (c.length === 3) c = c.replace(/(.)/g, '$1$1');
    var v = [0, 2, 4].map(function (i) {
      var x = parseInt(c.substr(i, 2), 16) / 255;
      return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4);
    });
    return .2126 * v[0] + .7152 * v[1] + .0722 * v[2];
  }

  function apply() {
    root.dataset.theme = prefs.theme;
    var dark = prefs.theme === 'lavanda' || prefs.theme === 'contraste';
    if (prefs.accent) {
      root.style.setProperty('--accent-custom', prefs.accent);
      root.style.setProperty('--on-accent-custom', luminance(prefs.accent) > .32 ? '#12101f' : '#ffffff');
      root.style.setProperty('--accent-ink-custom', dark
        ? 'color-mix(in srgb,' + prefs.accent + ' 78%,white)'
        : 'color-mix(in srgb,' + prefs.accent + ' 50%,black)');
    } else {
      ['--accent-custom', '--on-accent-custom', '--accent-ink-custom'].forEach(function (p) { root.style.removeProperty(p); });
    }
    var f = FONTS.filter(function (x) { return x.id === prefs.font; })[0] || FONTS[0];
    root.style.setProperty('--font', f.css);
    root.dataset.font = f.id;
    root.style.setProperty('--scale', prefs.size / 100);
    root.style.setProperty('--lh', prefs.lh);
    root.style.setProperty('--ls', prefs.ls + 'em');
    root.style.setProperty('--measure', prefs.measure + 'px');
    root.style.setProperty('--sat', prefs.soft ? .45 : 1);
    toggle('motion', prefs.motionOff, 'off');
    toggle('glass', prefs.glassOff, 'off');
    toggle('focus', prefs.focus, 'on');
    toggle('underline', prefs.underline, 'on');
    toggle('touch', prefs.bigTouch, 'big');
    syncControls();
    renderSummary();
  }
  function toggle(name, on, val) { if (on) root.dataset[name] = val; else delete root.dataset[name]; }
  function set(patch) { Object.assign(prefs, patch); save(); apply(); }

  /* ---- Montagem dos controles ---- */
  function themeCard(t, group) {
    return '<label class="theme-card"><input type="radio" name="' + group + '" value="' + t.id + '">' +
      '<span class="sw" style="background:' + t.bg + '"><i style="width:46%;background:' + t.fg + '"></i><i style="width:24%;background:' + t.line + '"></i></span>' +
      '<span><b>' + t.name + '</b><br><span class="small muted">' + t.desc + '</span></span></label>';
  }
  $$('[data-theme-picker]').forEach(function (box, i) {
    box.innerHTML = THEMES.map(function (t) { return themeCard(t, 'theme' + i); }).join('');
    box.addEventListener('change', function (e) { if (e.target.value) set({ theme: e.target.value }); });
  });

  var sw = $('#swatches');
  sw.innerHTML = ACCENTS.map(function (a, i) {
    var bg = a.value || 'conic-gradient(#b8a9ff,#7fb4ff,#6fd1a1,#f2c56b,#f5a3c7,#b8a9ff)';
    return '<label><input type="radio" name="accent" value="' + (a.value || '') + '" aria-label="' + a.name + '"><span class="dot" style="background:' + bg + '"></span></label>';
  }).join('') + '<label title="Escolher outra cor"><span class="sr">Cor personalizada</span><input type="color" id="accentPicker" value="#b8a9ff" aria-label="Escolher cor personalizada"></label>';
  sw.addEventListener('change', function (e) {
    if (e.target.name === 'accent') set({ accent: e.target.value || null });
  });
  $('#accentPicker').addEventListener('input', function (e) { set({ accent: e.target.value }); });

  $('#fonts').innerHTML = FONTS.map(function (f) {
    return '<label class="fontopt" style="font-family:' + f.css + '"><input type="radio" name="font" value="' + f.id + '"><span><b>' + f.name + '</b><br><small style="font-family:var(--font)">' + f.note + '</small></span><span aria-hidden="true" style="font-size:1.5rem">Aa</span></label>';
  }).join('');
  $('#fonts').addEventListener('change', function (e) { set({ font: e.target.value }); });

  $('#r-size').addEventListener('input', function (e) { set({ size: +e.target.value }); });
  $$('[data-seg]').forEach(function (g) {
    g.addEventListener('change', function (e) { var p = {}; p[g.dataset.seg] = e.target.value; set(p); });
  });
  $$('[data-pref]').forEach(function (c) {
    c.addEventListener('change', function () { var p = {}; p[c.dataset.pref] = c.checked; set(p); });
  });

  function syncControls() {
    $$('[data-theme-picker] input').forEach(function (i) { i.checked = i.value === prefs.theme; });
    $$('#swatches input[name=accent]').forEach(function (i) { i.checked = (i.value || null) === prefs.accent; });
    if (prefs.accent) $('#accentPicker').value = prefs.accent;
    $$('#fonts input').forEach(function (i) { i.checked = i.value === prefs.font; });
    $('#r-size').value = prefs.size; $('#v-size').textContent = prefs.size + '%';
    $$('[data-seg]').forEach(function (g) {
      $$('input', g).forEach(function (i) { i.checked = i.value === String(prefs[g.dataset.seg]); });
    });
    $$('[data-pref]').forEach(function (c) { c.checked = !!prefs[c.dataset.pref]; });
    var sw1 = $('[data-pref-switch=contrast]'), sw2 = $('[data-pref-switch=bigtext]'), sw3 = $('[data-pref-switch=calm]');
    if (sw1) sw1.checked = prefs.theme === 'contraste';
    if (sw2) sw2.checked = prefs.size >= 120;
    if (sw3) sw3.checked = prefs.motionOff && prefs.glassOff;
  }
  /* Atalhos do cadastro */
  document.addEventListener('change', function (e) {
    var k = e.target.getAttribute && e.target.getAttribute('data-pref-switch'); if (!k) return;
    if (k === 'contrast') set({ theme: e.target.checked ? 'contraste' : 'lavanda' });
    if (k === 'bigtext') set({ size: e.target.checked ? 125 : 100 });
    if (k === 'calm') set({ motionOff: e.target.checked, glassOff: e.target.checked });
  });

  function renderSummary() {
    var el = $('#prefSummary'); if (!el) return;
    var t = THEMES.filter(function (x) { return x.id === prefs.theme; })[0];
    var f = FONTS.filter(function (x) { return x.id === prefs.font; })[0];
    var rows = [['Tema', t.name], ['Fonte', f.name], ['Tamanho do texto', prefs.size + '%'],
      ['Animações', prefs.motionOff ? 'Desligadas' : 'Ligadas'], ['Transparência', prefs.glassOff ? 'Desligada' : 'Ligada'],
      ['Modo foco', prefs.focus ? 'Ligado' : 'Desligado']];
    el.innerHTML = rows.map(function (r) {
      return '<div class="between" style="border-top:1px solid var(--stroke);padding-top:.5rem"><dt class="muted">' + r[0] + '</dt><dd style="font-weight:700">' + r[1] + '</dd></div>';
    }).join('');
  }
  $('#prefsReset').addEventListener('click', function () { prefs = systemDefaults(); save(); apply(); toast('Voltamos ao padrão.'); });

  /* ======================================================================
     2. Painel (drawer) com foco preso e Esc
     ====================================================================== */
  var drawer = $('#prefs'), scrim = $('#scrim'), lastBtn = null;
  function focusables() { return $$('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])', drawer).filter(function (n) { return !n.disabled && n.offsetParent !== null; }); }
  function openPrefs(from) {
    lastBtn = from || document.activeElement;
    drawer.classList.add('on'); scrim.classList.add('on');
    $$('.app,.tabbar').forEach(function (n) { n.setAttribute('inert', ''); });
    setTimeout(function () { $('#prefsClose').focus(); }, 30);
  }
  function closePrefs() {
    drawer.classList.remove('on'); scrim.classList.remove('on');
    $$('.app,.tabbar').forEach(function (n) { n.removeAttribute('inert'); });
    if (lastBtn && lastBtn.focus) lastBtn.focus();
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-open-prefs]'); if (b) { e.preventDefault(); openPrefs(b); }
  });
  $('#prefsClose').addEventListener('click', closePrefs);
  $('#prefsDone').addEventListener('click', closePrefs);
  scrim.addEventListener('click', closePrefs);
  document.addEventListener('keydown', function (e) {
    if (!drawer.classList.contains('on')) return;
    if (e.key === 'Escape') { closePrefs(); return; }
    if (e.key === 'Tab') {
      var f = focusables(); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* Toast */
  var toastEl = $('#toast'), toastT;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('on'); }, 3200);
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-toast]'); if (t) toast(t.dataset.toast);
  });

  /* ======================================================================
     3. Rotas (hash)
     ====================================================================== */
  var views = $$('[data-view]');
  var NAV_OF = { licao: 'trilhas', publicar: 'comunidade' };
  var first = true;
  function route() {
    var name = (location.hash.replace(/^#\/?/, '') || 'main').split('?')[0];
    if (!views.some(function (v) { return v.dataset.view === name; })) name = 'main';
    views.forEach(function (v) { v.hidden = v.dataset.view !== name; });
    document.body.dataset.route = name;
    var cur = $('[data-view="' + name + '"]');
    document.title = 'BrainHub — ' + cur.dataset.title;
    var nav = NAV_OF[name] || name;
    $$('[data-nav]').forEach(function (a) {
      if (a.dataset.nav === nav) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    window.scrollTo(0, 0);
    if (!first) {
      var h = $('h1', cur); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    }
    first = false;
    if (name === 'comunidade') renderFeed();
  }
  window.addEventListener('hashchange', route);

  /* Cadastro em 2 passos */
  $('#step1').addEventListener('submit', function (e) {
    e.preventDefault();
    $('#step1').hidden = true; $('#step2').hidden = false;
    $('#s2').classList.add('on'); $('#stepLabel').textContent = 'Passo 2 de 2';
    $('h1', $('#step2')).setAttribute('tabindex', '-1'); $('h1', $('#step2')).focus();
  });
  $('#step2').addEventListener('submit', function (e) { e.preventDefault(); location.hash = '#/inicio'; });

  /* ======================================================================
     4. Lição: vídeo simulado, transcrição e exercício
     ====================================================================== */
  var playing = false, pos = 0, timer = null, TOTAL = 360;
  var CAPS = ['Oi! Hoje vamos aprender a criar links.', 'Um link leva a pessoa para outra página.', 'Para criar, usamos a tag a.',
    'O endereço fica dentro do atributo href.', 'Escolha um texto que explique o destino do link.'];
  function fmt(s) { return Math.floor(s / 60) + ':' + ('0' + Math.floor(s % 60)).slice(-2); }
  function paint() {
    $('#tcur').textContent = fmt(pos);
    var p = pos / TOTAL * 100;
    $('#vmeter i').style.width = p + '%'; $('#vmeter').setAttribute('aria-valuenow', Math.round(p));
    $('#cap').textContent = CAPS[Math.min(CAPS.length - 1, Math.floor(pos / (TOTAL / CAPS.length)))];
  }
  function setPlay(on) {
    playing = on; clearInterval(timer);
    var ic = on ? '#i-pause' : '#i-play', lbl = on ? 'Pausar' : 'Reproduzir';
    $$('#playBig use,#playSmall use').forEach(function (u) { u.setAttribute('href', ic); });
    $('#playBig').setAttribute('aria-label', lbl + ' vídeo'); $('#playSmall').setAttribute('aria-label', lbl);
    $('#playBig').style.opacity = on ? '0' : '1'; $('#playBig').style.pointerEvents = on ? 'none' : '';
    if (on) timer = setInterval(function () {
      pos += +$('#speed').value; if (pos >= TOTAL) { pos = TOTAL; setPlay(false); toast('Vídeo concluído.'); }
      paint();
    }, 1000 / 6);
  }
  $('#playBig').addEventListener('click', function () { setPlay(true); });
  $('#playSmall').addEventListener('click', function () { setPlay(!playing); });
  $('#ccBtn').addEventListener('click', function () {
    var on = this.getAttribute('aria-pressed') !== 'true';
    this.setAttribute('aria-pressed', on); $('#cap').hidden = !on; paint();
  });
  $('#trBtn').addEventListener('click', function () {
    var open = this.getAttribute('aria-expanded') === 'true';
    this.setAttribute('aria-expanded', !open); $('#tr').hidden = open;
  });
  var answers = $$('[data-ans]');
  answers.forEach(function (b) {
    b.addEventListener('click', function () {
      var pick = b.dataset.ans;
      answers.forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
      $('#fb-none').hidden = true; $('#fb-good').hidden = pick !== 'href'; $('#fb-bad').hidden = pick === 'href';
      $('#fb-pick').textContent = pick;
    });
  });

  /* ======================================================================
     5. Comunidade: feed, abas, pergunta e publicação
     ====================================================================== */
  var posts = [
    { kind: 'duvida', t: 'Qual a diferença entre h1 e h2?', topic: 'HTML', by: 'Bruno', meta: '2 respostas', state: 'ok' },
    { kind: 'duvida', t: 'Minha imagem não aparece. O que eu confiro?', topic: 'HTML', by: 'Carla', meta: '1 resposta', state: 'ok' },
    { kind: 'duvida', t: 'Como eu centralizo um texto?', topic: 'CSS', by: 'Davi', meta: 'Sem resposta ainda · responda e ganhe XP', state: 'wait' },
    { kind: 'aula', t: 'Como criar um link, passo a passo', topic: 'HTML básico', by: 'Bruno', meta: 'Vídeo · 6 min · com legenda', state: 'ok' },
    { kind: 'aula', t: 'O que é uma variável? (com exemplos do dia a dia)', topic: 'Lógica', by: 'Marina', meta: 'Vídeo · 8 min · com transcrição', state: 'ok' },
    { kind: 'resumo', t: 'Resumo: tags que não precisam fechar', topic: 'HTML básico', by: 'Bruno', meta: 'Resumo · leitura de 2 min', state: 'ok' },
    { kind: 'resumo', t: 'Resumo: cores em CSS (nome, hex e rgb)', topic: 'CSS básico', by: 'Elis', meta: 'Resumo · leitura de 3 min', state: 'ok' }
  ];
  var tab = 'duvida', query = '';
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var ICON = { duvida: '#i-msg', aula: '#i-video', resumo: '#i-file' };
  var EMPTY = { duvida: 'Ainda não há dúvidas aqui.', aula: 'Ainda não há aulas da turma.', resumo: 'Ainda não há resumos.' };
  function renderFeed() {
    var list = posts.filter(function (p) {
      return p.kind === tab && (!query || (p.t + ' ' + p.topic).toLowerCase().indexOf(query) > -1);
    });
    var box = $('#feed');
    if (!list.length) {
      box.innerHTML = '<div class="glass pad stack"><h3>' + (query ? 'Nada encontrado para “' + esc(query) + '”' : EMPTY[tab]) + '</h3><p class="muted">' +
        '' + '</p></div>';
      return;
    }
    box.innerHTML = list.map(function (p) {
      var badge = p.state === 'wait'
        ? '<span class="chip warn"><svg class="i" aria-hidden="true"><use href="#i-clock"/></svg>Sem resposta</span>'
        : p.state === 'rev'
          ? '<span class="chip acc"><svg class="i" aria-hidden="true"><use href="#i-clock"/></svg>Em revisão</span>'
          : '<span class="chip ok"><svg class="i" aria-hidden="true"><use href="#i-check"/></svg>' + (p.kind === 'duvida' ? 'Respondida' : 'Publicado') + '</span>';
      return '<article class="glass post"><div class="between wrap"><span class="chip"><svg class="i" aria-hidden="true"><use href="' + ICON[p.kind] + '"/></svg>' + esc(p.topic) + '</span>' + badge + '</div>' + '<h3>' + esc(p.t) + '</h3></article>';
    }).join('');
  }
  var tabs = $$('[role=tab]');
  function selectTab(t) {
    tabs.forEach(function (b) { var on = b === t; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
    tab = t.dataset.tab; $('#feed').setAttribute('aria-labelledby', t.id); renderFeed();
  }
  tabs.forEach(function (b, i) {
    b.addEventListener('click', function () { selectTab(b); });
    b.addEventListener('keydown', function (e) {
      var n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null; if (n === null) return;
      e.preventDefault(); var t = tabs[(n + tabs.length) % tabs.length]; t.focus(); selectTab(t);
    });
  });
  var askBox = $('#askBox');
  function showAsk(on) { askBox.hidden = !on; $('#btnAsk').setAttribute('aria-expanded', on); if (on) $('#ask-t').focus(); }
  $('#btnAsk').addEventListener('click', function () { showAsk(askBox.hidden); });
  $('#askCancel').addEventListener('click', function () { showAsk(false); $('#btnAsk').focus(); });
  askBox.addEventListener('submit', function (e) {
    e.preventDefault();
    var t = $('#ask-t').value.trim();
    if (!t) { $('#ask-t').focus(); toast('Escreva a sua dúvida em uma frase.'); return; }
    posts.unshift({ kind: 'duvida', t: t, topic: $('#ask-top').value, by: 'Ana', meta: 'Sem resposta ainda · a turma foi avisada', state: 'wait' });
    askBox.reset(); showAsk(false); selectTab($('#tab-duv')); toast('Pergunta enviada para a turma.');
  });
  $('#searchForm').addEventListener('submit', function (e) {
    e.preventDefault(); query = $('#q').value.trim().toLowerCase();
    if (location.hash !== '#/comunidade') location.hash = '#/comunidade'; else renderFeed();
  });
  $('#q').addEventListener('input', function () { if (!this.value) { query = ''; if (document.body.dataset.route === 'comunidade') renderFeed(); } });

  /* Publicar */
  var kindLabel = { aula: 'Arquivo de vídeo', resumo: 'Link de apoio (opcional)', exercicio: 'Link de apoio (opcional)' };
  $$('input[name=tipo]').forEach(function (r) {
    r.addEventListener('change', function () { $('#fileField label').textContent = kindLabel[r.value]; });
  });
  $('#pubForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var t = $('#pub-t').value.trim();
    if (!t) { $('#pub-t').focus(); toast('Dê um título para o conteúdo.'); return; }
    var k = $('input[name=tipo]:checked').value;
    posts.unshift({ kind: k === 'exercicio' ? 'resumo' : k, t: t, topic: $('#pub-tr').value, by: 'Ana', meta: 'Aguardando revisão', state: 'rev' });
    this.reset(); tab = k === 'aula' ? 'aula' : 'resumo';
    tabs.forEach(function (b) { var on = b.dataset.tab === tab; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
    location.hash = '#/comunidade'; toast('Enviado para revisão. Você ganha 20 XP ao ser aprovado.');
  });

  /* ---------- Início ---------- */
  apply();
  route();
})();
