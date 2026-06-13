const AUDITIA_AREA_CHECKS = {
  "Contratação Pública": [
    "Competência/delegação válida",
    "Decisão de contratar fundamentada",
    "Cabimento",
    "Fundos disponíveis",
    "Compromisso prévio",
    "Procedimento CCP adequado",
    "Convites, propostas e adjudicação documentados",
    "Contrato e publicitação quando aplicável",
    "Verificação de fracionamento"
  ],
  "Despesa e Fundos": [
    "Autorização da despesa",
    "Cabimento prévio",
    "Fundos disponíveis",
    "Compromisso registado",
    "Documento de suporte",
    "Liquidação correta",
    "Pagamento autorizado",
    "Segregação de funções",
    "Rastreabilidade contabilística"
  ],
  "Recursos Humanos": [
    "Vínculo enquadrado",
    "Mapa de pessoal verificado",
    "Remuneração correta",
    "Assiduidade validada",
    "Trabalho suplementar autorizado",
    "Mobilidade ou acumulação autorizada",
    "SIADAP/documentos de avaliação",
    "Arquivo individual completo"
  ],
  "Urbanismo": [
    "Legitimidade do requerente",
    "Instrução completa",
    "PDM, loteamento ou AUGI verificados",
    "Servidões e condicionantes analisadas",
    "Pareceres necessários recolhidos",
    "Taxas liquidadas",
    "Decisão técnica fundamentada",
    "Prazos e notificações cumpridos",
    "Fiscalização e arquivo assegurados"
  ],
  "RGPD/Acesso à Informação": [
    "Dados pessoais identificados",
    "Base legal do tratamento",
    "Minimização ou anonimização ponderada",
    "Prazo de resposta verificado",
    "Fundamentação da decisão",
    "Registo do pedido",
    "Equilíbrio entre transparência e proteção de dados"
  ],
  "Património": [
    "Inventário ou cadastro atualizado",
    "Titularidade confirmada",
    "Avaliação e documentos de suporte",
    "Autorização competente",
    "Registo contabilístico",
    "Afetação, cedência ou alienação documentada",
    "Controlo físico do bem"
  ]
};

function auditiaApplyEnhancementStyles() {
  if (document.getElementById("auditia-enhancement-styles")) return;
  const style = document.createElement("style");
  style.id = "auditia-enhancement-styles";
  style.textContent = `
    .tab[data-tab="ia-juridica"], .tab[data-tab="leitor-processos"] { border-color:#9be397; box-shadow:0 0 0 1px rgba(155,227,151,.22) inset; }
    #moduleJump { display:none; width:100%; margin:10px 0; background:#0d150e; color:#eef4ea; border:1px solid #40523d; border-radius:8px; padding:10px; }
    .dashboard-extra { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:12px; margin:14px 0; }
    .dash-card { background:#0d150e; border:1px solid #40523d; border-radius:12px; padding:14px; }
    .dash-card b { color:#6fa36b; display:block; font-size:22px; margin-bottom:4px; }
    .dash-card span { color:#aebca8; }
    @media(max-width:800px) {
      #moduleJump { display:block; }
      nav { display:grid; grid-template-columns:1fr 1fr; gap:8px; max-height:230px; overflow:auto; }
      .tab { white-space:normal; text-align:center; font-size:13px; padding:9px; }
      main { padding:10px; }
      .panel { padding:12px; }
      .grid, .kpis { grid-template-columns:1fr; }
      .cards { grid-template-columns:1fr; }
    }
  `;
  document.head.appendChild(style);
}

function auditiaAddMobileSelector() {
  const tabs = document.getElementById("tabs");
  if (!tabs || document.getElementById("moduleJump")) return;
  const select = document.createElement("select");
  select.id = "moduleJump";
  select.innerHTML = Array.from(tabs.querySelectorAll(".tab"))
    .map(button => `<option value="${button.dataset.tab}">${button.textContent}</option>`)
    .join("");
  select.addEventListener("change", () => {
    const button = tabs.querySelector(`.tab[data-tab="${select.value}"]`);
    if (button) button.click();
  });
  tabs.parentNode.insertBefore(select, tabs);
  tabs.addEventListener("click", event => {
    const button = event.target.closest(".tab");
    if (button) select.value = button.dataset.tab;
  });
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
  box.innerHTML = `
    <div class="dash-card"><b>${records}</b><span>Registos persistidos</span></div>
    <div class="dash-card"><b>${alertas}</b><span>Alertas acumulados</span></div>
    <div class="dash-card"><b>IA/PDF</b><span>Módulos críticos destacados</span></div>
  `;
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

window.addEventListener("load", () => {
  auditiaApplyEnhancementStyles();
  auditiaAddMobileSelector();
  auditiaAddDashboardDetails();
  auditiaAddAuditAreaSelector();
});
