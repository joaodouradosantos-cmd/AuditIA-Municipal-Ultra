const AUDITIA_AREA_CHECKS = {
  "Contratação Pública": ["Competência/delegação válida","Decisão de contratar fundamentada","Cabimento","Fundos disponíveis","Compromisso prévio","Procedimento CCP adequado","Convites, propostas e adjudicação documentados","Contrato e publicitação quando aplicável","Verificação de fracionamento"],
  "Despesa e Fundos": ["Autorização da despesa","Cabimento prévio","Fundos disponíveis","Compromisso registado","Documento de suporte","Liquidação correta","Pagamento autorizado","Segregação de funções","Rastreabilidade contabilística"],
  "Recursos Humanos": ["Vínculo enquadrado","Mapa de pessoal verificado","Remuneração correta","Assiduidade validada","Trabalho suplementar autorizado","Mobilidade ou acumulação autorizada","SIADAP/documentos de avaliação","Arquivo individual completo"],
  "Urbanismo": ["Legitimidade do requerente","Instrução completa","PDM, loteamento ou AUGI verificados","Servidões e condicionantes analisadas","Pareceres necessários recolhidos","Taxas liquidadas","Decisão técnica fundamentada","Prazos e notificações cumpridos","Fiscalização e arquivo assegurados"],
  "RGPD/Acesso à Informação": ["Dados pessoais identificados","Base legal do tratamento","Minimização ou anonimização ponderada","Prazo de resposta verificado","Fundamentação da decisão","Registo do pedido","Equilíbrio entre transparência e proteção de dados"],
  "Património": ["Inventário ou cadastro atualizado","Titularidade confirmada","Avaliação e documentos de suporte","Autorização competente","Registo contabilístico","Afetação, cedência ou alienação documentada","Controlo físico do bem"]
};

function auditiaApplyEnhancementStyles() {
  if (document.getElementById("auditia-enhancement-styles")) return;
  const style = document.createElement("style");
  style.id = "auditia-enhancement-styles";
  style.textContent = `
    .tab[data-tab="ia-juridica"], .tab[data-tab="leitor-processos"], .tab[data-tab="endividamento"] { border-color:#9be397; box-shadow:0 0 0 1px rgba(155,227,151,.22) inset; }
    #moduleJump { display:none; width:100%; margin:10px 0; background:#fff; color:#172116; border:1px solid #d8dfd4; border-radius:10px; padding:10px; }
    .dashboard-extra,.debt-kpis { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:12px; margin:14px 0; }
    .dash-card,.debt-card { background:#fff; border:1px solid #d8dfd4; border-radius:14px; padding:14px; }
    .dash-card b,.debt-card b { color:#234b2b; display:block; font-size:22px; margin-bottom:4px; }
    .dash-card span,.debt-card span { color:#64705f; }
    .formula-box { background:#f7f9f5; border:1px solid #d8dfd4; border-radius:12px; padding:12px; margin-top:12px; }
    @media(max-width:800px) { #moduleJump { display:block; } nav { display:grid; grid-template-columns:1fr 1fr; gap:8px; max-height:230px; overflow:auto; } .tab { white-space:normal; text-align:center; font-size:13px; padding:9px; } main { padding:10px; } .panel { padding:12px; } .grid, .kpis { grid-template-columns:1fr; } .cards { grid-template-columns:1fr; } }
  `;
  document.head.appendChild(style);
}

function auditiaShowTab(id) {
  if (typeof showTab === "function") { showTab(id); return; }
  document.querySelectorAll(".tab,.panel").forEach(el => el.classList.remove("active"));
  document.querySelector(`.tab[data-tab="${id}"]`)?.classList.add("active");
  document.getElementById(id)?.classList.add("active");
}

function auditiaAddTab(id, label) {
  const tabs = document.getElementById("tabs");
  if (!tabs || tabs.querySelector(`.tab[data-tab="${id}"]`)) return;
  const button = document.createElement("button");
  button.className = "tab";
  button.dataset.tab = id;
  button.textContent = label;
  button.addEventListener("click", () => auditiaShowTab(id));
  tabs.appendChild(button);
}

function auditiaAddMobileSelector() {
  const tabs = document.getElementById("tabs");
  if (!tabs || document.getElementById("moduleJump")) return;
  const select = document.createElement("select");
  select.id = "moduleJump";
  select.addEventListener("change", () => auditiaShowTab(select.value));
  tabs.parentNode.insertBefore(select, tabs);
  tabs.addEventListener("click", event => {
    const button = event.target.closest(".tab");
    if (button) select.value = button.dataset.tab;
  });
  auditiaRefreshModuleSelector();
}

function auditiaRefreshModuleSelector() {
  const tabs = document.getElementById("tabs");
  const select = document.getElementById("moduleJump");
  if (!tabs || !select) return;
  select.innerHTML = Array.from(tabs.querySelectorAll(".tab")).map(button => `<option value="${button.dataset.tab}">${button.textContent}</option>`).join("");
}

function auditiaAddDashboardDetails() {
  const log = document.getElementById("log");
  if (!log || document.getElementById("dashExtra")) return;
  const box = document.createElement("div");
  box.id = "dashExtra";
  box.className = "dashboard-extra";
  const saved = JSON.parse(localStorage.getItem("auditia_ultra_online_memory_v3") || "{}");
  const records = Array.isArray(saved.records) ? saved.records.length : 0;
  const alertas = saved.S && Number.isFinite(saved.S.r) ? saved.S.r : 0;
  box.innerHTML = `<div class="dash-card"><b>${records}</b><span>Registos persistidos</span></div><div class="dash-card"><b>${alertas}</b><span>Alertas acumulados</span></div><div class="dash-card"><b>Word/IA</b><span>Relatórios editáveis e análise assistida</span></div>`;
  log.insertAdjacentElement("afterend", box);
}

function auditiaRenderAreaChecks() {
  const area = document.getElementById("auArea")?.value || "Contratação Pública";
  const list = AUDITIA_AREA_CHECKS[area] || AUDITIA_AREA_CHECKS["Contratação Pública"];
  const target = document.getElementById("audChecks");
  if (!target) return;
  target.innerHTML = list.map((text, index) => `<label><input type="checkbox" id="au${index}"> ${text}</label>`).join("");
}

function auditiaAddAuditAreaSelector() {
  const target = document.getElementById("audChecks");
  if (!target || document.getElementById("auArea")) return;
  const label = document.createElement("label");
  label.innerHTML = `Área da auditoria<select id="auArea">${Object.keys(AUDITIA_AREA_CHECKS).map(area => `<option>${area}</option>`).join("")}</select>`;
  target.parentNode.insertBefore(label, target);
  document.getElementById("auArea").addEventListener("change", auditiaRenderAreaChecks);
  auditiaRenderAreaChecks();
}

window.auditoria = function auditoriaDinamica() {
  const area = document.getElementById("auArea")?.value || "Contratação Pública";
  const list = AUDITIA_AREA_CHECKS[area] || AUDITIA_AREA_CHECKS["Contratação Pública"];
  const falhas = list.filter((text, index) => !document.getElementById("au" + index)?.checked);
  const ok = list.filter((text, index) => document.getElementById("au" + index)?.checked);
  const level = falhas.length >= 4 ? "bad" : falhas.length ? "warn" : "ok";
  const listHtml = arr => "<ul>" + arr.map(item => "<li>" + item + "</li>").join("") + "</ul>";
  const out = document.getElementById("auOut");
  if (!out) return;
  out.innerHTML = `<span class="${level}">${level === "ok" ? "🟢 Conforme" : "🟡/🔴 Verificar"}</span><h3>Área</h3><p>${area}</p><h3>Conformes</h3>${ok.length ? listHtml(ok) : "<p>Nenhum.</p>"}<h3>Em falta/a verificar</h3>${falhas.length ? listHtml(falhas) : "<p>Sem falhas.</p>"}<p>Recolher prova documental e fundamentar conclusão.</p>`;
  if (typeof log === "function") log("Auditoria", falhas.length);
  if (typeof remember === "function") remember("Auditoria", out.innerHTML);
};

function auditiaMoney(id) {
  const value = Number(String(document.getElementById(id)?.value || "0").replace(",", "."));
  return Number.isFinite(value) ? value : 0;
}

function auditiaPct(value) {
  return Number.isFinite(value) ? value.toFixed(2).replace(".", ",") + "%" : "n/a";
}

function auditiaEuro(value) {
  return Number.isFinite(value) ? value.toLocaleString("pt-PT", { style: "currency", currency: "EUR" }) : "n/a";
}

function auditiaDebtLevel(percent) {
  if (!Number.isFinite(percent)) return "warn";
  if (percent >= 100) return "bad";
  if (percent >= 85) return "warn";
  return "ok";
}

function auditiaAddDebtModule() {
  if (document.getElementById("endividamento")) return;
  const main = document.querySelector("main");
  if (!main) return;
  const section = document.createElement("section");
  section.id = "endividamento";
  section.className = "panel";
  section.innerHTML = `
    <h2>Endividamento Municipal / Sustentabilidade Financeira</h2>
    <p class="hint">Módulo de apoio ao cálculo de KPIs financeiros com base na Lei n.º 73/2013, LCPA e SNC-AP.</p>
    <div class="grid">
      <label>Dívida total atual (€)<input id="endDivida" type="number" min="0" step="0.01"></label>
      <label>Receita corrente líquida — ano -1 (€)<input id="endRc1" type="number" min="0" step="0.01"></label>
      <label>Receita corrente líquida — ano -2 (€)<input id="endRc2" type="number" min="0" step="0.01"></label>
      <label>Receita corrente líquida — ano -3 (€)<input id="endRc3" type="number" min="0" step="0.01"></label>
      <label>Juros anuais (€)<input id="endJuros" type="number" min="0" step="0.01"></label>
      <label>Amortizações anuais (€)<input id="endAmort" type="number" min="0" step="0.01"></label>
      <label>Receita corrente do ano (€)<input id="endReceitaCorrente" type="number" min="0" step="0.01"></label>
      <label>Despesa corrente do ano (€)<input id="endDespesaCorrente" type="number" min="0" step="0.01"></label>
      <label>Receitas próprias (€)<input id="endReceitasProprias" type="number" min="0" step="0.01"></label>
      <label>Receita total (€)<input id="endReceitaTotal" type="number" min="0" step="0.01"></label>
      <label>Compromissos assumidos (€)<input id="endCompromissos" type="number" min="0" step="0.01"></label>
      <label>Fundos disponíveis (€)<input id="endFundos" type="number" min="0" step="0.01"></label>
      <label>Pagamentos em atraso (€)<input id="endAtrasos" type="number" min="0" step="0.01"></label>
    </div>
    <button onclick="calcularEndividamento()">Calcular KPIs</button>
    <button class="secondary" onclick="exportDoc('endOut','kpis-endividamento-municipal')">Exportar Word editável</button>
    <div class="formula-box"><b>Base de leitura:</b> Lei n.º 73/2013 — regime financeiro das autarquias; LCPA — Lei n.º 8/2012 e DL n.º 127/2012; SNC-AP — registo e relato financeiro.</div>
    <div id="endOut" class="result"></div>
  `;
  const biblioteca = document.getElementById("biblioteca");
  if (biblioteca) main.insertBefore(section, biblioteca); else main.appendChild(section);
  auditiaAddTab("endividamento", "Endividamento");
  auditiaRefreshModuleSelector();
}

window.calcularEndividamento = function calcularEndividamento() {
  const divida = auditiaMoney("endDivida");
  const rc1 = auditiaMoney("endRc1");
  const rc2 = auditiaMoney("endRc2");
  const rc3 = auditiaMoney("endRc3");
  const mediaRc = (rc1 + rc2 + rc3) / 3;
  const limite = mediaRc * 1.5;
  const margem = limite - divida;
  const taxaLimite = limite > 0 ? divida / limite * 100 : NaN;
  const juros = auditiaMoney("endJuros");
  const amort = auditiaMoney("endAmort");
  const receitaCorrente = auditiaMoney("endReceitaCorrente");
  const despesaCorrente = auditiaMoney("endDespesaCorrente");
  const servicoDivida = receitaCorrente > 0 ? (juros + amort) / receitaCorrente * 100 : NaN;
  const poupancaCorrente = receitaCorrente - despesaCorrente;
  const receitasProprias = auditiaMoney("endReceitasProprias");
  const receitaTotal = auditiaMoney("endReceitaTotal");
  const autonomia = receitaTotal > 0 ? receitasProprias / receitaTotal * 100 : NaN;
  const compromissos = auditiaMoney("endCompromissos");
  const fundos = auditiaMoney("endFundos");
  const pressaoCompromissos = fundos > 0 ? compromissos / fundos * 100 : NaN;
  const atrasos = auditiaMoney("endAtrasos");
  const level = auditiaDebtLevel(taxaLimite);
  const estado = level === "bad" ? "🔴 Acima/sem margem face ao limite calculado" : level === "warn" ? "🟡 Próximo do limite — acompanhar" : "🟢 Com margem financeira";
  const out = document.getElementById("endOut");
  out.innerHTML = `
    <span class="${level}">${estado}</span>
    <div class="debt-kpis">
      <div class="debt-card"><b>${auditiaEuro(mediaRc)}</b><span>Média da receita corrente líquida dos 3 anos</span></div>
      <div class="debt-card"><b>${auditiaEuro(limite)}</b><span>Limite indicativo da dívida total (1,5 x média)</span></div>
      <div class="debt-card"><b>${auditiaPct(taxaLimite)}</b><span>Utilização do limite de dívida</span></div>
      <div class="debt-card"><b>${auditiaEuro(margem)}</b><span>Margem de endividamento disponível</span></div>
      <div class="debt-card"><b>${auditiaPct(servicoDivida)}</b><span>Serviço da dívida / receita corrente</span></div>
      <div class="debt-card"><b>${auditiaEuro(poupancaCorrente)}</b><span>Poupança corrente</span></div>
      <div class="debt-card"><b>${auditiaPct(autonomia)}</b><span>Autonomia financeira</span></div>
      <div class="debt-card"><b>${auditiaPct(pressaoCompromissos)}</b><span>Compromissos / fundos disponíveis</span></div>
      <div class="debt-card"><b>${auditiaEuro(atrasos)}</b><span>Pagamentos em atraso</span></div>
    </div>
    <h3>Legislação de suporte</h3>
    <ul>
      <li>Lei n.º 73/2013 — regime financeiro das autarquias locais e entidades intermunicipais.</li>
      <li>Lei n.º 8/2012 e DL n.º 127/2012 — compromissos, fundos disponíveis e controlo da despesa.</li>
      <li>SNC-AP — registo contabilístico, relato financeiro e coerência orçamental/patrimonial.</li>
    </ul>
    <h3>Verificações de auditoria</h3>
    <ul>
      <li>Confirmar se a dívida total inclui empréstimos, locações financeiras e restantes responsabilidades relevantes.</li>
      <li>Validar a receita corrente líquida cobrada nos três exercícios anteriores.</li>
      <li>Confirmar reconciliação entre contabilidade, tesouraria e demonstrações financeiras.</li>
      <li>Verificar pagamentos em atraso, compromissos assumidos e fundos disponíveis.</li>
      <li>Fundamentar a margem de endividamento e eventuais riscos de sustentabilidade.</li>
    </ul>
  `;
  if (typeof log === "function") log("Endividamento municipal", level === "bad" ? 2 : level === "warn" ? 1 : 0);
  if (typeof remember === "function") remember("Endividamento municipal", out.innerHTML);
};

window.addEventListener("load", () => {
  auditiaApplyEnhancementStyles();
  auditiaAddMobileSelector();
  auditiaAddDashboardDetails();
  auditiaAddAuditAreaSelector();
  auditiaAddDebtModule();
});
