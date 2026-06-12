import { checkMethod, requireAccess, supabaseAdmin } from './_common.js';

function getMemoryId(req) {
  const code = req.headers['x-auditia-code'] || req.body?.accessCode || req.query?.accessCode || process.env.AUDITIA_ACCESS_CODE || 'default';
  return `memory-${String(code).trim()}`;
}

export default async function handler(req, res) {
  if (!checkMethod(req, res, ['GET', 'POST'])) return;
  if (!requireAccess(req, res)) return;
  try {
    const supabase = supabaseAdmin();
    const memoryId = getMemoryId(req);

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('auditia_memory')
        .select('data, updated_at')
        .eq('id', memoryId)
        .maybeSingle();
      if (error) throw error;
      return res.status(200).json(data || { data: {}, updated_at: null });
    }

    const payload = req.body?.data;
    if (!payload || typeof payload !== 'object') return res.status(400).send('Memória inválida.');
    const { data, error } = await supabase
      .from('auditia_memory')
      .upsert({ id: memoryId, data: payload, updated_at: new Date().toISOString() })
      .select('updated_at')
      .single();
    if (error) throw error;
    res.status(200).json({ ok: true, updated_at: data.updated_at });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message || 'Erro ao sincronizar memória.');
  }
}
