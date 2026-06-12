const { SYSTEM_PROMPT, setCors, readBody, runAI, sendJson } = require("./_shared");

module.exports = async function handler(req, res) {
  if (setCors(req, res)) return;
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  try {
    const { model, analysisType, processText } = await readBody(req);
    if (!processText) return sendJson(res, 400, { error: "Falta texto do processo." });

    const prompt = `${SYSTEM_PROMPT}\n\nTipo de análise: ${analysisType || "Auditoria Geral"}\n\nAnalisa o seguinte texto de processo. Extrai, se possível:\n- valor\n- fornecedor\n- datas\n- procedimento\n- cabimento\n- compromisso\n- fundos disponíveis\n- despachos/autorização\n- riscos e documentos em falta\n\nTexto:\n${String(processText).slice(0, 30000)}\n`;
    const answer = await runAI(model, prompt);
    return sendJson(res, 200, { answer });
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: err.message || "Erro na análise do processo." });
  }
};
