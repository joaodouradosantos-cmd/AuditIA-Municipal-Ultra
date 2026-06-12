const { SYSTEM_PROMPT, setCors, readBody, runAI, sendJson } = require("./_shared");

module.exports = async function handler(req, res) {
  if (setCors(req, res)) return;
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  try {
    const { model, area, question, localBase } = await readBody(req);
    if (!question) return sendJson(res, 400, { error: "Falta a pergunta." });

    const context = JSON.stringify(localBase || [], null, 2).slice(0, 12000);
    const prompt = `${SYSTEM_PROMPT}\n\nÁrea: ${area || "não indicada"}\n\nBase local de apoio:\n${context}\n\nPergunta:\n${question}\n`;
    const answer = await runAI(model, prompt);
    return sendJson(res, 200, { answer });
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: err.message || "Erro na análise IA." });
  }
};
