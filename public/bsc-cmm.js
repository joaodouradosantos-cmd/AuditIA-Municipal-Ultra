function auditiaAddBscMunicipalFields() {
  const section = document.getElementById('bsc');
  const grid = section?.querySelector('.grid');
  if (!section || !grid || document.getElementById('bArea')) return;

  const intro = document.createElement('div');
  intro.className = 'formula-box';
  intro.innerHTML = '<b>Plano de Atividades / BSC numa Câmara Municipal</b><p>O Plano de Atividades define o que a Câmara pretende executar; o BSC mede se essas ações produzem resultados, com foco no serviço público, transparência, eficiência e valor para o munícipe.</p>';
  section.insertBefore(intro, grid);

  grid.insertAdjacentHTML('afterbegin', `
    <label>Área municipal<select id="bArea"><option>Urbanismo</option><option>Ambiente</option><option>Ação Social</option><option>Cultura</option><option>Educação</option><option>Financeira</option><option>Atendimento ao Munícipe</option><option>Obras Municipais</option><option>Recursos Humanos</option></select></label>
    <label>Perspetiva BSC<select id="bPerspetiva"><option>Financeira</option><option>Munícipe</option><option>Processos Internos</option><option>Aprendizagem e Crescimento</option></select></label>
    <label>Responsável / Serviço<input id="bResp" placeholder="Divisão/Unidade responsável"></label>
    <label>Orçamento associado (€)<input id="bOrc" type="number" min="0" step="0.01"></label>
    <label>Grau de execução (%)<input id="bExec" type="number" min="0" max="100" step="0.01"></label>
    <label>Estado<select id="bEstado"><option>Planeado</option><option>Em execução</option><option>Concluído</option><option>Em atraso</option><option>Não iniciado</option></select></label>
  `);

  const output = document.getElementById('bOut');
  if (output && !document.getElementById('bOutDoc')) {
    output.insertAdjacentHTML('beforebegin', '<button id="bOutDoc" class="secondary" onclick="exportDoc(\'bOut\',\'plano-atividades-bsc-cmm\')">Exportar Word editável</button>');
  }
}

function auditiaBscRisk(exec, estado) {
  if (estado === 'Em atraso' || estado === 'Não iniciado') return 'Elevado';
  if (Number.isFinite(exec) && exec < 50) return 'Elevado';
  if (Number.isFinite(exec) && exec < 80) return 'Médio';
  return 'Baixo';
}

window.bsc = function bscMunicipal() {
  const get = id => (document.getElementById(id)?.value || '').trim();
  const exec = Number(get('bExec').replace(',', '.'));
  const estado = get('bEstado') || 'A definir';
  const risco = auditiaBscRisk(exec, estado);
  const out = document.getElementById('bOut');
  if (!out) return;
  out.innerHTML = `
    <h3>Plano de Atividades / BSC — Câmara Municipal</h3>
    <p><b>Área municipal:</b> ${get('bArea') || 'A definir'}</p>
    <p><b>Perspetiva BSC:</b> ${get('bPerspetiva') || 'A definir'}</p>
    <p><b>Objetivo:</b> ${get('bObj') || 'A definir'}</p>
    <p><b>Serviço responsável:</b> ${get('bResp') || 'A definir'}</p>
    <p><b>Orçamento associado:</b> ${get('bOrc') ? Number(get('bOrc')).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' }) : 'A definir'}</p>
    <p><b>KPI / Indicador:</b> ${get('bKpi') || 'A definir'}</p>
    <p><b>Meta:</b> ${get('bMeta') || 'A definir'}</p>
    <p><b>Prazo:</b> ${get('bPrazo') || 'A definir'}</p>
    <p><b>Estado:</b> ${estado}</p>
    <p><b>Grau de execução:</b> ${Number.isFinite(exec) ? exec.toFixed(2).replace('.', ',') + '%' : 'A definir'}</p>
    <h4>Ações previstas / executadas</h4>
    <p>${get('bAcoes') || 'A definir'}</p>
    <h4>Leitura de auditoria</h4>
    <ul>
      <li>Verificar se o Plano de Atividades existe, foi aprovado e está alinhado com o orçamento municipal.</li>
      <li>Confirmar se o objetivo é concreto, mensurável, executável e atribuído a um serviço responsável.</li>
      <li>Conferir se o KPI mede efetivamente o resultado esperado e se existe monitorização periódica.</li>
      <li>Comparar o grau de execução físico com a execução financeira associada.</li>
      <li>Verificar se os dados do BSC são usados para decisão, correção de desvios e responsabilização.</li>
    </ul>
    <h4>Risco preliminar</h4>
    <p><b>${risco}</b> — ${risco === 'Elevado' ? 'risco de planeamento formal sem execução efetiva, baixa monitorização ou desvio relevante.' : risco === 'Médio' ? 'existem desvios a acompanhar e necessidade de evidência documental.' : 'execução e monitorização aparentemente adequadas, sujeitas a prova documental.'}</p>
    <h4>Conclusão simples</h4>
    <p>O Plano de Atividades define o que a Câmara pretende fazer; o BSC permite avaliar se essas ações produziram resultados com eficiência, transparência e valor para o munícipe.</p>
  `;
  if (typeof log === 'function') log('Plano/BSC', risco === 'Elevado' ? 1 : 0);
  if (typeof remember === 'function') remember('Plano/BSC', out.innerHTML);
};

window.addEventListener('load', auditiaAddBscMunicipalFields);
