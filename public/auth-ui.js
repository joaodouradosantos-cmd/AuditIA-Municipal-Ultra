const AUTH_KEY = 'auditia_session_token';
const AUTH_USER = 'auditia_session_user';
const AUTH_OWNER = 'joaodouradosantos@gmail.com';

document.documentElement.classList.add('auth-locked-root');

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

function auditiaAuthUser() {
  try { return JSON.parse(localStorage.getItem(AUTH_USER) || 'null'); } catch { return null; }
}

function auditiaIsOwner(user = auditiaAuthUser()) {
  return user && user.email === AUTH_OWNER && user.role === 'owner';
}

async function auditiaAuthRequest(action, body = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const session = auditiaSessionToken();
  if (session) headers['X-AuditIA-Session'] = session;
  const res = await fetch('/api/auth?action=' + encodeURIComponent(action), {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function auditiaLockApp() {
  document.body.classList.add('auth-locked');
  const overlay = document.getElementById('authOverlay');
  if (overlay) overlay.style.display = 'flex';
}

function auditiaUnlockApp() {
  document.body.classList.remove('auth-locked');
  document.documentElement.classList.remove('auth-locked-root');
  const overlay = document.getElementById('authOverlay');
  if (overlay) overlay.style.display = 'none';
  auditiaRenderAuthStatus();
}

function auditiaRenderAuthStatus() {
  const user = auditiaAuthUser();
  const el = document.getElementById('authStatus');
  if (el) el.value = user ? `Ligado como ${user.email}` : 'Sem sessão iniciada';
  const ownerArea = document.getElementById('ownerInviteArea');
  if (ownerArea) ownerArea.style.display = auditiaIsOwner(user) ? 'block' : 'none';
}

function auditiaEnsureOverlay() {
  if (document.getElementById('authOverlay')) return;
  const params = new URLSearchParams(location.search);
  const emailParam = params.get('email') || '';
  const inviteParam = params.get('invite') || '';
  const overlay = document.createElement('div');
  overlay.id = 'authOverlay';
  overlay.innerHTML = `
    <div class="auth-card">
      <h1>AuditIA Municipal Ultra</h1>
      <p class="hint">Acesso reservado. Entra com email e senha ou cria conta com convite.</p>
      <label>Email<input id="authEmail" type="email" value="${emailParam}" placeholder="email"></label>
      <label>Senha<input id="authPassword" type="password" placeholder="senha"></label>
      <label>Convite<input id="authInvite" value="${inviteParam}" placeholder="token do convite, quando aplicável"></label>
      <div class="toolbar">
        <button onclick="auditiaLogin()">Entrar</button>
        <button class="secondary" onclick="auditiaRegister()">Criar conta com convite</button>
      </div>
      <p class="hint">Proprietário: ${AUTH_OWNER}</p>
    </div>
  `;
  document.body.appendChild(overlay);
}

function auditiaAddAuthBox() {
  if (document.getElementById('authBox')) return;
  const cloud = document.querySelector('.cloud-box');
  if (!cloud) return;
  const box = document.createElement('div');
  box.id = 'authBox';
  box.className = 'cloud-box';
  box.innerHTML = `
    <h3>Acesso por utilizador</h3>
    <p class="hint">Cada utilizador tem email/senha e memória privada sincronizada automaticamente entre PC e telemóvel.</p>
    <div class="grid">
      <label>Estado<input id="authStatus" readonly value="Sem sessão iniciada"></label>
      <label>Utilizador proprietário<input readonly value="${AUTH_OWNER}"></label>
    </div>
    <button class="secondary" onclick="auditiaLogout()">Sair deste equipamento</button>
    <div id="ownerInviteArea" style="display:none">
      <hr>
      <h4>Criar convite</h4>
      <p class="hint">Só o proprietário pode gerar convites. Copia o link e envia à pessoa.</p>
      <div class="grid">
        <label>Email a convidar<input id="inviteEmail" type="email" placeholder="email da pessoa"></label>
      </div>
      <button onclick="auditiaCreateInvite()">Gerar link de convite</button>
      <div id="inviteOut" class="result"></div>
    </div>
  `;
  cloud.insertAdjacentElement('afterend', box);
  auditiaRenderAuthStatus();
}

async function auditiaLogin() {
  try {
    const email = document.getElementById('authEmail').value.trim().toLowerCase();
    const password = document.getElementById('authPassword').value;
    const data = await auditiaAuthRequest('login', { email, password });
    auditiaSetSession(data.token, data.user);
    auditiaUnlockApp();
    if (typeof cloudLoad === 'function') await cloudLoad();
    alert('Sessão iniciada. A memória deste utilizador foi carregada.');
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
    auditiaUnlockApp();
    if (typeof cloudSaveNow === 'function') await cloudSaveNow();
    alert('Conta criada. A app ficou privada para este utilizador.');
  } catch (error) {
    alert(error.message || error);
  }
}

async function auditiaCreateInvite() {
  try {
    if (!auditiaIsOwner()) throw new Error('Apenas o proprietário pode criar convites.');
    const email = document.getElementById('inviteEmail').value.trim().toLowerCase();
    const data = await auditiaAuthRequest('invite', { email });
    document.getElementById('inviteOut').innerHTML = `<p><b>Convite criado para:</b> ${data.email}</p><p><input readonly value="${data.inviteUrl}" onclick="this.select()"></p><p class="hint">Copia este link e envia por email, WhatsApp ou Teams.</p>`;
  } catch (error) {
    document.getElementById('inviteOut').innerHTML = `<span class="bad">${error.message || error}</span>`;
  }
}

async function auditiaLogout() {
  try { await auditiaAuthRequest('logout', {}); } catch {}
  auditiaClearSession();
  auditiaLockApp();
  auditiaRenderAuthStatus();
}

async function auditiaCheckSession() {
  auditiaEnsureOverlay();
  auditiaLockApp();
  const token = auditiaSessionToken();
  if (!token) return;
  try {
    const data = await auditiaAuthRequest('me', {});
    if (!data.user) throw new Error('Sessão expirada.');
    auditiaSetSession(token, data.user);
    auditiaUnlockApp();
    if (typeof cloudLoad === 'function') await cloudLoad();
  } catch {
    auditiaClearSession();
    auditiaLockApp();
  }
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

window.addEventListener('load', () => {
  auditiaEnsureOverlay();
  auditiaAddAuthBox();
  auditiaCheckSession();
});
