const SB_URL = 'https://xhtkwtiskqyiohurwkxg.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhodGt3dGlza3F5aW9odXJ3a3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NjkyMDcsImV4cCI6MjA5NzA0NTIwN30.b815Q3Nv1UaqxaLinyY7nmOJrw5EOGkIJ3HlkdYn0uQ';
const sb = window.supabase.createClient(SB_URL, SB_KEY);

const isInvite   = sessionStorage.getItem('zreg_invite') === '1';
const email      = sessionStorage.getItem('zreg_email');
const senha      = sessionStorage.getItem('zreg_senha');
const celular    = sessionStorage.getItem('zreg_celular');
const planoId      = sessionStorage.getItem('zreg_plano_id');
const planoNome    = sessionStorage.getItem('zreg_plano_nome');
const planoPreco   = sessionStorage.getItem('zreg_plano_preco');
const planoPeriodo = sessionStorage.getItem('zreg_plano_periodo') || 'mensal';
let withTrial = true;

function setStartMode(mode) {
  withTrial = (mode === 'trial');
  const trial  = document.getElementById('opt-trial');
  const direct = document.getElementById('opt-direct');
  trial.classList.toggle('opacity-60',   !withTrial);
  trial.classList.toggle('border-primary/40', withTrial);
  document.getElementById('opt-trial-check').classList.toggle('hidden', !withTrial);
  direct.classList.toggle('opacity-60',  withTrial);
  direct.classList.toggle('border-gray-400', !withTrial);
  direct.classList.toggle('border-gray-200', withTrial);
  document.getElementById('opt-direct-check').classList.toggle('hidden', withTrial);
  const btn = document.getElementById('btn-pagar');
  btn.innerHTML = '<span class="material-icons-outlined text-base">lock</span>' + (withTrial ? 'Começar 7 dias grátis' : 'Assinar agora');
  document.getElementById('payment-explain').textContent = withTrial
    ? 'Você terá acesso completo ao painel por 7 dias, sem precisar cadastrar cartão. Se quiser continuar depois do teste, escolhe um plano direto no painel.'
    : 'Você será redirecionado para o ambiente seguro do Mercado Pago para informar os dados do cartão e confirmar a assinatura. Nenhum dado de pagamento é coletado pelo AirGuia.';
}

if (!email || !planoId) location.href = isInvite ? 'login.html' : 'cadastro.html';

document.getElementById('resumo-nome').textContent  = 'Plano ' + (planoNome || '') + ' · ' + (planoPeriodo === 'anual' ? 'Anual' : 'Mensal');
document.getElementById('resumo-preco').textContent = 'R$ ' + (planoPreco || '');
setStartMode('trial');

function showError(msg) {
  document.getElementById('error-text').textContent = msg;
  document.getElementById('error-msg').classList.remove('hidden');
  resetBtn();
}
function resetBtn() {
  const btn = document.getElementById('btn-pagar');
  btn.disabled = false;
  btn.innerHTML = '<span class="material-icons-outlined text-base">lock</span> Continuar para pagamento seguro';
}

async function continuar() {
  document.getElementById('error-msg').classList.add('hidden');
  const btn = document.getElementById('btn-pagar');
  btn.disabled = true;
  btn.innerHTML = '<span class="material-icons-outlined text-base spin">refresh</span> Preparando...';

  let userId;

  try {
    if (isInvite) {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { showError('Sessão expirada. Peça ao administrador um novo convite.'); return; }
      userId = session.user.id;
    } else {
      const { data, error } = await sb.auth.signUp({
        email, password: senha,
        options: { emailRedirectTo: location.origin + '/painel.html' }
      });
      if (error) {
        if (error.message.includes('already registered')) {
          const { data: loginData, error: loginError } = await sb.auth.signInWithPassword({ email, password: senha });
          if (loginError) { showError('Este e-mail já possui uma conta. Tente fazer login.'); return; }
          userId = loginData.user?.id;
        } else {
          showError('Erro ao criar conta: ' + error.message);
          return;
        }
      } else {
        await new Promise(r => setTimeout(r, 1200));
        userId = data.user?.id;
      }
    }
  } catch (e) {
    showError('Erro de conexão. Tente novamente.');
    return;
  }

  if (!userId) { showError('Não foi possível identificar sua conta. Tente novamente.'); return; }

  ['zreg_email','zreg_senha','zreg_celular','zreg_plano_id','zreg_plano_nome','zreg_plano_preco','zreg_plano_periodo','zreg_invite']
    .forEach(k => sessionStorage.removeItem(k));

  // 7 dias grátis: acesso imediato no painel, sem cartão e sem passar pelo Mercado Pago
  if (withTrial) {
    const trialUpd = {
      plan_id:             planoId,
      plan_name:           planoNome + ' (Teste grátis)',
      plan_active:         true,
      plan_started_at:     new Date().toISOString(),
      subscription_status: null,
      subscription_id:     null,
      trial_ends_at:       new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    if (celular) trialUpd.phone = celular;
    await sb.from('hosts').update(trialUpd).eq('id', userId);

    location.href = 'painel.html';
    return;
  }

  // Começar agora: cobrança imediata, segue para o Mercado Pago
  const planoUpd = {
    plan_id:             planoId,
    plan_name:           planoNome + ' ' + (planoPeriodo === 'anual' ? '(Anual)' : '(Mensal)'),
    plan_active:         false,
    plan_started_at:     new Date().toISOString(),
    subscription_status: 'pending',
  };
  if (celular) planoUpd.phone = celular;
  await sb.from('hosts').update(planoUpd).eq('id', userId);

  let result;
  try {
    const res = await fetch(SB_URL + '/functions/v1/criar-assinatura', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SB_KEY },
      body: JSON.stringify({ email, planoId, planoPeriodo, withTrial: false, hostId: userId }),
    });
    result = await res.json();
  } catch (e) {
    showError('Erro de conexão. Tente novamente.');
    return;
  }

  if (!result.ok || !result.initPoint) {
    showError(result.message || 'Não foi possível iniciar o pagamento.');
    return;
  }

  await sb.from('hosts').update({
    subscription_id: result.subscriptionId,
  }).eq('id', userId);

  document.getElementById('overlay-redirect').classList.remove('hidden');
  location.href = result.initPoint;
}

document.addEventListener('keydown', e => { if (e.key === 'Enter') continuar(); });
