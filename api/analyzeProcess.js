import { checkMethod, requireAccess, runAI, SYSTEM_PROMPT } from './_common.js';

export default async function handler(req, res) {
  if (!checkMethod(req, res)) return;
  if (!requireAccess(req, res)) return;
  try {
    const { model, analysisType, processText } = req.body || {};
    if (!processText) return res.status(400).send('Falta texto do processo.');
    const prompt = `${SYSTEM_PROMPT}\n\nTipo de análise: ${analysisType || 'Auditoria Geral'}\n\nAnalisa o seguinte texto de processo. Extrai, se possível:\n- valor\n- fornecedor\n- datas\n- procedimento\n- cabimento\n- compromisso\n- fundos disponíveis\n- despachos/autorização\n- riscos e documentos em falta\n\nTexto:\n${String(processText).slice(0, 30000)}`;
    const answer = await runAI(model, prompt);
    res.status(200).json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message || 'Erro na análise do processo.');
  }
}
