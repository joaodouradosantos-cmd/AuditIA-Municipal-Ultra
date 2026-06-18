import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://apllhzozqjevkrxjgtzb.supabase.co';

export const SYSTEM_PROMPT = `
És um assistente de apoio à auditoria municipal em Portugal.
Responde em português de Portugal, com rigor, mas sem afirmar que algo é definitivamente legal.
A resposta deve incluir:
1. Problema identificado
2. Legislação aplicável
3. Artigos relevantes, se forem fornecidos no contexto
4. Elementos a verificar
5. Riscos
6. Conclusão preliminar
7. Informação em falta
Nunca substituas decisão jurídica, financeira ou hierárquica.
`;

export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-AuditIA-Code, X-AuditIA-Session');
}

export function checkMethod(req, res, methods = ['POST']) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return false; }
  if (!methods.includes(req.method)) { res.status(405).send('Method not allowed'); return false; }
  return true;
}

export function requireAccess(req, res) {
  const expected = process.env.AUDITIA_ACCESS_CODE;
  if (!expected) return true;
  const got = req.headers['x-auditia-code'] || req.body?.accessCode || req.query?.accessCode;
  if (got !== expected) { res.status(401).send('Código de acesso inválido.'); return false; }
  return true;
}

export function supabaseAdmin() {
  const rawUrl = (process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL).trim();
  const url = rawUrl.startsWith('http') ? rawUrl : DEFAULT_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada na Vercel.');
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function runAI(model, prompt) {
  if (model === 'anthropic') return runClaude(prompt);
  return runOpenAI(prompt);
}

async function runOpenAI(prompt) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY não configurada na Vercel.');
  const client = new OpenAI({ apiKey: key });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Responde de forma técnica, estruturada, cautelosa e em português de Portugal.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2
  });
  return completion.choices?.[0]?.message?.content || '';
}

async function runClaude(prompt) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY não configurada na Vercel.');
  const client = new Anthropic({ apiKey: key });
  const msg = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest',
    max_tokens: 2500,
    temperature: 0.2,
    messages: [{ role: 'user', content: prompt }]
  });
  return msg.content?.map(c => c.text || '').join('\n') || '';
}
