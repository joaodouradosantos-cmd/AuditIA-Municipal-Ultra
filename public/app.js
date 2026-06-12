const STORAGE_KEY="auditia_ultra_online_memory_v2";
let S={a:0,r:0,rel:0,ia:0,log:[]};
let RECORDS=[];
let CLOUD_TIMER=null;
try{
  const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}");
  if(saved.S) S=saved.S;
  if(Array.isArray(saved.records)) RECORDS=saved.records;
}catch(e){}
const tabs=[["dashboard","Dashboard"],["posso","Posso Fazer?"],["auditoria","Auditoria"],["ia-juridica","IA Jurídica"],["leitor-processos","Leitor Processos"],["programa","Programa"],["relatorio","Relatório"],["controlo","Controlo Interno"],["inspecao","Inspeções"],["bsc","Plano/BSC"],["biblioteca","Biblioteca"]];
document.getElementById("tabs").innerHTML=tabs.map((t,i)=>`<button class="tab ${i?'':'active'}" data-tab="${t[0]}">${t[1]}</button>`).join("");
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".panel").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.getElementById(b.dataset.tab).classList.add("active")});
const aud=["Competência/delegação válida","Fundamentação","Cabimento","Fundos disponíveis","Compromisso prévio","Procedimento CCP adequado","Contrato/despacho/documentos essenciais","RGPD/dados pessoais","Publicitação/transparência"];
document.getElementById("audChecks").innerHTML=aud.map((x,i)=>`<label><input type="checkbox" id="au${i}"> ${x}</label>`).join("");
function v(id){return document.getElementById(id).value.trim()}function L(a){return"<ul>"+a.map(x=>`<li>${x}</li>`).join("")+"</ul>"}function cls(n){return n==="ok"?"ok":n==="bad"?"bad":"warn"}function log(t,r=0,ia=0){S.a++;S.r+=r;S.ia+=ia;S.log.unshift(new Date().toLocaleString("pt-PT")+" — "+t);dash();persistLocal();queueCloudSave()}function dash(){kAnalises.textContent=S.a;kAlertas.textContent=S.r;kRelatorios.textContent=S.rel;kIA.textContent=S.ia;document.getElementById("log").innerHTML=S.log.length?L(S.log):"Sem atividade registada.";renderRecords()}
function proc(tipo,val){if(!val)return"Indicar valor.";if(tipo==="Empreitada")return val<30000?"Confirmar procedimento simplificado/CCP atualizado.":val<150000?"Confirmar consulta prévia ou procedimento concorrencial.":"Procedimento mais exigente; confirmar CCP.";return val<20000?"Poderá admitir ajuste direto, confirmando limites atuais e inexistência de fracionamento.":val<75000?"Confirmar consulta prévia/procedimento concorrencial.":"Procedimento concorrencial mais exigente; confirmar CCP."}
function possoFazer(){let riscos=[],valor=+v("pfValor"),tipo=v("pfTipo");if(v("pfCab")!="Sim")riscos.push("Cabimento não demonstrado.");if(v("pfFundos")!="Sim")riscos.push("Fundos disponíveis não demonstrados.");if(v("pfComp")!="Sim")riscos.push("Compromisso não demonstrado.");if(v("pfRec")!="Não")riscos.push("Verificar possível fracionamento/recorrência.");if(!valor)riscos.push("Valor não indicado.");let lv=riscos.length>=3?"bad":riscos.length?"warn":"ok";pfOut.innerHTML=`<span class="${cls(lv)}">${lv=="ok"?"🟢 Indícios favoráveis":lv=="bad"?"🔴 Risco elevado":"🟡 Atenção"}</span><h3>Procedimento provável</h3><p>${proc(tipo,valor)}</p><h3>Legislação</h3>${L(["CCP","Lei 8/2012","DL 127/2012","DL 155/92","CPA"])}<h3>Verificar</h3>${L(["Competência","Cabimento","Fundos disponíveis","Compromisso","Procedimento","Fundamentação"])}<h3>Alertas</h3>${riscos.length?L(riscos):"<p>Sem alertas críticos.</p>"}`;log("Posso Fazer",riscos.length);remember("Posso Fazer",pfOut.innerHTML)}
function auditoria(){let fal=aud.map((x,i)=>[x,document.getElementById("au"+i).checked]).filter(x=>!x[1]).map(x=>x[0]);let ok=aud.filter((x,i)=>document.getElementById("au"+i).checked);let lv=fal.length>=4?"bad":fal.length?"warn":"ok";auOut.innerHTML=`<span class="${cls(lv)}">${lv=="ok"?"🟢 Conforme":"🟡/🔴 Verificar"}</span><h3>Conformes</h3>${ok.length?L(ok):"<p>Nenhum.</p>"}<h3>Em falta/a verificar</h3>${fal.length?L(fal):"<p>Sem falhas.</p>"}<p>Recolher prova documental e fundamentar conclusão.</p>`;log("Auditoria",fal.length);remember("Auditoria",auOut.innerHTML)}
function motorLocal(){let q=v("iaPergunta").toLowerCase();let arr=LEGAL_BASE.filter(i=>i.tema.toLowerCase().includes(q)||i.keys.some(k=>q.includes(k)));if(!arr.length)arr=[{tema:"Sem correspondência direta",leis:["Análise manual"],artigos:[""],ver:["Reformular com termos: compromisso, cabimento, ajuste direto, RGPD, competência."],risco:"Informação insuficiente."}];iaOut.innerHTML=arr.map(i=>`<div class="card"><h3>${i.tema}</h3><p><b>Leis:</b> ${i.leis.join(", ")}</p><p><b>Artigos:</b> ${i.artigos.join(", ")}</p><p><b>Verificar:</b></p>${L(i.ver)}<p><b>Risco:</b> ${i.risco}</p></div>`).join("");log("Motor local",0);remember("Motor local",iaOut.innerHTML)}
async function iaJuridica(){const pergunta=v("iaPergunta");if(!pergunta){alert("Escreve a pergunta.");return}iaOut.innerHTML="A analisar com IA...";try{const res=await callApi("/aiLegalAnalysis",{model:v("iaModelo"),area:v("iaArea"),question:pergunta,localBase:LEGAL_BASE});iaOut.innerHTML=`<pre>${escapeHtml(res.answer||JSON.stringify(res,null,2))}</pre>`;log("IA Jurídica",0,1);remember("IA Jurídica",iaOut.innerHTML)}catch(e){iaOut.innerHTML=`<span class="bad">Erro IA</span><p>${escapeHtml(e.message)}</p><p>Usa o motor local enquanto o backend não estiver configurado.</p>`}}
async function analisarProcessoIA(){const texto=v("lpTexto");if(!texto){alert("Cola texto ou lê ficheiro TXT.");return}lpOut.innerHTML="A analisar processo com IA...";try{const res=await callApi("/analyzeProcess",{model:v("lpModelo"),analysisType:v("lpTipo"),processText:texto});lpOut.innerHTML=`<pre>${escapeHtml(res.answer||JSON.stringify(res,null,2))}</pre>`;log("Leitor de Processo IA",0,1);remember("Leitor de Processo IA",lpOut.innerHTML)}catch(e){lpOut.innerHTML=`<span class="bad">Erro IA</span><p>${escapeHtml(e.message)}</p><p>O backend Vercel ainda precisa de estar configurado.</p>`}}
function lerFicheiroLocal(){const f=document.getElementById("lpFile").files[0];if(!f){alert("Escolhe um ficheiro TXT.");return}if(!f.name.toLowerCase().endsWith(".txt")){alert("Nesta versão local só lê TXT no navegador. PDF/DOCX fica para o backend.");return}const r=new FileReader();r.onload=()=>{lpTexto.value=r.result;lpOut.innerHTML="<span class='ok'>Texto carregado.</span>"};r.readAsText(f)}
async function callApi(path,payload){const base=(window.APP_CONFIG&&APP_CONFIG.apiBaseUrl)||"";const url=(base?base:"")+"/api"+path;const response=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json","X-AuditIA-Code":getAccessCode()},body:JSON.stringify(payload)});if(!response.ok)throw new Error(await response.text());return response.json()}
function programa(){let passos=["Recolher legislação aplicável","Definir amostra/processos","Analisar competência e fundamentação","Verificar cabimento/fundos/compromisso","Avaliar procedimento e riscos","Elaborar constatações","Propor recomendações"];ptOut.innerHTML=`<h3>Programa de Trabalho — ${v("ptArea")}</h3><p><b>Âmbito:</b> ${v("ptAmbito")||"A definir"}</p><p><b>Período:</b> ${v("ptPeriodo")||"A definir"}</p><p><b>Responsável:</b> ${v("ptResp")||"A definir"}</p><p><b>Objetivo:</b> ${v("ptObj")||"Verificar conformidade legal, financeira e procedimental."}</p>${L(passos)}`;log("Programa de trabalho");remember("Programa de trabalho",ptOut.innerHTML)}
function relatorio(){rOut.innerHTML=`<h3>Relatório de Auditoria</h3><p><b>Objeto:</b> ${v("rObj")||"A definir"}</p><p><b>Serviço:</b> ${v("rServ")||"A definir"}</p><p><b>Período:</b> ${v("rPeriodo")||"A definir"}</p><p><b>Risco:</b> ${v("rRisco")}</p><h4>Factos</h4><p>${v("rFactos")||"A preencher."}</p><h4>Legislação</h4><p>${v("rLeis")||"A preencher."}</p><h4>Constatações</h4><p>${v("rConst")||"A preencher."}</p><h4>Recomendações</h4><p>${v("rRec")||"A preencher."}</p><h4>Conclusão</h4><p>Conclusão fundamentada com conformidades, riscos e medidas corretivas.</p>`;S.rel++;log("Relatório",v("rRisco")==="Elevado"?1:0);remember("Relatório",rOut.innerHTML)}
function controlo(){ciOut.innerHTML=`<h3>Medida de Controlo Interno</h3><p><b>Área:</b> ${v("ciArea")||"A definir"}</p><p><b>Risco:</b> ${v("ciRisco")}</p><p><b>Responsável:</b> ${v("ciResp")||"A definir"}</p><p><b>Prazo:</b> ${v("ciPrazo")||"A definir"}</p><p><b>Falha:</b> ${v("ciFalha")||"A preencher."}</p><p><b>Medida:</b> ${v("ciMedida")||"A preencher."}</p>`;log("Controlo interno",v("ciRisco")==="Elevado"?1:0);remember("Controlo interno",ciOut.innerHTML)}
function inspecao(){let d=(v("inDil")||"Recolher documentos;Ouvir intervenientes;Analisar registos;Elaborar informação final").split(";").map(x=>x.trim()).filter(Boolean);inOut.innerHTML=`<h3>Plano de ${v("inTipo")}</h3><p><b>Serviço:</b> ${v("inServ")||"A definir"}</p><p><b>Determinação:</b> ${v("inDet")||"A definir"}</p><p><b>Data:</b> ${v("inData")||"A definir"}</p><h4>Factos</h4><p>${v("inFactos")||"A preencher."}</p><h4>Diligências</h4>${L(d)}`;log("Inspeção/Inquérito");remember("Inspeção/Inquérito",inOut.innerHTML)}
function bsc(){bOut.innerHTML=`<h3>Objetivo BSC</h3><p><b>Objetivo:</b> ${v("bObj")||"A definir"}</p><p><b>KPI:</b> ${v("bKpi")||"A definir"}</p><p><b>Meta:</b> ${v("bMeta")||"A definir"}</p><p><b>Prazo:</b> ${v("bPrazo")||"A definir"}</p><p><b>Ações:</b> ${v("bAcoes")||"A definir"}</p>`;log("Plano/BSC");remember("Plano/BSC",bOut.innerHTML)}
function biblioteca(){let q=v("bibQ").toLowerCase();let arr=!q?LEGAL_BASE:LEGAL_BASE.filter(i=>i.tema.toLowerCase().includes(q)||i.keys.some(k=>k.includes(q))||i.leis.some(l=>l.toLowerCase().includes(q)));bibOut.innerHTML=arr.map(i=>`<div class="card"><h3>${i.tema}</h3><p><b>Leis:</b> ${i.leis.join(", ")}</p><p><b>Artigos:</b> ${i.artigos.join(", ")}</p><p><b>Verificar:</b></p>${L(i.ver)}<p><b>Risco:</b> ${i.risco}</p></div>`).join("")}
function copiar(id){navigator.clipboard.writeText(document.getElementById(id).innerText).then(()=>alert("Texto copiado."))}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
biblioteca();dash();

function getAccessCode(){return (document.getElementById("accessCode")?.value||localStorage.getItem("auditia_access_code")||"").trim()}
function setStatus(msg){const el=document.getElementById("cloudStatus");if(el)el.value=msg}
function collectForms(){const forms={};document.querySelectorAll("input,select,textarea").forEach(el=>{if(!el.id||el.type==="file")return;forms[el.id]=el.value});return forms}
function restoreForms(forms={}){Object.entries(forms).forEach(([id,val])=>{const el=document.getElementById(id);if(el&&el.type!=="file")el.value=val})}
function memoryPayload(){return {version:2,updatedAt:new Date().toISOString(),S,records:RECORDS,forms:collectForms()}}
function persistLocal(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(memoryPayload()));localStorage.setItem("auditia_access_code",getAccessCode())}catch(e){console.warn(e)}}
function remember(tipo,html){RECORDS.unshift({id:Date.now()+"-"+Math.random().toString(16).slice(2),tipo,html,createdAt:new Date().toISOString()});RECORDS=RECORDS.slice(0,200);renderRecords();persistLocal();queueCloudSave()}
function renderRecords(){const el=document.getElementById("records");if(!el)return;el.innerHTML=RECORDS.length?RECORDS.slice(0,20).map(r=>`<div class="card"><small>${new Date(r.createdAt).toLocaleString("pt-PT")}</small><h3>${escapeHtml(r.tipo)}</h3><div>${r.html}</div></div>`).join(""):"<p class='hint'>Ainda não há registos guardados.</p>"}
function queueCloudSave(){clearTimeout(CLOUD_TIMER);CLOUD_TIMER=setTimeout(()=>cloudSaveNow(true),1200)}
async function cloudLoad(){try{setStatus("A carregar...");const res=await fetch("/api/memory",{headers:{"X-AuditIA-Code":getAccessCode()}});if(!res.ok)throw new Error(await res.text());const json=await res.json();const data=json.data||{};if(data.S)S=data.S;if(Array.isArray(data.records))RECORDS=data.records;if(data.forms)restoreForms(data.forms);dash();persistLocal();setStatus("Memória carregada: "+(json.updated_at?new Date(json.updated_at).toLocaleString("pt-PT"):"sem data"))}catch(e){setStatus("Erro: "+e.message)}}
async function cloudSaveNow(silent=false){try{persistLocal();if(!getAccessCode()&&!silent){setStatus("Indica o código de acesso.");return}setStatus("A guardar...");const res=await fetch("/api/memory",{method:"POST",headers:{"Content-Type":"application/json","X-AuditIA-Code":getAccessCode()},body:JSON.stringify({data:memoryPayload()})});if(!res.ok)throw new Error(await res.text());const json=await res.json();setStatus("Guardado: "+new Date(json.updated_at||Date.now()).toLocaleString("pt-PT"))}catch(e){if(!silent)setStatus("Erro: "+e.message);else console.warn(e)}}
function exportarMemoria(){const blob=new Blob([JSON.stringify(memoryPayload(),null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="auditia-memoria-"+new Date().toISOString().slice(0,10)+".json";a.click();URL.revokeObjectURL(a.href)}
function importarMemoria(ev){const f=ev.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const data=JSON.parse(r.result);if(data.S)S=data.S;if(Array.isArray(data.records))RECORDS=data.records;if(data.forms)restoreForms(data.forms);dash();persistLocal();setStatus("Memória importada. Carrega em Guardar agora para sincronizar online.")}catch(e){alert("Ficheiro inválido.")}};r.readAsText(f)}

document.addEventListener("input",e=>{if(e.target&&e.target.id){persistLocal();queueCloudSave()}});
window.addEventListener("load",()=>{const code=localStorage.getItem("auditia_access_code")||"";const el=document.getElementById("accessCode");if(el)el.value=code;try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}");if(saved.forms)restoreForms(saved.forms)}catch(e){}dash();});

function deleteRecord(id){
  RECORDS = RECORDS.filter(r => r.id !== id);
  renderRecords();
  persistLocal();
  queueCloudSave();
}

function renameRecord(id){
  const rec = RECORDS.find(r => r.id === id);
  if(!rec) return;
  const current = rec.customName || rec.tipo;
  const newName = prompt("Novo título do registo:", current);
  if(newName && newName.trim()){
    rec.customName = newName.trim();
    renderRecords();
    persistLocal();
  }
  queueCloudSave();
 
  

function renderRecords(){
  const el = document.getElementById("records");
  if(!el) return;
  el.innerHTML = RECORDS.length ?
    RECORDS.slice(0,20).map(r =>
      `<div class="card"><small>${new Date(r.createdAt).toLocaleString("pt-PT")}</small><h3>${escapeHtml(r.customName || r.tipo)}</h3><div>${r.html}</div><div class="record-actions"><button class="rename-btn" onclick="renameRecord('${r.id}')">Renomear</button> <button class="delete-btn" onclick="deleteRecord('${r.id}')">Eliminar</button></div></div>`
    ).join("")
    : "<p class='hint'>Ainda não há registos guardados.</p>";
}

