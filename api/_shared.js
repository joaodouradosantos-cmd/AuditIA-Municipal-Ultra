const SYSTEM_PROMPT = `
És um assistente de apoio à auditoria municipal em Portugal.
Responde em português de Portugal, com rigor técnico e prudência.
Não afirmes que algo é definitivamente legal ou ilegal sem ressalvar a necessidade de validação documental, hierárquica ou jurídica.
A resposta deve incluir:
1. Problema identificado
2. Legislação aplicável
3. Artigos relevantes, se forem fornecidos no contexto
4. Elementos a verificar
5. Riscos
6. Conclusão preliminar
7. Informação em falta
Nunca substituas decisão jurídica, financeira, técnica ou hierárquica.
`;

function setCors(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === "object") return resolve(req.body);
    let data = "";
    req.on("data", chunk => {
      data += chunk;
      if (data.length > 1_000_000) {
        reject(new Error("Pedido demasiado grande."));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); }
      catch { reject(new Error("JSON inválido.")); }
    });
    req.on("error", reject);
  });
}

async function runAI(model, prompt) {
  if (model === "anthropic") return runClaude(prompt);
  return runOpenAI(prompt);
}

async function runOpenAI(prompt) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY não configurada na Vercel. Vai a Settings > Environment Variables e adiciona a chave.");
  const OpenAI = require("openai");
  const client = new OpenAI({ apiKey: key });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: "Responde de forma técnica, estruturada, cautelosa e em português de Portugal." },
      { role: "user", content: prompt }
    ],
    temperature: 0.2
  });
  return completion.choices?.[0]?.message?.content || "";
}

async function runClaude(prompt) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY não configurada na Vercel. Usa OpenAI ou adiciona a chave nas Environment Variables.");
  const Anthropic = require("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: key });
  const msg = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest",
    max_tokens: 2000,
    temperature: 0.2,
    messages: [{ role: "user", content: prompt }]
  });
  return msg.content?.map(c => c.text || "").join("\n") || "";
}

function sendJson(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(obj));
}

module.exports = { SYSTEM_PROMPT, setCors, readBody, runAI, sendJson };
