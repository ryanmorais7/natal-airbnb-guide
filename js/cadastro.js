const SB_URL = 'https://xhtkwtiskqyiohurwkxg.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhodGt3dGlza3F5aW9odXJ3a3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NjkyMDcsImV4cCI6MjA5NzA0NTIwN30.b815Q3Nv1UaqxaLinyY7nmOJrw5EOGkIJ3HlkdYn0uQ';
const sb = window.supabase.createClient(SB_URL, SB_KEY);

function maskPhone(el) {
  let v = el.value.replace(/\D/g, '').slice(0, 11);
  if (v.length <= 10) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  else                v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  el.value = v.replace(/-$/, '');
}

function togglePwd(inputId, iconId) {
  const inp  = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if (inp.type === 'password') { inp.type = 'text';     icon.textContent = 'visibility_off'; }
  else                         { inp.type = 'password'; icon.textContent = 'visibility'; }
}

function showError(msg) {
  document.getElementById('error-text').textContent = msg;
  document.getElementById('error-msg').classList.remove('hidden');
}

async function avancar() {
  const email   = document.getElementById('reg-email').value.trim();
  const senha   = document.getElementById('reg-senha').value;
  const celular = document.getElementById('reg-celular').value.trim();

  document.getElementById('error-msg').classList.add('hidden');

  if (!email || !email.includes('@')) { showError('Informe um e-mail válido.'); return; }
  if (senha.length < 6)               { showError('A senha deve ter no mínimo 6 caracteres.'); return; }
  if (celular.replace(/\D/g,'').length < 10) { showError('Informe um celular válido.'); return; }

  sessionStorage.setItem('zreg_email',   email);
  sessionStorage.setItem('zreg_senha',   senha);
  sessionStorage.setItem('zreg_celular', celular);

  try {
    await sb.from('leads').upsert({ email, phone: celular }, { onConflict: 'email', ignoreDuplicates: true });
  } catch (e) { /* não bloqueia o cadastro se o registro do lead falhar */ }

  location.href = 'planos.html';
}

document.addEventListener('keydown', e => { if (e.key === 'Enter') avancar(); });
