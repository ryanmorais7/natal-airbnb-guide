const SB_URL = 'https://xhtkwtiskqyiohurwkxg.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhodGt3dGlza3F5aW9odXJ3a3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NjkyMDcsImV4cCI6MjA5NzA0NTIwN30.b815Q3Nv1UaqxaLinyY7nmOJrw5EOGkIJ3HlkdYn0uQ';
const sb = window.supabase.createClient(SB_URL, SB_KEY);

const isInvite = new URLSearchParams(location.search).get('invite') === '1';

async function initPlanos() {
  if (isInvite) {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { location.href = 'login.html'; return; }
    sessionStorage.setItem('zreg_email',  session.user.email);
    sessionStorage.setItem('zreg_invite', '1');
  } else {
    if (!sessionStorage.getItem('zreg_email')) { location.href = 'cadastro.html'; return; }
  }
  renderPlanos();
}

// ═══════════════════════════════════════════════════
// EDITE OS PLANOS AQUI
// ═══════════════════════════════════════════════════
const PLANOS = [
  {
    id:          'individual',
    nome:        'Individual',
    descricao:   '1 propriedade',
    precoMensal: '13,90',
    precoAnual:  '11,90',   // cobrado como R$ 142,80/ano
    economia:    'R$ 24 de economia no ano',
    destaque:    false,
    badge:       null,
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
    id:          'plus',
    nome:        'Plus',
    descricao:   'Até 15 propriedades',
    maxPropriedades: 15,
    precoMensal: '29,90',
    precoAnual:  '23,90',   // cobrado como R$ 286,80/ano
    economia:    'R$ 72 de economia no ano',
    destaque:    true,
    badge:       'Mais popular',
    itens: [
      { ok: true,  texto: 'Tudo do Individual incluso, em cada propriedade' },
      { ok: true,  texto: 'Até 15 propriedades em um painel só' },
      { ok: true,  texto: 'Acesso (Instrução de acesso a propriedade como Fechadura eletrônica com senha expirável por hóspede)' },
      { ok: false, texto: 'Aparência (6 temas de cores exclusivos)' },
      { ok: false, texto: 'Tela de manutenção (lembretes de enxoval, ar-condicionado, dedetização, pintura e mais)' },
    ],
  },
  {
    id:          'pro',
    nome:        'Pro',
    descricao:   'Até 50 propriedades',
    maxPropriedades: 50,
    precoMensal: '69,90',
    precoAnual:  '54,90',   // cobrado como R$ 658,80/ano
    economia:    'R$ 180 de economia no ano',
    destaque:    false,
    badge:       null,
    itens: [
      { ok: true, texto: 'Tudo do Individual incluso, em cada propriedade' },
      { ok: true, texto: 'Até 50 propriedades em um painel só' },
      { ok: true, texto: 'Aparência (Com 6 temas de cores exclusivos: Oceano, Terracota, Lavanda, Vinho, Ardósia e Oliva)' },
      { ok: true, texto: 'Tela de manutenção (Com lembrete e aviso sobre: Enxoval, ar-condicionado, dedetização, pintura e mais)' },
      { ok: true, texto: 'Acesso (Instrução de acesso a propriedade como Fechadura eletrônica com senha expirável por hóspede)' },
    ],
  },
];
// ═══════════════════════════════════════════════════

let anual = false;

function alternarPeriodo() {
  anual = !anual;
  const toggle = document.getElementById('toggle');
  const lblM   = document.getElementById('lbl-mensal');
  const lblA   = document.getElementById('lbl-anual');
  const badge  = document.getElementById('badge-economia');
  toggle.classList.toggle('on', anual);
  lblM.className  = 'text-sm font-bold ' + (anual ? 'text-gray-400' : 'text-gray-900');
  lblA.className  = 'text-sm font-bold ' + (anual ? 'text-gray-900' : 'text-gray-400');
  badge.classList.toggle('hidden', !anual);
  renderPlanos();
}

function renderPlanos() {
  const grid = document.getElementById('planos-grid');
  grid.innerHTML = PLANOS.map(p => {
    const preco    = anual ? p.precoAnual : p.precoMensal;
    const economia = anual ? '<p class="text-xs text-green-600 font-bold mt-0.5">' + p.economia + '</p>' : '';
    const badgeHtml = p.badge
      ? '<div class="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-extrabold uppercase tracking-widest px-4 py-1 rounded-full shadow whitespace-nowrap">' + p.badge + '</div>'
      : '';
    const itens = [...p.itens].sort((a, b) => (a.ok === b.ok) ? 0 : (a.ok ? -1 : 1)).map(i =>
      '<li class="flex items-center gap-2 text-sm ' + (i.ok ? 'text-gray-700' : 'text-white') + '">'
      + '<span class="material-icons-outlined ' + (i.ok ? 'text-primary' : 'text-white') + '" style="font-size:15px">'
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
      ? 'w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-light transition-all shadow-lg shadow-primary/20'
      : 'w-full py-3 rounded-xl border-2 border-primary text-primary font-bold text-sm hover:bg-primary hover:text-white transition-all';

    return '<div class="plan-card bg-white rounded-2xl p-6 flex flex-col relative shadow-sm ' + (p.destaque ? 'destaque shadow-primary/10' : '') + '" onclick="escolher(\'' + p.id + '\',\'' + p.nome + '\',\'' + preco + '\')">'
      + badgeHtml
      + '<div class="mb-4">'
      + '<p class="text-xs font-extrabold uppercase tracking-widest ' + (p.destaque ? 'text-primary' : 'text-gray-400') + ' mb-0.5">' + p.nome + '</p>'
      + '<p class="font-sans text-4xl text-gray-900 font-black tracking-tight">R$ ' + preco + '<span class="text-base font-sans font-semibold text-gray-400">/mês</span></p>'
      + '<p class="text-xs text-gray-400 mt-0.5">' + (anual ? 'Cobrado anualmente' : 'Cobrado mensalmente') + '</p>'
      + economia
      + '</div>'
      + '<p class="text-xs font-bold text-gray-400 mb-3 flex items-center gap-1"><span class="material-icons-outlined" style="font-size:13px">home</span>' + p.descricao + '</p>'
      + '<ul class="space-y-2 flex-1 mb-5">' + itens + '</ul>'
      + porPropriedade
      + '<div class="bg-primary/5 border border-primary/15 rounded-xl px-3 py-2 flex items-center gap-2 mb-4">'
      + '<span class="material-icons-outlined text-primary" style="font-size:16px">card_giftcard</span>'
      + '<span class="text-xs font-bold text-primary">7 dias grátis para testar</span>'
      + '</div>'
      + '<button class="' + btnClass + '" onclick="escolher(\'' + p.id + '\',\'' + p.nome + '\',\'' + preco + '\')">'
      + 'Escolher ' + p.nome + '</button>'
      + '</div>';
  }).join('');
}

function escolher(id, nome, preco) {
  const periodo = anual ? 'anual' : 'mensal';
  sessionStorage.setItem('zreg_plano_id',      id);
  sessionStorage.setItem('zreg_plano_nome',    nome);
  sessionStorage.setItem('zreg_plano_preco',   preco);
  sessionStorage.setItem('zreg_plano_periodo', periodo);
  setTimeout(() => location.href = 'pagamento.html', 150);
}

initPlanos();
