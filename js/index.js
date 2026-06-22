document.getElementById('lp-year').textContent = new Date().getFullYear();

const LP_PLANOS = [
  {
    id: 'individual', nome: 'Individual', descricao: '1 propriedade',
    precoMensal: '34,90', precoAnual: '27,90', economia: 'R$ 84 de economia no ano',
    destaque: false, badge: null,
    itens: [
      { ok: true,  texto: 'Guia digital completo' },
      { ok: true,  texto: 'Checklist de limpeza + WhatsApp' },
      { ok: true,  texto: 'Cartão imprimível com QR duplo' },
      { ok: true,  texto: '1 tema de cor (Oliva)' },
      { ok: false, texto: 'Múltiplas propriedades' },
      { ok: false, texto: 'Aparência (6 temas de cores exclusivos)' },
      { ok: false, texto: 'Tela de manutenção (lembretes de enxoval, ar-condicionado, dedetização, pintura e mais)' },
      { ok: false, texto: 'Acesso (fechadura eletrônica com senha expirável por hóspede)' },
    ],
  },
  {
    id: 'pro', nome: 'Pro', descricao: 'Até 5 propriedades', maxPropriedades: 5,
    precoMensal: '69,90', precoAnual: '54,90', economia: 'R$ 180 de economia no ano',
    destaque: true, badge: 'Mais popular',
    itens: [
      { ok: true, texto: 'Tudo do Individual incluso, em cada propriedade' },
      { ok: true, texto: 'Até 5 propriedades em um painel só' },
      { ok: true, texto: 'Aparência (Com 6 temas de cores exclusivos: Oceano, Terracota, Lavanda, Vinho, Ardósia e Oliva)' },
      { ok: true, texto: 'Tela de manutenção (Com lembrete e aviso sobre: Enxoval, ar-condicionado, dedetização, pintura e mais)' },
      { ok: true, texto: 'Acesso (Instrução de acesso a propriedade como Fechadura eletrônica com senha expirável por hóspede)' },
    ],
  },
];

let lpAnual = false;

function lpAlternarPeriodo() {
  lpAnual = !lpAnual;
  const toggle = document.getElementById('lp-toggle');
  const lblM   = document.getElementById('lp-lbl-mensal');
  const lblA   = document.getElementById('lp-lbl-anual');
  const badge  = document.getElementById('lp-badge-economia');
  toggle.classList.toggle('on', lpAnual);
  lblM.className = 'text-sm font-bold ' + (lpAnual ? 'text-gray-400' : 'text-gray-900');
  lblA.className = 'text-sm font-bold ' + (lpAnual ? 'text-gray-900' : 'text-gray-400');
  badge.classList.toggle('hidden', !lpAnual);
  lpRenderPlanos();
}

function lpRenderPlanos() {
  const grid = document.getElementById('lp-planos-grid');
  grid.innerHTML = LP_PLANOS.map(p => {
    const preco    = lpAnual ? p.precoAnual : p.precoMensal;
    const economia = lpAnual ? '<p class="text-xs text-green-600 font-bold mt-0.5">' + p.economia + '</p>' : '';
    const badgeHtml = p.badge
      ? '<div class="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-extrabold uppercase tracking-widest px-4 py-1 rounded-full shadow whitespace-nowrap">' + p.badge + '</div>'
      : '';
    const itens = p.itens.map(i =>
      '<li class="flex items-center gap-2 text-sm ' + (i.ok ? 'text-gray-700' : 'text-gray-300 line-through') + '">'
      + '<span class="material-icons-outlined ' + (i.ok ? 'text-primary' : 'text-gray-200') + '" style="font-size:15px">'
      + (i.ok ? 'check_circle' : 'remove_circle_outline') + '</span>' + i.texto + '</li>'
    ).join('');
    const porPropriedade = p.maxPropriedades > 1
      ? '<div class="bg-green-50 border border-green-100 rounded-xl px-3 py-2 flex items-center gap-2 mb-3">'
        + '<span class="material-icons-outlined text-green-600" style="font-size:16px">savings</span>'
        + '<div>'
        + '<p class="text-xs font-bold text-green-700">Sai mais barato por propriedade</p>'
        + '<p class="text-[11px] text-green-600/80">R$ ' + (Number(preco.replace(',', '.')) / p.maxPropriedades).toFixed(2).replace('.', ',') + '/propriedade com as ' + p.maxPropriedades + ' ativas</p>'
        + '</div></div>'
      : '';
    const btnClass = p.destaque
      ? 'w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-light transition-all shadow-lg shadow-primary/20 flex items-center justify-center'
      : 'w-full py-3 rounded-xl border-2 border-primary text-primary font-bold text-sm hover:bg-primary hover:text-white transition-all flex items-center justify-center';

    return '<a href="cadastro.html" class="plan-card bg-white rounded-2xl p-6 flex flex-col relative shadow-sm block ' + (p.destaque ? 'destaque shadow-primary/10' : '') + '">'
      + badgeHtml
      + '<div class="mb-4">'
      + '<p class="text-xs font-extrabold uppercase tracking-widest ' + (p.destaque ? 'text-primary' : 'text-gray-400') + ' mb-0.5">' + p.nome + '</p>'
      + '<p class="font-sans text-4xl text-gray-900 font-black tracking-tight">R$ ' + preco + '<span class="text-base font-sans font-semibold text-gray-400">/mês</span></p>'
      + '<p class="text-xs text-gray-400 mt-0.5">' + (lpAnual ? 'Cobrado anualmente' : 'Cobrado mensalmente') + '</p>'
      + economia
      + '</div>'
      + '<p class="text-xs font-bold text-gray-400 mb-3 flex items-center gap-1"><span class="material-icons-outlined" style="font-size:13px">home</span>' + p.descricao + '</p>'
      + '<ul class="space-y-2 flex-1 mb-5">' + itens + '</ul>'
      + porPropriedade
      + '<div class="bg-primary/5 border border-primary/15 rounded-xl px-3 py-2 flex items-center gap-2 mb-4">'
      + '<span class="material-icons-outlined text-primary" style="font-size:16px">card_giftcard</span>'
      + '<span class="text-xs font-bold text-primary">7 dias grátis para testar</span>'
      + '</div>'
      + '<span class="' + btnClass + '">Escolher ' + p.nome + '</span>'
      + '</a>';
  }).join('');
}

lpRenderPlanos();

// ── Scroll reveal ────────────────────────────────────────────────────
(function initScrollReveal() {
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-reveal-group]').forEach(function (group) {
    var step = group.id === 'lp-planos-grid' ? 120 : (group.id === 'chat-bubbles-group' ? 320 : 90);
    Array.prototype.forEach.call(group.children, function (child, i) {
      if (child.classList.contains('reveal')) {
        child.style.transitionDelay = (i * step) + 'ms';
        child.style.animationDelay  = (i * step) + 'ms';
      }
    });
  });

  var revealEls = document.querySelectorAll('.reveal');

  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  var observer = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(function (el) { observer.observe(el); });
})();

// ── Contadores numéricos animados ──────────────────────────────────────
(function initCounters() {
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  function animateCounter(el) {
    var target = Number(el.getAttribute('data-target')) || 0;
    if (prefersReduced) { el.textContent = target; return; }
    var duration = 1200;
    var start = null;
    function step(timestamp) {
      if (start === null) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  if (!('IntersectionObserver' in window)) {
    counters.forEach(animateCounter);
    return;
  }

  var counterObserver = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  counters.forEach(function (el) { counterObserver.observe(el); });
})();

// ── Mockup do painel: navegação entre abas ──────────────────────────────
function mockShowSection(name) {
  document.querySelectorAll('.mock-nav').forEach(function (b) {
    b.classList.toggle('mock-nav-active', b.getAttribute('data-mock-section') === name);
  });
  document.querySelectorAll('.mock-panel').forEach(function (p) {
    p.classList.toggle('hidden', p.getAttribute('data-mock-panel') !== name);
  });
}

mockShowSection('geral');

var mockUserTookOver = false;
function mockUserClick(name) {
  mockUserTookOver = true;
  var cursor = document.getElementById('mock-cursor');
  if (cursor) cursor.style.opacity = '0';
  mockShowSection(name);
}

// ── Mockup do painel: cursor animado percorrendo as abas ────────────────
(function initPanelMockup() {
  var section = document.getElementById('painel-preview');
  var stage   = document.getElementById('mock-stage');
  var cursor  = document.getElementById('mock-cursor');
  if (!section || !stage || !cursor) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var SEQUENCE = [
    { section: 'geral',     hovers: ['#mock-save-geral'] },
    { section: 'limpeza',   hovers: ['#mock-save-limpeza'] },
    { section: 'wifi',      hovers: ['#mock-field-pass', '#mock-save-wifi'] },
    { section: 'aparencia', hovers: ['#mock-theme-2', '#mock-save-aparencia'] },
    { section: 'acesso',    hovers: ['#mock-access-fechadura', '#mock-save-acesso'] }
  ];

  function moveCursorTo(el) {
    var stageRect = stage.getBoundingClientRect();
    var elRect    = el.getBoundingClientRect();
    cursor.style.left = (elRect.left - stageRect.left + elRect.width  * 0.5) + 'px';
    cursor.style.top  = (elRect.top  - stageRect.top  + elRect.height * 0.5) + 'px';
    cursor.style.opacity = '1';
  }

  var running = false;
  var timer = null;

  function runHovers(selectors, i, done) {
    if (mockUserTookOver) return;
    if (i >= selectors.length) { done(); return; }
    var el = document.querySelector(selectors[i]);
    if (!el) { runHovers(selectors, i + 1, done); return; }
    moveCursorTo(el);
    timer = setTimeout(function () {
      if (mockUserTookOver) return;
      el.classList.add('mock-hover');
      timer = setTimeout(function () {
        el.classList.remove('mock-hover');
        runHovers(selectors, i + 1, done);
      }, 1100);
    }, 650);
  }

  function runStep(stepIndex) {
    if (mockUserTookOver) return;
    var step = SEQUENCE[stepIndex % SEQUENCE.length];
    var navBtn = document.querySelector('.mock-nav[data-mock-section="' + step.section + '"]');
    // No celular a barra de abas fica escondida (hidden sm:block) -- nesse caso
    // não tem como mover o cursor até ela (ficaria em 0,0), então só escondemos
    // o cursor e trocamos a aba direto.
    var navVisible = navBtn && navBtn.offsetWidth > 0;
    if (navVisible) {
      moveCursorTo(navBtn);
    } else if (cursor) {
      cursor.style.opacity = '0';
    }
    timer = setTimeout(function () {
      if (mockUserTookOver) return;
      mockShowSection(step.section);
      runHovers(step.hovers, 0, function () {
        if (mockUserTookOver) return;
        timer = setTimeout(function () { runStep(stepIndex + 1); }, 500);
      });
    }, navVisible ? 650 : 300);
  }

  function start() {
    if (running || mockUserTookOver) return;
    running = true;
    timer = setTimeout(function () { runStep(0); }, 600);
  }

  var sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) start();
    });
  }, { threshold: 0.3 });
  sectionObserver.observe(section);
})();

// ── Card Multilíngue: texto alternando entre idiomas ────────────────────
(function initLangCycle() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('[data-lang-cycle]').forEach(function (el) {
    var words = el.getAttribute('data-lang-cycle').split(',');
    var i = 0;
    setInterval(function () {
      i = (i + 1) % words.length;
      el.textContent = words[i];
    }, 1800);
  });
})();

// ── Modal: Sou prestador de serviço ──────────────────────────────────────
const LP_SB_URL = 'https://xhtkwtiskqyiohurwkxg.supabase.co';
const LP_SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhodGt3dGlza3F5aW9odXJ3a3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NjkyMDcsImV4cCI6MjA5NzA0NTIwN30.b815Q3Nv1UaqxaLinyY7nmOJrw5EOGkIJ3HlkdYn0uQ';
const lpSb = window.supabase.createClient(LP_SB_URL, LP_SB_KEY);

const LP_UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const LP_CATEGORIAS = [
  { id: 'eletricista',     label: 'Eletricista' },
  { id: 'encanador',       label: 'Encanador' },
  { id: 'pintor',          label: 'Pintor' },
  { id: 'dedetizador',     label: 'Dedetização' },
  { id: 'ar_condicionado', label: 'Ar-condicionado' },
  { id: 'gas',             label: 'Gás' },
  { id: 'diarista',        label: 'Diarista / Limpeza' },
];

const lpSelectedCategorias = new Set();
let lpUfSelectInit = false;

function lpMaskPhone(el) {
  let v = el.value.replace(/\D/g, '').slice(0, 11);
  if (v.length <= 10) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  else                v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  el.value = v.replace(/-$/, '');
}

function lpShowError(msg) {
  document.getElementById('lp-pr-error-text').textContent = msg;
  document.getElementById('lp-pr-error').classList.remove('hidden');
}

function lpToggleCategoria(id) {
  if (lpSelectedCategorias.has(id)) lpSelectedCategorias.delete(id);
  else lpSelectedCategorias.add(id);
  lpRenderCategorias();
}

function lpRenderCategorias() {
  const c = document.getElementById('lp-pr-categorias');
  c.innerHTML = LP_CATEGORIAS.map(cat => {
    const active = lpSelectedCategorias.has(cat.id);
    return '<button type="button" onclick="lpToggleCategoria(\'' + cat.id + '\')" class="px-3 py-1.5 rounded-full border-2 text-xs font-bold transition-all cursor-pointer '
      + (active ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300') + '">'
      + cat.label + '</button>';
  }).join('');
}

function abrirModalPrestador() {
  if (!lpUfSelectInit) {
    const sel = document.getElementById('lp-pr-estado');
    LP_UFS.forEach(uf => {
      const opt = document.createElement('option');
      opt.value = uf;
      opt.textContent = uf;
      sel.appendChild(opt);
    });
    lpUfSelectInit = true;
  }
  lpRenderCategorias();
  document.getElementById('prestador-modal').classList.remove('hidden');
}

function fecharModalPrestador() {
  document.getElementById('prestador-modal').classList.add('hidden');
}

async function cadastrarPrestador() {
  const nome    = document.getElementById('lp-pr-nome').value.trim();
  const celular = document.getElementById('lp-pr-celular').value.trim();
  const cidade  = document.getElementById('lp-pr-cidade').value.trim();
  const estado  = document.getElementById('lp-pr-estado').value;

  document.getElementById('lp-pr-error').classList.add('hidden');

  if (!nome)                                 { lpShowError('Informe seu nome.'); return; }
  if (celular.replace(/\D/g,'').length < 10) { lpShowError('Informe um celular válido.'); return; }
  if (!cidade)                               { lpShowError('Informe sua cidade.'); return; }
  if (!estado)                               { lpShowError('Selecione seu estado.'); return; }
  if (lpSelectedCategorias.size === 0)       { lpShowError('Selecione ao menos um serviço que você presta.'); return; }

  const btn = document.getElementById('lp-pr-btn-cadastrar');
  btn.disabled = true;
  btn.innerHTML = '<span class="material-icons-outlined text-base">refresh</span> Enviando...';

  const { error } = await lpSb.from('service_providers').insert({
    name:       nome,
    phone:      celular,
    city:       cidade,
    state:      estado,
    categories: Array.from(lpSelectedCategorias),
  });

  if (error) {
    lpShowError('Não foi possível enviar seu cadastro: ' + error.message);
    btn.disabled = false;
    btn.innerHTML = '<span class="material-icons-outlined text-base">handshake</span> Cadastrar';
    return;
  }

  document.getElementById('lp-pr-form-view').classList.add('hidden');
  document.getElementById('lp-pr-success-view').classList.remove('hidden');
}
