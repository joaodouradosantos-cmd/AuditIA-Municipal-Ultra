const AUTH_KEY = 'auditia_session_token';
const AUTH_USER = 'auditia_session_user';

function auditiaSessionToken() {
  return localStorage.getItem(AUTH_KEY) || '';
}

function auditiaSetSession(token, user) {
  if (token) localStorage.setItem(AUTH_KEY, token);
  if (user) localStorage.setItem(AUTH_USER, JSON.stringify(user));
}

function auditiaClearSession() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(AUTH_USER);
}

async function auditiaAuthRequest(action, body = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const session = auditiaSessionToken();
  if (session) headers['X-AuditIA-Session'] = session;
  const access = document.getElementById('accessCode')?.value || localStorage.getItem('auditia_access_code') || '';
  if (access) headers['X-AuditIA-Code'] = access;
  const res = await fetch('/api/auth?action=' + encodeURIComponent(action), {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function auditiaAuthUser() {
  try { return JSON.parse(localStorage.getItem(AUTH_USER) || 'null'); } catch { return null; }
}

function auditiaRenderAuthStatus() {
  const user = auditiaAuthUser();
  const el = document.getElementById('authStatus');
  if (!el) return;
  el.value = user ? `Ligado como ${user.email}` : 'Sem sessão iniciada';
}

async function auditiaLogin() {
  try {
    const email = document.getElementById('authEmail').value.trim().toLowerCase();
    const password = document.getElementById('authPassword').value;
    const data = await auditiaAuthRequest('login', { email, password });
    auditiaSetSession(data.token, data.user);
    auditiaRenderAuthStatus();
    if (typeof cloudLoad === 'function') await cloudLoad();
    alert('Sessão iniciada. Memória online carregada para este utilizador.');
  } catch (error) {
    alert(error.message || error);
  }
}

async function auditiaRegister() {
  try {
    const email = document.getElementById('authEmail').value.trim().toLowerCase();
    const password = document.getElementById('authPassword').value;
    const inviteToken = document.getElementById('authInvite').value.trim();
    const data = await auditiaAuthRequest('register', { email, password, inviteToken });
    auditiaSetSession(data.token, data.user);
    auditiaRenderAuthStatus();
    if (typeof cloudSaveNow === 'function') await cloudSaveNow();
    alert('Conta criada e sessão iniciada.');
  } catch (error) {
    alert(error.message || error);
  }
}

async function auditiaCreateInvite() {
  try {
    const email = document.getElementById('inviteEmail').value.trim().toLowerCase();
    const data = await auditiaAuthRequest('invite', { email });
    document.getElementById('inviteOut').innerHTML = `<p><b>Convite criado para:</b> ${data.email}</p><p><input readonly value="${data.inviteUrl}" onclick="this.select()"></p><p class="hint">Copia este link e envia à pessoa por email, WhatsApp ou Teams.</p>`;
  } catch (error) {
    document.getElementById('inviteOut').innerHTML = `<span class="bad">${error.message || error}</span>`;
  }
}

async function auditiaLogout() {
  try { await auditiaAuthRequest('logout', {}); } catch {}
  auditiaClearSession();
  auditiaRenderAuthStatus();
  alert('Sessão terminada neste equipamento.');
}

function auditiaAddAuthBox() {
  if (document.getElementById('authBox')) return;
  const cloud = document.querySelector('.cloud-box');
  if (!cloud) return;
  const params = new URLSearchParams(location.search);
  const emailParam = params.get('email') || '';
  const inviteParam = params.get('invite') || '';
  const box = document.createElement('div');
  box.id = 'authBox';
  box.className = 'cloud-box';
  box.innerHTML = `
    <h3>Acesso por utilizador</h3>
    <p class="hint">Solução prática: cada pessoa entra com email e senha. O administrador cria o convite e envia o link.</p>
    <div class="grid">
      <label>Email<input id="authEmail" type="email" value="${emailParam}" placeholder="utilizador@exemplo.pt"></label>
      <label>Senha<input id="authPassword" type="password" placeholder="mínimo 8 caracteres"></label>
      <label>Convite<input id="authInvite" value="${inviteParam}" placeholder="token do convite"></label>
      <label>Estado<input id="authStatus" readonly value="Sem sessão iniciada"></label>
    </div>
    <button onclick="auditiaLogin()">Entrar</button>
    <button class="secondary" onclick="auditiaRegister()">Criar conta com convite</button>
    <button class="secondary" onclick="auditiaLogout()">Sair</button>
    <hr>
    <h4>Criar convite</h4>
    <div class="grid">
      <label>Email a convidar<input id="inviteEmail" type="email" placeholder="email da pessoa"></label>
      <label>Código de administrador<input id="inviteAccessHint" readonly value="Usa o código de acesso atual acima para autorizar o convite"></label>
    </div>
    <button onclick="auditiaCreateInvite()">Gerar link de convite</button>
    <div id="inviteOut" class="result"></div>
  `;
  cloud.insertAdjacentElement('afterend', box);
  auditiaRenderAuthStatus();
}

const auditiaOldFetch = window.fetch.bind(window);
window.fetch = function(input, init = {}) {
  const url = typeof input === 'string' ? input : input?.url || '';
  if (url.includes('/api/memory')) {
    init.headers = new Headers(init.headers || {});
    const session = auditiaSessionToken();
    if (session) init.headers.set('X-AuditIA-Session', session);
  }
  return auditiaOldFetch(input, init);
};

window.addEventListener('load', auditiaAddAuthBox);
