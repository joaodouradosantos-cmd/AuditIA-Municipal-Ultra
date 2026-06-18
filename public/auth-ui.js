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
  const email = user?.email || 'Sem sessão';
  const el = document.getElementById('authStatus');
  if (el) el.value = email;
  const chip = document.getElementById('accountChipEmail');
  if (chip) chip.textContent = email;
  const role = document.getElementById('accountChipRole');
  if (role) role.textContent = auditiaIsOwner(user) ? 'Proprietário' : 'Utilizador';
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
  const dashboard = document.getElementById('dashboard');
  const memoryBox = dashboard?.querySelector('.cloud-box');
  if (memoryBox) memoryBox.style.display = 'none';
  if (!dashboard) return;

  const box = document.createElement('div');
  box.id = 'authBox';
  box.className = 'account-panel';
  box.innerHTML = `
    <div class="account-line">
      <div>
        <b>Conta ativa</b><br>
        <span id="accountChipEmail">Sem sessão</span>
        <small id="accountChipRole">Utilizador</small>
      </div>
      <div class="account-actions">
        <button class="secondary" onclick="cloudSaveNow(true)">Sincronizar agora</button>
        <button class="secondary" onclick="auditiaLogout()">Sair</button>
      </div>
    </div>
    <div id="ownerInviteArea" style="display:none">
      <hr>
      <h4>Convites</h4>
      <p class="hint">Só o proprietário pode gerar convites. Copia o link e envia à pessoa.</p>
      <div class="grid">
        <label>Email a convidar<input id="inviteEmail" type="email" placeholder="email da pessoa"></label>
        <label>Conta ligada<input id="authStatus" readonly value="Sem sessão iniciada"></label>
      </div>
      <button onclick="auditiaCreateInvite()">Gerar link de convite</button>
      <div id="inviteOut" class="result"></div>
    </div>
  `;
  const kpis = dashboard.querySelector('.kpis');
  if (kpis) kpis.insertAdjacentElement('afterend', box); else dashboard.prepend(box);
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
