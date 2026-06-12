import { checkMethod, requireAccess, runAI, SYSTEM_PROMPT } from './_common.js';

export default async function handler(req, res) {
  if (!checkMethod(req, res)) return;
  if (!requireAccess(req, res)) return;
  try {
    const { model, area, question, localBase } = req.body || {};
    if (!question) return res.status(400).send('Falta a pergunta.');
    const context = JSON.stringify(localBase || [], null, 2).slice(0, 12000);
    const prompt = `${SYSTEM_PROMPT}\nÁrea: ${area || 'não indicada'}\n\nBase local de apoio:\n${context}\n\nPergunta:\n${question}`;
    const answer = await runAI(model, prompt);
    res.status(200).json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message || 'Erro na análise IA.');
  }
}
