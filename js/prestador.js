const SB_URL = 'https://xhtkwtiskqyiohurwkxg.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhodGt3dGlza3F5aW9odXJ3a3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NjkyMDcsImV4cCI6MjA5NzA0NTIwN30.b815Q3Nv1UaqxaLinyY7nmOJrw5EOGkIJ3HlkdYn0uQ';
const sb = window.supabase.createClient(SB_URL, SB_KEY);

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const CATEGORIAS = [
  { id: 'eletricista',     label: 'Eletricista' },
  { id: 'encanador',       label: 'Encanador' },
  { id: 'pintor',          label: 'Pintor' },
  { id: 'dedetizador',     label: 'Dedetização' },
  { id: 'ar_condicionado', label: 'Ar-condicionado' },
  { id: 'gas',             label: 'Gás' },
  { id: 'diarista',        label: 'Diarista / Limpeza' },
];

const selectedCategorias = new Set();

function maskPhone(el) {
  let v = el.value.replace(/\D/g, '').slice(0, 11);
  if (v.length <= 10) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  else                v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  el.value = v.replace(/-$/, '');
}

function showError(msg) {
  document.getElementById('error-text').textContent = msg;
  document.getElementById('error-msg').classList.remove('hidden');
}

function toggleCategoria(id) {
  if (selectedCategorias.has(id)) selectedCategorias.delete(id);
  else selectedCategorias.add(id);
  renderCategorias();
}

function renderCategorias() {
  const c = document.getElementById('pr-categorias');
  c.innerHTML = CATEGORIAS.map(cat => {
    const active = selectedCategorias.has(cat.id);
    return '<button type="button" onclick="toggleCategoria(\'' + cat.id + '\')" class="cat-chip px-3 py-1.5 rounded-full border-2 text-xs font-bold transition-all '
      + (active ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300') + '">'
      + cat.label + '</button>';
  }).join('');
}

function initUfSelect() {
  const sel = document.getElementById('pr-estado');
  UFS.forEach(uf => {
    const opt = document.createElement('option');
    opt.value = uf;
    opt.textContent = uf;
    sel.appendChild(opt);
  });
}

async function cadastrar() {
  const nome    = document.getElementById('pr-nome').value.trim();
  const celular = document.getElementById('pr-celular').value.trim();
  const cidade  = document.getElementById('pr-cidade').value.trim();
  const estado  = document.getElementById('pr-estado').value;

  document.getElementById('error-msg').classList.add('hidden');

  if (!nome)                                 { showError('Informe seu nome.'); return; }
  if (celular.replace(/\D/g,'').length < 10) { showError('Informe um celular válido.'); return; }
  if (!cidade)                               { showError('Informe sua cidade.'); return; }
  if (!estado)                               { showError('Selecione seu estado.'); return; }
  if (selectedCategorias.size === 0)         { showError('Selecione ao menos um serviço que você presta.'); return; }

  const btn = document.getElementById('btn-cadastrar');
  btn.disabled = true;
  btn.innerHTML = '<span class="material-icons-outlined text-base spin">refresh</span> Enviando...';

  const { error } = await sb.from('service_providers').insert({
    name:       nome,
    phone:      celular,
    city:       cidade,
    state:      estado,
    categories: Array.from(selectedCategorias),
  });

  if (error) {
    showError('Não foi possível enviar seu cadastro: ' + error.message);
    btn.disabled = false;
    btn.innerHTML = '<span class="material-icons-outlined text-base">handshake</span> Cadastrar';
    return;
  }

  document.getElementById('form-view').classList.add('hidden');
  document.getElementById('success-view').classList.remove('hidden');
}

initUfSelect();
renderCategorias();
