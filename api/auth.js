import crypto from 'crypto';
import { checkMethod, supabaseAdmin } from './_common.js';

const ITERATIONS = 120000;
const KEYLEN = 32;
const DIGEST = 'sha256';
const OWNER_EMAIL = 'joaodouradosantos@gmail.com';

function normEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(String(password), salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
  return `${ITERATIONS}:${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [iterations, salt, hash] = String(stored || '').split(':');
  if (!iterations || !salt || !hash) return false;
  const actual = crypto.pbkdf2Sync(String(password), salt, Number(iterations), KEYLEN, DIGEST).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(hash, 'hex'));
}

async function createSession(supabase, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
  const { error } = await supabase.from('auditia_sessions').insert({ user_id: userId, token_hash: tokenHash, expires_at: expiresAt });
  if (error) throw error;
  return { token, expiresAt };
}

export async function getSessionUser(req, supabase = supabaseAdmin()) {
  const token = req.headers['x-auditia-session'] || req.body?.sessionToken || req.query?.sessionToken;
  if (!token) return null;
  const tokenHash = hashToken(token);
  const { data, error } = await supabase
    .from('auditia_sessions')
    .select('user_id, expires_at, auditia_users(id,email,role,status)')
    .eq('token_hash', tokenHash)
    .maybeSingle();
  if (error) throw error;
  if (!data || new Date(data.expires_at) < new Date()) return null;
  const user = data.auditia_users;
  if (!user || user.status !== 'active') return null;
  return user;
}

function isOwner(user) {
  return user?.role === 'owner' && normEmail(user.email) === OWNER_EMAIL;
}

export default async function handler(req, res) {
  if (!checkMethod(req, res, ['GET', 'POST'])) return;
  const supabase = supabaseAdmin();
  const action = req.query?.action || req.body?.action || 'me';

  try {
    if (action === 'me') {
      const user = await getSessionUser(req, supabase);
      return res.status(200).json({ user });
    }

    if (action === 'invite') {
      const owner = await getSessionUser(req, supabase);
      if (!isOwner(owner)) return res.status(403).send('Apenas o proprietário pode criar convites.');
      const email = normEmail(req.body?.email);
      if (!email || !email.includes('@')) return res.status(400).send('Email inválido.');
      if (email === OWNER_EMAIL) return res.status(400).send('O proprietário já existe.');
      const token = crypto.randomBytes(24).toString('hex');
      const tokenHash = hashToken(token);
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();
      const { error } = await supabase.from('auditia_invites').insert({ email, token_hash: tokenHash, expires_at: expiresAt });
      if (error) throw error;
      const base = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
      return res.status(200).json({ ok: true, email, inviteUrl: `${base}/?invite=${token}&email=${encodeURIComponent(email)}`, expiresAt });
    }

    if (action === 'register') {
      const email = normEmail(req.body?.email);
      const password = String(req.body?.password || '');
      const inviteToken = String(req.body?.inviteToken || '');
      if (!email || !password || password.length < 8 || !inviteToken) return res.status(400).send('Email, convite e senha com pelo menos 8 caracteres são obrigatórios.');
      if (email === OWNER_EMAIL) return res.status(400).send('A conta de proprietário já está reservada.');
      const tokenHash = hashToken(inviteToken);
      const { data: invite, error: inviteError } = await supabase
        .from('auditia_invites')
        .select('*')
        .eq('token_hash', tokenHash)
        .eq('email', email)
        .is('used_at', null)
        .maybeSingle();
      if (inviteError) throw inviteError;
      if (!invite || new Date(invite.expires_at) < new Date()) return res.status(401).send('Convite inválido ou expirado.');
      const passwordHash = hashPassword(password);
      const { data: user, error: userError } = await supabase
        .from('auditia_users')
        .insert({ email, password_hash: passwordHash, role: 'user', status: 'active' })
        .select('id,email,role,status')
        .single();
      if (userError) throw userError;
      await supabase.from('auditia_invites').update({ used_at: new Date().toISOString() }).eq('id', invite.id);
      const session = await createSession(supabase, user.id);
      return res.status(200).json({ ok: true, user, ...session });
    }

    if (action === 'login') {
      const email = normEmail(req.body?.email);
      const password = String(req.body?.password || '');
      const { data: user, error } = await supabase
        .from('auditia_users')
        .select('id,email,role,status,password_hash')
        .eq('email', email)
        .maybeSingle();
      if (error) throw error;
      if (!user || user.status !== 'active' || !verifyPassword(password, user.password_hash)) return res.status(401).send('Email ou senha inválidos.');
      await supabase.from('auditia_users').update({ last_login_at: new Date().toISOString() }).eq('id', user.id);
      const session = await createSession(supabase, user.id);
      delete user.password_hash;
      return res.status(200).json({ ok: true, user, ...session });
    }

    if (action === 'logout') {
      const token = req.headers['x-auditia-session'] || req.body?.sessionToken;
      if (token) await supabase.from('auditia_sessions').delete().eq('token_hash', hashToken(token));
      return res.status(200).json({ ok: true });
    }

    res.status(400).send('Ação inválida.');
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message || 'Erro de autenticação.');
  }
}
