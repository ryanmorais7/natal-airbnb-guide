const SB_URL = 'https://xhtkwtiskqyiohurwkxg.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhodGt3dGlza3F5aW9odXJ3a3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NjkyMDcsImV4cCI6MjA5NzA0NTIwN30.b815Q3Nv1UaqxaLinyY7nmOJrw5EOGkIJ3HlkdYn0uQ';
const sb = window.supabase.createClient(SB_URL, SB_KEY);

const DEMO_EMAIL    = 'demo@airguia.com';
const DEMO_PASSWORD = 'AirGuiaDemo#2026';

const wantsDemo = new URLSearchParams(location.search).get('demo') === '1';

if (wantsDemo) {
  document.getElementById('login-view').classList.add('hidden');
  document.getElementById('demo-loading-view').classList.remove('hidden');
  document.getElementById('page-title').textContent    = 'Demonstração do Painel';
  document.getElementById('page-subtitle').textContent = 'Só um instante...';
  entrarDemo();
} else {
  // Already logged in? Go straight to panel
  sb.auth.getSession().then(({ data: { session } }) => {
    if (session) location.href = 'painel.html';
  });
}

async function doLogin() {
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const btn      = document.getElementById('btn-login');

  hideError();
  if (!email || !password) { showError('Preencha e-mail e senha.'); return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="material-icons-outlined text-base spin">refresh</span> Entrando...';

  const { error } = await sb.auth.signInWithPassword({ email, password });

  if (error) {
    showError('E-mail ou senha incorretos.');
    btn.disabled = false;
    btn.innerHTML = '<span class="material-icons-outlined text-base">login</span> Entrar';
  } else {
    location.href = 'painel.html';
  }
}

async function entrarDemo() {
  const btn = document.getElementById('btn-demo');
  btn.disabled = true;
  btn.innerHTML = '<span class="material-icons-outlined text-base spin">refresh</span> Carregando demo...';

  try {
    let { error } = await sb.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD });

    if (error) {
      // Conta demo ainda não existe nesse projeto -- cria na primeira vez que alguém clicar
      const { data: signupData, error: signupError } = await sb.auth.signUp({
        email: DEMO_EMAIL, password: DEMO_PASSWORD
      });
      if (signupError || !signupData.user) {
        throw signupError || new Error('Falha ao criar conta demo.');
      }
      await seedDemoAccount(signupData.user.id);

      let { data: { session } } = await sb.auth.getSession();
      if (!session) {
        const retry = await sb.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
        if (retry.error) throw retry.error;
      }
    }

    location.href = 'painel.html';
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = '<span class="material-icons-outlined text-base">visibility</span> Ver demo do guia';
    showError('Não foi possível abrir a demo agora: ' + (err && err.message ? err.message : 'erro desconhecido') + '. Tente novamente.');
  }
}

async function seedDemoAccount(userId) {
  // upsert (não update) pra garantir que a linha em hosts existe e fica correta
  // mesmo se o trigger handle_new_user ainda não tiver criado ela a tempo
  await sb.from('hosts').upsert({
    id:            userId,
    email:         DEMO_EMAIL,
    is_demo:       true,
    plan_id:       'pro',
    plan_name:     'Pro (Demo)',
    plan_active:   true,
    property_name: 'Casa Vista Mar — Demo',
    owner_name:    'Anfitrião Demo',
    slug:          'demo'
  });

  await sb.from('guide_content').upsert({
    host_id:             userId,
    property_name:       'Casa Vista Mar — Demo',
    welcome_message:     'Seja muito bem-vindo(a) à Casa Vista Mar! Preparamos este guia com tudo que você precisa para uma estadia tranquila.',
    address:              'Rua das Dunas, 120 — Ponta Negra, Natal/RN',
    maps_url:              'https://maps.google.com/?q=Ponta+Negra+Natal',
    checkin_time:          '14:00',
    checkout_time:         '11:00',
    hero_image_url:        'assets/Zamiofotoprincipal.png',
    wifi_name:             'VistaMar_5G',
    wifi_password:         'praia2026',
    theme_id:              'oceano',
    theme_color:           '#3D6680',
    theme_color_light:     '#5C8AA3',
    access_type:           'fechadura',
    lock_code:             '4821',
    access_instructions:   '1. Aproxime o cartão da fechadura\n2. Aguarde o beep verde\n3. Gire a maçaneta para entrar',
    rules:                 'Check-in a partir das 14h e check-out até as 11h.\nProibido fumar dentro do imóvel.\nMáximo de 4 hóspedes.\nSilêncio após as 22h.\nNão são permitidos animais de estimação.',
    restaurantes: [
      { name: 'Camarões Poty',  description: 'Frutos do mar tradicionais à beira-mar', time: '8 min',  category: 'Frutos do Mar', maps_url: 'https://maps.google.com/?q=Camaroes+Poty+Natal', address: 'Av. Eng. Roberto Freire, Ponta Negra' },
      { name: 'Mangai',          description: 'Buffet de comida regional nordestina',   time: '12 min', category: 'Regional',      maps_url: 'https://maps.google.com/?q=Mangai+Natal',         address: 'Av. Amintas Barros, Lagoa Nova' }
    ],
    mercados: [
      { name: 'Hiper Bom Preço',     description: 'Supermercado completo, aberto até 22h', time: '5 min', category: 'Supermercado',  maps_url: 'https://maps.google.com/?q=Bom+Preco+Ponta+Negra', address: 'Av. Engenheiro Roberto Freire' },
      { name: 'Mercadinho da Praia', description: 'Conveniência rápida, itens básicos',    time: '3 min', category: 'Conveniência',  maps_url: '', address: 'Rua das Algas, Ponta Negra' }
    ],
    farmacias: [
      { name: 'Drogasil Ponta Negra', description: 'Aberta 24h', time: '4 min', category: '24h', maps_url: 'https://maps.google.com/?q=Drogasil+Ponta+Negra', address: 'Av. Engenheiro Roberto Freire' }
    ],
    atividades: [
      { name: 'Morro do Careca',                description: 'Cartão-postal de Natal, dunas e vista para o mar', time: '10 min', category: 'Ponto Turístico', maps_url: 'https://maps.google.com/?q=Morro+do+Careca', address: 'Ponta Negra' },
      { name: 'Passeio de Buggy pelas Dunas',   description: 'Aventura pelas dunas de Genipabu',                 time: '25 min', category: 'Aventura',       maps_url: '', address: 'Genipabu' }
    ],
    academias: [
      { name: 'Smart Fit Ponta Negra', description: 'Academia 24h com diária para visitantes', time: '6 min', category: '24h', maps_url: 'https://maps.google.com/?q=SmartFit+Ponta+Negra', address: 'Av. Engenheiro Roberto Freire' }
    ],
    lavanderias: [
      { name: 'Lavanderia 5àSec', description: 'Lavagem e passagem expressa', time: '7 min', category: 'Expressa', maps_url: '', address: 'Ponta Negra' }
    ],
    emergencia: [
      { name: 'Hospital Walfredo Gurgel', description: 'Hospital público 24h',          maps_url: 'tel:+5584999990000' },
      { name: 'Polícia Militar',          description: 'Emergência policial',           maps_url: 'tel:190' },
      { name: 'SAMU',                     description: 'Atendimento médico de urgência', maps_url: 'tel:192' }
    ],
    room_items: {
      bedroom:  ['Cama de casal', 'Ar-condicionado', 'TV Smart', 'Guarda-roupa'],
      kitchen:  ['Fogão 4 bocas', 'Geladeira', 'Micro-ondas', 'Utensílios completos'],
      bathroom: ['Chuveiro elétrico', 'Secador de cabelo', 'Toalhas', 'Itens de higiene']
    },
    cleaning_state: {
      lencol: 'ok', fronha: 'ok', cobertor: 'ok', travesseiro: 'atencao',
      'toalha-banho': 'ok', 'toalha-rosto': 'faltando', 'tapete-ban': 'ok', papel: 'atencao', sabonete: 'ok',
      pratos: 'ok', copos: 'ok', talheres: 'ok', panelas: 'atencao', detergente: 'faltando',
      almofadas: 'ok', 'tapete-sal': 'ok', lixo: 'ok', chao: 'ok', janelas: 'ok'
    },
    cleaning_instructions: 'Trocar lençóis e toalhas.\nRepor papel higiênico e amenities.\nVarrer e passar pano em todos os ambientes.\nVerificar geladeira e repor água.',
    maintenance_reminders: [
      { id: 'mr_demo_1', title: 'Dedetização semestral',                 type: 'dedetizacao', due_date: '2026-05-01', completed: false, created_at: new Date().toISOString() },
      { id: 'mr_demo_2', title: 'Troca de filtro do ar-condicionado',    type: 'filtro',       due_date: '2026-08-15', completed: false, created_at: new Date().toISOString() }
    ],
    updated_at: new Date().toISOString()
  }, { onConflict: 'host_id' });

  await sb.from('room_media').insert([
    { host_id: userId, room: 'bedroom',  type: 'image', url: 'assets/Quarto/quarto1.jpeg',     position: 0 },
    { host_id: userId, room: 'bedroom',  type: 'image', url: 'assets/Quarto/quarto2.jpeg',     position: 1 },
    { host_id: userId, room: 'kitchen',  type: 'image', url: 'assets/Cozinha/cozinha1.jpeg',   position: 0 },
    { host_id: userId, room: 'kitchen',  type: 'image', url: 'assets/Cozinha/cozinha2.jpeg',   position: 1 },
    { host_id: userId, room: 'bathroom', type: 'image', url: 'assets/Banheiro/banheiro1.jpeg', position: 0 },
    { host_id: userId, room: 'bathroom', type: 'image', url: 'assets/Banheiro/banheiro2.jpeg', position: 1 }
  ]);
}

function showError(msg) {
  document.getElementById('demo-loading-view').classList.add('hidden');
  document.getElementById('login-view').classList.remove('hidden');
  document.getElementById('page-title').textContent    = 'Painel do Anfitrião';
  document.getElementById('page-subtitle').textContent = 'Entre para editar seu guia';
  document.getElementById('error-text').textContent = msg;
  document.getElementById('error-msg').classList.remove('hidden');
}
function hideError() {
  document.getElementById('error-msg').classList.add('hidden');
}
function togglePwd() {
  const inp  = document.getElementById('password');
  const icon = document.getElementById('pwd-icon');
  if (inp.type === 'password') { inp.type = 'text';     icon.textContent = 'visibility_off'; }
  else                         { inp.type = 'password'; icon.textContent = 'visibility'; }
}

document.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
