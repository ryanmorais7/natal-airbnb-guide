const SB_URL = 'https://xhtkwtiskqyiohurwkxg.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhodGt3dGlza3F5aW9odXJ3a3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NjkyMDcsImV4cCI6MjA5NzA0NTIwN30.b815Q3Nv1UaqxaLinyY7nmOJrw5EOGkIJ3HlkdYn0uQ';
const sb = window.supabase.createClient(SB_URL, SB_KEY);

let allHosts   = [];
let allContent = {};
let allLeads   = [];
let editingHostId = null;

async function init() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { location.href = 'login.html'; return; }

  // Check admin
  const { data: me } = await sb.from('hosts').select('is_admin').eq('id', session.user.id).single();
  if (!me || !me.is_admin) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('not-admin').classList.remove('hidden');
    return;
  }

  loadDashboard();
  loadLeads();
}

async function loadLeads() {
  const { data, error } = await sb.from('leads').select('*').order('created_at', { ascending: false });
  if (error) return;
  allLeads = data || [];
  document.getElementById('leads-count').textContent = allLeads.length;
  renderLeads();
}

function toggleLeads() {
  document.getElementById('leads-section').classList.toggle('hidden');
}

function renderLeads() {
  const list  = document.getElementById('leads-list');
  const empty = document.getElementById('leads-empty');
  if (!allLeads.length) { list.innerHTML = ''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  list.innerHTML = allLeads.map(l => `
    <div class="flex items-center gap-3 bg-white rounded-xl border border-amber-100 px-4 py-3">
      <div class="flex-1 min-w-0">
        <p class="text-sm font-bold text-gray-800 truncate">${escHtml(l.email)}</p>
        <p class="text-xs text-gray-400">${l.phone ? escHtml(l.phone) + ' · ' : ''}${new Date(l.created_at).toLocaleDateString('pt-BR')}${l.plano_interesse ? ' · ' + escHtml(l.plano_interesse) : ''}</p>
      </div>
      <label class="flex items-center gap-1.5 text-xs font-bold text-gray-500 cursor-pointer flex-shrink-0">
        <input type="checkbox" ${l.contacted ? 'checked' : ''} onchange="toggleContacted('${l.id}', this.checked)">
        Contatado
      </label>
      <button onclick="excluirLead('${l.id}', '${escAttr(l.email)}')" title="Remover lead" class="text-gray-300 hover:text-red-500 flex-shrink-0">
        <span class="material-icons-outlined" style="font-size:18px">close</span>
      </button>
    </div>
  `).join('');
}

async function toggleContacted(id, checked) {
  await sb.from('leads').update({ contacted: checked, updated_at: new Date().toISOString() }).eq('id', id);
  const lead = allLeads.find(l => l.id === id);
  if (lead) lead.contacted = checked;
}

async function excluirLead(id, email) {
  if (!confirm(`Remover o lead "${email}" da lista?`)) return;
  await sb.from('leads').delete().eq('id', id);
  allLeads = allLeads.filter(l => l.id !== id);
  document.getElementById('leads-count').textContent = allLeads.length;
  renderLeads();
}

async function loadDashboard() {
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('dashboard').classList.add('hidden');

  // Load all hosts (propriedades extras de uma conta Pro ficam escondidas aqui, tem owner_id preenchido)
  const { data: hosts } = await sb.from('hosts').select('*').order('created_at', { ascending: false });
  allHosts = (hosts || []).filter(h => !h.owner_id);

  // Load all guide_content
  const { data: contents } = await sb.from('guide_content').select('*');
  allContent = {};
  (contents || []).forEach(c => { allContent[c.host_id] = c; });

  // Stats
  const withSlug    = allHosts.filter(h => h.slug).length;
  const withContent = allHosts.filter(h => allContent[h.id]).length;
  const lastUpd     = (contents || []).map(c => c.updated_at).sort().pop();

  document.getElementById('stat-hosts').textContent   = allHosts.length;
  document.getElementById('stat-guides').textContent  = withContent;
  document.getElementById('stat-slugs').textContent   = withSlug;
  document.getElementById('stat-updated').textContent = lastUpd
    ? new Date(lastUpd).toLocaleDateString('pt-BR', { day:'2-digit', month:'short' })
    : '—';

  document.getElementById('loading').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');

  renderHosts(allHosts);
}

function filterHosts() {
  const q = document.getElementById('search-input').value.toLowerCase();
  const filtered = allHosts.filter(h =>
    (h.property_name || '').toLowerCase().includes(q) ||
    (h.email         || '').toLowerCase().includes(q) ||
    (h.slug          || '').toLowerCase().includes(q) ||
    (h.owner_name    || '').toLowerCase().includes(q)
  );
  renderHosts(filtered);
}

function renderHosts(hosts) {
  const container = document.getElementById('hosts-list');
  const noRes     = document.getElementById('no-results');

  if (hosts.length === 0) {
    container.innerHTML = '';
    noRes.classList.remove('hidden');
    return;
  }
  noRes.classList.add('hidden');

  container.innerHTML = hosts.map(h => {
    const c    = allContent[h.id] || {};
    const slug = h.slug;
    const hasContent = !!allContent[h.id];
    const lastUpd = c.updated_at
      ? new Date(c.updated_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'2-digit' })
      : null;

    const items = [
      (c.restaurants || []).length,
      (c.markets     || []).length,
      (c.pharmacies  || []).length,
      (c.activities  || []).length,
      (c.gyms        || []).length,
      (c.emergency   || []).length,
    ].reduce((a, b) => a + b, 0);

    return `
    <div class="host-card p-4 sm:p-5">
      <div class="flex items-start gap-3 sm:gap-4 flex-wrap">
        <!-- Avatar -->
        <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white text-base sm:text-lg"
          style="background:${colorFromStr(h.email || h.id)}">
          ${(h.property_name || h.email || '?')[0].toUpperCase()}
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap mb-1">
            <p class="font-bold text-gray-900 text-sm">${escHtml(h.property_name || 'Sem nome')}</p>
            ${h.is_admin ? '<span class="badge bg-amber-100 text-amber-700">ADMIN</span>' : ''}
            ${hasContent
              ? '<span class="badge bg-green-100 text-green-700"><span class="material-icons-outlined" style="font-size:10px">check_circle</span>Configurado</span>'
              : '<span class="badge bg-gray-100 text-gray-500">Pendente</span>'
            }
          </div>
          <p class="text-xs text-gray-400 mb-1">
            <span class="material-icons-outlined align-middle" style="font-size:11px">mail</span> ${escHtml(h.email || '—')}
            · <span class="material-icons-outlined align-middle" style="font-size:11px">person</span> ${escHtml(h.owner_name || 'Anfitrião')}
          </p>
          <div class="flex items-center gap-2 flex-wrap mb-1">
            ${h.phone ? `<span class="flex items-center gap-0.5 text-xs text-gray-400"><span class="material-icons-outlined" style="font-size:11px">phone</span>${escHtml(h.phone)}</span>` : ''}
            ${h.plan_name
              ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${h.plan_active ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}">
                  <span class="material-icons-outlined" style="font-size:10px">workspace_premium</span>${escHtml(h.plan_name)}</span>`
              : '<span class="text-[10px] text-gray-300 font-semibold">Sem plano</span>'
            }
            ${h.subscription_status === 'convidada'
              ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                  <span class="material-icons-outlined" style="font-size:10px">card_giftcard</span>Convidada</span>`
              : ''
            }
          </div>
          <div class="flex items-center gap-3 flex-wrap text-xs text-gray-400">
            ${slug ? `<span class="flex items-center gap-1"><span class="material-icons-outlined" style="font-size:12px">link</span>?h=${escHtml(slug)}</span>` : '<span class="text-gray-300">Sem slug</span>'}
            ${items > 0 ? `<span>${items} indicações</span>` : ''}
            ${lastUpd ? `<span>Atualizado ${lastUpd}</span>` : ''}
          </div>
        </div>

        <!-- Actions: envolve para baixo no mobile, fica ao lado no desktop -->
        <div class="flex items-center gap-2 w-full sm:w-auto border-t border-gray-100 sm:border-0 pt-3 sm:pt-0 mt-1 sm:mt-0">
          <a href="guia.html" target="_blank"
            class="action-btn bg-gray-100 text-gray-600 hover:bg-gray-200 flex-1 sm:flex-none justify-center sm:justify-start">
            <span class="material-icons-outlined" style="font-size:14px">open_in_new</span>
            Ver Guia
          </a>
          <button onclick="openEdit('${h.id}')"
            class="action-btn bg-primary/10 text-primary hover:bg-primary hover:text-white flex-1 sm:flex-none justify-center sm:justify-start">
            <span class="material-icons-outlined" style="font-size:14px">edit</span>
            Editar
          </button>
          <button onclick="gerarCartaoAdmin('${h.id}')"
            class="action-btn bg-gray-100 text-gray-600 hover:bg-gray-200"
            title="Gerar cartão imprimível">
            <span class="material-icons-outlined" style="font-size:14px">print</span>
          </button>
          ${(!h.is_admin && !h.is_demo && h.subscription_status === 'authorized')
            ? `<button onclick="cancelarAssinatura('${h.id}', '${escAttr(h.property_name || h.email || '')}')"
                class="action-btn bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white"
                title="Cancelar assinatura">
                <span class="material-icons-outlined" style="font-size:14px">cancel</span>
              </button>`
            : ''
          }
          <button onclick="deleteHost('${h.id}', '${escAttr(h.email || '')}')"
            class="action-btn bg-red-50 text-red-400 hover:bg-red-500 hover:text-white"
            title="Excluir anfitrião">
            <span class="material-icons-outlined" style="font-size:14px">delete_outline</span>
          </button>
        </div>
      </div>
    </div>
    `;
  }).join('');
}

// ── Cartão imprimível (admin) ─────────────────────────────────────────
function gerarCartaoAdmin(hostId) {
  const c = allContent[hostId] || {};
  const h = allHosts.find(x => x.id === hostId) || {};
  const wifiName  = c.wifi_name     || '';
  const wifiPass  = c.wifi_password || '';
  const propName  = c.property_name || h.property_name || 'Propriedade';
  const slug      = h.slug || '';
  const guideUrl  = slug
    ? location.href.replace('admin.html', 'guia.html') + '?h=' + slug
    : location.href.replace('admin.html', 'guia.html');
  const cor       = (c.theme_color || '#4A6741').replace('#', '');
  const corHex    = '#' + cor;
  const wifiQrData = 'WIFI:T:WPA;S:' + wifiName + ';P:' + wifiPass + ';;';
  const wifiQrSrc  = 'https://api.qrserver.com/v1/create-qr-code/?size=160x160&color=' + cor + '&bgcolor=ffffff&data=' + encodeURIComponent(wifiQrData) + '&margin=0';
  const guideQrSrc = 'https://api.qrserver.com/v1/create-qr-code/?size=160x160&color=' + cor + '&bgcolor=ffffff&data=' + encodeURIComponent(guideUrl) + '&margin=0';

  const html = '<!DOCTYPE html>'
    + '<html lang="pt-BR"><head><meta charset="UTF-8"/>'
    + '<title>Cartão — ' + propName + '<\/title>'
    + '<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Nunito+Sans:wght@400;700;800&display=swap" rel="stylesheet"/>'
    + '<style>'
    + '*{margin:0;padding:0;box-sizing:border-box;}'
    + 'body{font-family:"Nunito Sans",sans-serif;background:#efefef;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px;gap:16px;}'
    + '.btn-print{background:' + corHex + ';color:#fff;border:none;padding:11px 26px;border-radius:10px;font-weight:800;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:8px;}'
    + '.card{width:10cm;min-height:15cm;background:#fff;border-radius:18px;padding:1cm .85cm;display:flex;flex-direction:column;align-items:center;box-shadow:0 8px 40px rgba(0,0,0,.13);}'
    + '.prop{font-family:"DM Serif Display",serif;font-size:20px;color:#111;text-align:center;line-height:1.2;margin-bottom:4px;}'
    + '.welcome{font-size:9.5px;font-weight:700;letter-spacing:.1em;color:#bbb;text-align:center;margin-bottom:.4cm;text-transform:uppercase;}'
    + '.qr-row{display:flex;gap:.35cm;width:100%;justify-content:center;margin-bottom:.35cm;}'
    + '.qr-card{flex:1;display:flex;flex-direction:column;align-items:center;gap:7px;background:#f9fafb;border:1.5px solid #f0f0f0;border-radius:12px;padding:10px 8px;}'
    + '.qr-card img{border-radius:6px;display:block;}'
    + '.qr-tag{font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:' + corHex + ';text-align:center;}'
    + '.qr-sub{font-size:7.5px;color:#bbb;font-weight:600;text-align:center;line-height:1.3;}'
    + '.divider{width:100%;height:1px;background:linear-gradient(to right,transparent,#e5e7eb,transparent);margin:.25cm 0;}'
    + '.wifi-box{width:100%;background:#f9fafb;border:1.5px solid #f0f0f0;border-radius:11px;padding:10px 12px;display:flex;flex-direction:column;gap:7px;}'
    + '.wifi-row{display:flex;flex-direction:column;gap:1px;}'
    + '.wifi-lbl{font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#bbb;}'
    + '.wifi-val{font-size:13px;font-weight:700;color:#222;}'
    + '.wifi-pass{font-family:"Courier New",monospace;font-size:14px;font-weight:700;color:' + corHex + ';word-break:break-all;}'
    + '.footer{margin-top:auto;padding-top:.35cm;font-size:8px;color:#ccc;text-align:center;letter-spacing:.05em;}'
    + '@media print{body{background:#fff;padding:0;}.btn-print{display:none;}.card{box-shadow:none;border-radius:0;min-height:0;}@page{size:10cm 15cm;margin:0;}}'
    + '<\/style><\/head><body>'
    + '<button class="btn-print" onclick="window.print()">'
    + '<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"><\/path><\/svg>'
    + ' Imprimir cartão<\/button>'
    + '<div class="card">'
    + '<p class="prop">' + propName + '<\/p>'
    + '<p class="welcome">Bem-vindo · Welcome · Bienvenido<\/p>'
    + '<div class="qr-row">'
    + '<div class="qr-card"><img src="' + guideQrSrc + '" width="118" height="118" alt="Guia"/><p class="qr-tag">Guia do Hóspede<\/p><p class="qr-sub">Escaneie para abrir<br\/>o guia completo<\/p><\/div>'
    + '<div class="qr-card"><img src="' + wifiQrSrc + '" width="118" height="118" alt="Wi-Fi"/><p class="qr-tag">Conectar Wi-Fi<\/p><p class="qr-sub">Escaneie para conectar<br\/>automaticamente<\/p><\/div>'
    + '<\/div>'
    + '<div class="divider"><\/div>'
    + '<div class="wifi-box">'
    + '<div class="wifi-row"><p class="wifi-lbl">Rede · Network<\/p><p class="wifi-val">' + (wifiName || '—') + '<\/p><\/div>'
    + '<div class="wifi-row"><p class="wifi-lbl">Senha · Password<\/p><p class="wifi-pass">' + (wifiPass || '—') + '<\/p><\/div>'
    + '<\/div>'
    + '<p class="footer">Gerado por AirGuia<\/p>'
    + '<\/div><\/body><\/html>';

  const win = window.open('', '_blank', 'width=520,height=750');
  if (!win) { showToast('⚠ Permita pop-ups para gerar o cartão.'); return; }
  win.document.write(html);
  win.document.close();
}

// ── Admin Acesso ──────────────────────────────────────────────────────
// ── Maps: conversão automática link → embed ───────────────────────────
function mapsUrlToEmbed(url) {
  if (!url) return '';
  url = url.trim();
  if (url.includes('output=embed') || url.includes('/maps/embed')) return url;
  var coord = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coord) return 'https://www.google.com/maps?q=' + coord[1] + ',' + coord[2] + '&output=embed';
  try {
    var u = new URL(url);
    var q = u.searchParams.get('q') || u.searchParams.get('query');
    if (q) return 'https://www.google.com/maps?q=' + encodeURIComponent(q) + '&output=embed';
  } catch(e) {}
  var place = url.match(/\/maps\/place\/([^/@?]+)/);
  if (place) return 'https://www.google.com/maps?q=' + encodeURIComponent(decodeURIComponent(place[1].replace(/\+/g,' '))) + '&output=embed';
  return '';
}

function adminAutoFillEmbed() {
  const mapsVal = (document.getElementById('m-maps')?.value || '').trim();
  const embedEl = document.getElementById('m-embed');
  const hintEl  = document.getElementById('m-embed-hint');
  if (!embedEl) return;
  const generated = mapsUrlToEmbed(mapsVal);
  if (generated) {
    embedEl.value = generated;
    if (hintEl) { hintEl.textContent = '(✓ gerado automaticamente)'; hintEl.style.color = '#16a34a'; }
  } else if (mapsVal) {
    if (hintEl) { hintEl.textContent = '(cole manualmente)'; hintEl.style.color = '#d97706'; }
  } else {
    if (hintEl) { hintEl.textContent = '(auto-preenchido)'; hintEl.style.color = ''; }
  }
}

function renderAdminAccessFields() {
  const type = document.getElementById('m-access-type').value;
  const c    = document.getElementById('m-access-fields');
  if (!c) return;
  const inp = (lbl, id, tp, ph, cls) =>
    '<div><label class="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">' + lbl + '<\/label>'
    + '<input id="' + id + '" type="' + tp + '" placeholder="' + (ph||'') + '" class="' + (cls || 'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary') + '"/><\/div>';
  const ta = (lbl, id, ph, hint) =>
    '<div><label class="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">' + lbl + '<\/label>'
    + (hint ? '<p class="text-xs text-gray-400 -mt-1 mb-1.5">' + hint + '<\/p>' : '')
    + '<textarea id="' + id + '" rows="3" placeholder="' + (ph||'') + '" class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"><\/textarea><\/div>';
  const hint = 'Cada linha = 1 passo numerado no guia.';
  let h = '';
  if (type === 'fechadura') {
    h += '<div class="grid grid-cols-2 gap-3">'
      + inp('Código', 'm-lockcode', 'text', 'Ex: 5478', 'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary')
      + inp('Válido até', 'm-lockvalid', 'date', '')
      + '<\/div>';
    h += ta('Instruções de entrada', 'm-access-instructions', 'Ex: Suba pela escada\nPressione a fechadura\nDigite o código e puxe', hint);
  } else if (type === 'chave') {
    h += inp('Onde retirar a chave', 'm-access-location', 'text', 'Ex: Na portaria, com o síndico...');
    h += inp('Contato', 'm-access-contact', 'tel', 'Ex: (84) 99999-9999');
    h += ta('Instruções de entrada', 'm-access-instructions', 'Ex: Retire a chave na portaria\nSiga pelo corredor\nUse a chave para abrir', hint);
  } else if (type === 'portaria') {
    h += ta('Instruções para a portaria', 'm-access-instructions', 'Ex: Informe seu nome na recepção...', hint);
    h += inp('Contato da portaria', 'm-access-contact', 'tel', 'Ex: (84) 99999-9999');
  } else {
    h += ta('Instruções de acesso', 'm-access-instructions', 'Descreva como o hóspede acessa a propriedade...', hint);
  }
  c.innerHTML = h;
}

// ── Admin Limpeza ─────────────────────────────────────────────────────
const ADMIN_LIMPEZA_GRUPOS = [
  { id: 'cama',     label: 'Cama',     icon: 'bed',       itens: [
    { id: 'lencol', label: 'Lençol de casal' }, { id: 'fronha', label: 'Fronha (x2)' },
    { id: 'cobertor', label: 'Cobertor / Edredom' }, { id: 'travesseiro', label: 'Travesseiro (x2)' },
  ]},
  { id: 'banheiro', label: 'Banheiro', icon: 'shower',    itens: [
    { id: 'toalha-banho', label: 'Toalha de banho (x2)' }, { id: 'toalha-rosto', label: 'Toalha de rosto (x2)' },
    { id: 'tapete-ban', label: 'Tapete de banheiro' }, { id: 'papel', label: 'Papel higiênico' }, { id: 'sabonete', label: 'Sabonete / Shampoo' },
  ]},
  { id: 'cozinha',  label: 'Cozinha',  icon: 'kitchen',   itens: [
    { id: 'pratos', label: 'Pratos' }, { id: 'copos', label: 'Copos / Xícaras' },
    { id: 'talheres', label: 'Talheres' }, { id: 'panelas', label: 'Panelas / Frigideira' }, { id: 'detergente', label: 'Detergente + Esponja' },
  ]},
  { id: 'geral',    label: 'Geral',    icon: 'home_work', itens: [
    { id: 'almofadas', label: 'Almofadas' }, { id: 'tapete-sal', label: 'Tapete da sala' },
    { id: 'lixo', label: 'Lixo esvaziado' }, { id: 'chao', label: 'Chão varrido / lavado' }, { id: 'janelas', label: 'Janelas limpas' },
  ]},
];
const ADMIN_LIMP_EST = {
  ok:       { label: 'OK',                icon: 'check_circle',      bg: 'bg-green-100', cor: 'text-green-600' },
  atencao:  { label: 'Precisa Limpar',    icon: 'cleaning_services', bg: 'bg-amber-100', cor: 'text-amber-600' },
  faltando: { label: 'Trocar/Substituir', icon: 'autorenew',         bg: 'bg-red-100',   cor: 'text-red-600'   },
};
const ADMIN_CICLO = ['ok', 'atencao', 'faltando'];
let adminLimpezaState        = {};
let adminLimpezaCustomGroups = { extra_itens: {}, custom_groups: [] };

function adminGetAllLimpezaGroups() {
  const defaults = ADMIN_LIMPEZA_GRUPOS.map(g => ({
    ...g,
    allItens: [
      ...g.itens,
      ...(adminLimpezaCustomGroups.extra_itens[g.id] || [])
    ]
  }));
  const customs = (adminLimpezaCustomGroups.custom_groups || []).map(cg => ({
    ...cg,
    allItens: cg.itens || []
  }));
  return [...defaults, ...customs];
}

function renderAdminLimpeza() {
  const c = document.getElementById('m-limpeza-groups');
  if (!c) return;
  const allGroups = adminGetAllLimpezaGroups();
  let h = '';
  for (const g of allGroups) {
    h += '<div class="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">';
    h += '<div class="flex items-center gap-1.5 px-3 py-2 border-b border-gray-100">';
    h += '<span class="material-icons-outlined text-gray-400" style="font-size:15px">' + g.icon + '<\/span>';
    h += '<span class="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">' + g.label + '<\/span><\/div>';
    h += '<div>';
    for (const item of g.allItens) {
      const est = adminLimpezaState[item.id] || 'ok';
      const e   = ADMIN_LIMP_EST[est];
      h += '<div class="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors select-none border-b border-gray-100 last:border-0" onclick="toggleAdminLimpeza(\'' + item.id + '\')">';
      h += '<div class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ' + e.bg + ' ' + e.cor + '">';
      h += '<span class="material-icons-outlined" style="font-size:11px">' + e.icon + '<\/span><\/div>';
      h += '<span class="flex-1 text-xs font-semibold text-gray-700">' + item.label + '<\/span>';
      h += '<span class="text-[10px] font-bold ' + e.cor + '">' + e.label + '<\/span><\/div>';
    }
    h += '<\/div><\/div>';
  }
  c.innerHTML = h;
}

function toggleAdminLimpeza(id) {
  const cur = adminLimpezaState[id] || 'ok';
  adminLimpezaState[id] = ADMIN_CICLO[(ADMIN_CICLO.indexOf(cur) + 1) % 3];
  renderAdminLimpeza();
}

// ── Themes ────────────────────────────────────────────────────────────
const ADMIN_THEMES = [
  { id: 'oliva',     name: 'Oliva',     color: '#4A6741', light: '#6B8E61' },
  { id: 'oceano',    name: 'Oceano',    color: '#3D6680', light: '#5C8AA3' },
  { id: 'terracota', name: 'Terracota', color: '#A8643C', light: '#C58659' },
  { id: 'lavanda',   name: 'Lavanda',   color: '#6F5B96', light: '#8D7AB5' },
  { id: 'vinho',     name: 'Vinho',     color: '#8C4259', light: '#A8637A' },
  { id: 'ardosia',   name: 'Ardósia',   color: '#334155', light: '#64748B' },
];
let adminSelectedTheme = 'oliva';

function renderAdminThemePicker() {
  const container = document.getElementById('m-theme-picker');
  if (!container) return;
  container.innerHTML = ADMIN_THEMES.map(t => {
    const active = adminSelectedTheme === t.id;
    return `<button type="button" onclick="adminSelectTheme('${t.id}')"
      class="rounded-xl overflow-hidden border-2 transition-all ${active ? 'border-gray-800 shadow-md scale-[1.04]' : 'border-gray-100 hover:border-gray-300'}">
      <div class="h-8" style="background:linear-gradient(135deg,${t.color},${t.light})"></div>
      <div class="py-1.5 px-2 bg-white flex items-center justify-between">
        <span class="text-[11px] font-bold text-gray-700">${t.name}</span>
        ${active ? `<span class="material-icons-outlined" style="font-size:13px;color:${t.color}">check_circle</span>` : ''}
      </div>
    </button>`;
  }).join('');
  document.getElementById('m-theme-id').value    = adminSelectedTheme;
  const t = ADMIN_THEMES.find(x => x.id === adminSelectedTheme) || ADMIN_THEMES[0];
  document.getElementById('m-theme-color').value = t.color;
  document.getElementById('m-theme-light').value = t.light;
}

function adminSelectTheme(id) {
  adminSelectedTheme = id;
  renderAdminThemePicker();
}

// ── Edit modal ────────────────────────────────────────────────────────
function openEdit(hostId) {
  const c = allContent[hostId] || {};
  const h = allHosts.find(x => x.id === hostId) || {};
  editingHostId = hostId;

  document.getElementById('m-email').value      = h.email         || '—';
  document.getElementById('m-phone').value      = h.phone         || '—';
  document.getElementById('m-propname').value   = c.property_name || h.property_name || '';
  document.getElementById('m-owner').value          = h.owner_name          || '';
  document.getElementById('m-slug').value           = h.slug               || '';
  document.getElementById('m-plan-id').value        = h.plan_id            || '';
  document.getElementById('m-sub-status').value     = h.subscription_status || '';
  const remainingDays = h.trial_ends_at ? Math.ceil((new Date(h.trial_ends_at) - Date.now()) / 86400000) : null;
  document.getElementById('m-trial-days').value     = (remainingDays !== null && remainingDays > 0) ? remainingDays : '';
  document.getElementById('m-is-demo').checked      = !!h.is_demo;
  document.getElementById('m-address').value   = c.address       || '';
  document.getElementById('m-checkin').value   = c.checkin_time  || '13:00';
  document.getElementById('m-checkout').value  = c.checkout_time || '11:00';
  document.getElementById('m-maps').value      = c.maps_url      || '';
  document.getElementById('m-embed').value     = c.maps_embed    || '';
  document.getElementById('m-heroimg').value   = c.hero_image_url   || '';
  document.getElementById('m-welcome').value   = c.welcome_message  || '';
  document.getElementById('m-wname').value     = c.wifi_name        || '';
  document.getElementById('m-wpass').value     = c.wifi_password    || '';
  document.getElementById('m-wqr').value       = c.wifi_qr_url      || '';
  const at = (c.access_type === 'cofre') ? 'outro' : (c.access_type || 'fechadura');
  document.getElementById('m-access-type').value = at;
  renderAdminAccessFields();
  if (at === 'fechadura') {
    const lc = document.getElementById('m-lockcode');
    const lv = document.getElementById('m-lockvalid');
    if (lc) lc.value = c.lock_code || '';
    if (lv) lv.value = c.lock_code_valid_until || '';
  }
  if (at === 'chave') { const el = document.getElementById('m-access-location'); if (el) el.value = c.access_location || ''; }
  if (at === 'chave' || at === 'portaria') { const el = document.getElementById('m-access-contact'); if (el) el.value = c.access_contact || ''; }
  { const el = document.getElementById('m-access-instructions'); if (el) el.value = c.access_instructions || ''; }
  adminLimpezaState        = c.cleaning_state  ? { ...c.cleaning_state }              : {};
  adminLimpezaCustomGroups = c.cleaning_groups ? JSON.parse(JSON.stringify(c.cleaning_groups)) : { extra_itens: {}, custom_groups: [] };
  if (!adminLimpezaCustomGroups.extra_itens)   adminLimpezaCustomGroups.extra_itens   = {};
  if (!adminLimpezaCustomGroups.custom_groups) adminLimpezaCustomGroups.custom_groups = [];
  renderAdminLimpeza();
  document.getElementById('m-rules').value = c.rules || '';
  const ri = c.room_items || {};
  document.getElementById('m-room-bedroom').value = (ri.bedroom  || []).join(', ');
  document.getElementById('m-room-kitchen').value  = (ri.kitchen  || []).join(', ');
  document.getElementById('m-room-bathroom').value = (ri.bathroom || []).join(', ');
  adminSelectedTheme = c.theme_id || 'oliva';
  renderAdminThemePicker();

  document.getElementById('edit-modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('edit-modal').classList.add('hidden');
  editingHostId = null;
}

async function saveModal() {
  if (!editingHostId) return;
  const existing = allContent[editingHostId] || {};
  const updates = {
    host_id:               editingHostId,
    ...existing,
    property_name:         document.getElementById('m-propname').value.trim(),
    address:               document.getElementById('m-address').value.trim(),
    checkin_time:          document.getElementById('m-checkin').value,
    checkout_time:         document.getElementById('m-checkout').value,
    maps_url:              document.getElementById('m-maps').value.trim(),
    maps_embed:            document.getElementById('m-embed').value.trim(),
    hero_image_url:        document.getElementById('m-heroimg').value.trim(),
    welcome_message:       document.getElementById('m-welcome').value.trim(),
    wifi_name:             document.getElementById('m-wname').value.trim(),
    wifi_password:         document.getElementById('m-wpass').value.trim(),
    wifi_qr_url:           document.getElementById('m-wqr').value.trim(),
    access_type:           document.getElementById('m-access-type').value || 'fechadura',
    lock_code:             (document.getElementById('m-lockcode')?.value || '').trim() || null,
    lock_code_valid_until: document.getElementById('m-lockvalid')?.value || null,
    access_location:       (document.getElementById('m-access-location')?.value || '').trim(),
    access_contact:        (document.getElementById('m-access-contact')?.value || '').trim(),
    access_instructions:   (document.getElementById('m-access-instructions')?.value || '').trim(),
    cleaning_state:        adminLimpezaState,
    cleaning_groups:       adminLimpezaCustomGroups,
    rules:                 document.getElementById('m-rules').value.trim(),
    room_items: {
      bedroom:  document.getElementById('m-room-bedroom').value.split(',').map(s => s.trim()).filter(Boolean),
      kitchen:  document.getElementById('m-room-kitchen').value.split(',').map(s => s.trim()).filter(Boolean),
      bathroom: document.getElementById('m-room-bathroom').value.split(',').map(s => s.trim()).filter(Boolean),
    },
    theme_id:              document.getElementById('m-theme-id').value || 'oliva',
    theme_color:           document.getElementById('m-theme-color').value || '#4A6741',
    theme_color_light:     document.getElementById('m-theme-light').value || '#6B8E61',
    updated_at:            new Date().toISOString(),
  };

  const { error } = await sb.from('guide_content').upsert(updates);
  if (error) { alert('Erro ao salvar: ' + error.message); return; }

  // Update hosts table (name, slug, property_name)
  const subStatus = document.getElementById('m-sub-status').value;
  const planId     = document.getElementById('m-plan-id').value;
  const planName   = planId === 'pro' ? 'Pro' : planId === 'individual' ? 'Individual' : null;
  const trialDaysRaw = document.getElementById('m-trial-days').value.trim();
  const trialEndsAt  = trialDaysRaw
    ? new Date(Date.now() + Number(trialDaysRaw) * 86400000).toISOString()
    : null;
  const planActive = subStatus === 'authorized' || subStatus === 'convidada';
  await sb.from('hosts').update({
    property_name:       updates.property_name,
    owner_name:          document.getElementById('m-owner').value.trim(),
    slug:                document.getElementById('m-slug').value.trim(),
    plan_id:             planId || null,
    plan_name:           planName,
    subscription_status: subStatus || null,
    plan_active:         planActive,
    is_demo:             document.getElementById('m-is-demo').checked,
    trial_ends_at:       trialEndsAt,
  }).eq('id', editingHostId);

  const host = allHosts.find(h => h.id === editingHostId);
  if (host) {
    host.property_name = updates.property_name;
    host.owner_name    = document.getElementById('m-owner').value.trim();
    host.slug          = document.getElementById('m-slug').value.trim();
    host.plan_id       = planId || null;
    host.plan_name     = planName;
    host.subscription_status = subStatus || null;
    host.plan_active   = planActive;
    host.is_demo       = document.getElementById('m-is-demo').checked;
    host.trial_ends_at = trialEndsAt;
  }

  allContent[editingHostId] = updates;

  closeModal();
  renderHosts(allHosts);
  showToast('✓ Guia atualizado!');
}

// ── Delete host ───────────────────────────────────────────────────────
async function deleteHost(hostId, email) {
  if (!confirm(`Remover o anfitrião "${email}"?\n\nEsta ação remove o perfil e o conteúdo do guia. O usuário em si precisa ser deletado no Supabase Dashboard (Authentication → Users).`)) return;

  const { error } = await sb.from('hosts').delete().eq('id', hostId);
  if (error) { alert('Erro: ' + error.message); return; }

  allHosts = allHosts.filter(h => h.id !== hostId);
  delete allContent[hostId];
  renderHosts(allHosts);
  showToast('Anfitrião removido.');
}

// ── Cancelar assinatura ─────────────────────────────────────────────────
async function cancelarAssinatura(hostId, nome) {
  if (!confirm(`Cancelar a assinatura de "${nome}"?\n\nAs cobranças futuras no Mercado Pago param imediatamente, e o painel e o guia desse anfitrião ficam bloqueados.`)) return;

  const { data: { session } } = await sb.auth.getSession();
  try {
    const res = await fetch(SB_URL + '/functions/v1/cancelar-assinatura', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token },
      body: JSON.stringify({ hostId }),
    });
    const result = await res.json();
    if (!result.ok) { showToast(result.message || 'Erro ao cancelar.'); return; }

    const h = allHosts.find(x => x.id === hostId);
    if (h) { h.subscription_status = 'cancelled'; h.plan_active = false; }
    renderHosts(allHosts);
    showToast('Assinatura cancelada.');
  } catch (e) {
    showToast('Erro de conexão.');
  }
}

// ── Logout ────────────────────────────────────────────────────────────
async function doLogout() {
  await sb.auth.signOut();
  location.href = 'login.html';
}

// ── Helpers ───────────────────────────────────────────────────────────
function colorFromStr(s) {
  const colors = ['#4A6741','#6B8E61','#8B5CF6','#0EA5E9','#F59E0B','#EF4444','#14B8A6','#F97316'];
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

let toastTimer;
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(80px);background:#111827;color:#fff;font-size:13px;font-weight:700;padding:10px 20px;border-radius:100px;z-index:9999;transition:transform .3s';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.style.transform = 'translateX(-50%) translateY(80px)'; }, 2800);
}

function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escAttr(s) { return String(s).replace(/"/g,'&quot;'); }

// ── Convidar anfitrião ────────────────────────────────────────────────
let _inviteTipo = 'livre';

function abrirConvite(tipo) {
  _inviteTipo = tipo || 'livre';
  document.getElementById('invite-form').classList.remove('hidden');
  document.getElementById('invite-success').classList.add('hidden');
  document.getElementById('invite-error').classList.add('hidden');
  document.getElementById('inv-email').value = '';
  const btn = document.getElementById('btn-enviar-convite');
  btn.disabled = false;
  btn.innerHTML = '<span class="material-icons-outlined" style="font-size:16px">send</span> Enviar convite';

  const isLivre = _inviteTipo === 'livre';
  document.getElementById('invite-desc').textContent = isLivre
    ? 'O anfitrião receberá um link e terá acesso imediato ao painel, sem precisar pagar.'
    : 'O anfitrião receberá um link e será direcionado para escolher um plano antes de acessar o painel.';

  const titleIcon = isLivre ? 'person_check' : 'credit_card';
  const titleText = isLivre ? 'Acesso Livre (Free)' : 'Convidar para Pagamento';
  document.querySelector('#invite-modal h3').textContent = titleText;
  document.querySelector('#invite-modal .w-9 .material-icons-outlined').textContent = titleIcon;

  document.getElementById('invite-modal').classList.remove('hidden');
  setTimeout(() => document.getElementById('inv-email').focus(), 100);
}

function fecharConvite() {
  document.getElementById('invite-modal').classList.add('hidden');
}

async function enviarConvite() {
  const email = document.getElementById('inv-email').value.trim();
  const errEl = document.getElementById('invite-error');
  errEl.classList.add('hidden');

  if (!email || !email.includes('@')) {
    document.getElementById('invite-error-text').textContent = 'Informe um e-mail válido.';
    errEl.classList.remove('hidden');
    return;
  }

  const btn = document.getElementById('btn-enviar-convite');
  btn.disabled = true;
  btn.innerHTML = '<span class="material-icons-outlined spin" style="font-size:16px">refresh</span> Enviando...';

  const dest       = _inviteTipo === 'pagamento' ? 'planos.html?invite=1' : 'painel.html';
  const redirectTo = location.origin + location.pathname.replace('admin.html', dest);

  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: redirectTo }
  });

  if (error) {
    document.getElementById('invite-error-text').textContent = error.message;
    errEl.classList.remove('hidden');
    btn.disabled = false;
    btn.innerHTML = '<span class="material-icons-outlined" style="font-size:16px">send</span> Enviar convite';
    return;
  }

  if (_inviteTipo === 'livre') {
    // Acesso livre (parceria/influencer) entra direto com o plano Pro completo, sem cobrança
    await sb.from('hosts').update({
      plan_id:     'pro',
      plan_name:   'Pro (Parceria)',
      plan_active: true,
    }).eq('email', email);
  }

  const msg = _inviteTipo === 'pagamento'
    ? 'Link enviado para ' + email + '. O anfitrião precisará escolher um plano antes de acessar o painel.'
    : 'Link enviado para ' + email + '. O anfitrião terá acesso imediato ao painel ao clicar no e-mail.';

  document.getElementById('invite-success-msg').textContent = msg;
  document.getElementById('invite-form').classList.add('hidden');
  document.getElementById('invite-success').classList.remove('hidden');
}

init();
