function auditiaCleanForWord(html) {
  return String(html || '')
    .replace(/<button[\s\S]*?<\/button>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '');
}

window.exportDoc = function exportDoc(id, name) {
  const source = document.getElementById(id);
  const html = auditiaCleanForWord(source ? source.innerHTML : '');
  if (!html.trim()) {
    alert('Gera primeiro o conteúdo antes de exportar para Word.');
    return;
  }

  const title = name && name.includes('relatorio') ? 'Relatório de Auditoria' : 'Documento de Auditoria';
  const documentHtml = `
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  @page { margin: 2.2cm 2cm 2cm 2cm; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #111; line-height: 1.45; }
  .cabecalho { border-bottom: 2px solid #1f4e2a; padding-bottom: 10px; margin-bottom: 22px; }
  .cabecalho h1 { font-size: 16pt; color: #1f4e2a; margin: 0; }
  .cabecalho p { margin: 4px 0 0 0; color: #555; font-size: 9pt; }
  h2 { color: #1f4e2a; font-size: 15pt; margin-top: 18px; }
  h3 { color: #1f4e2a; font-size: 13pt; margin-top: 16px; }
  h4 { color: #333; font-size: 11.5pt; margin-top: 14px; }
  p { margin: 7px 0; }
  ul { margin-top: 6px; }
  li { margin-bottom: 4px; }
  .rodape { border-top: 1px solid #aaa; margin-top: 30px; padding-top: 8px; font-size: 9pt; color: #555; }
</style>
</head>
<body>
  <div class="cabecalho">
    <h1>Câmara Municipal — Documento de apoio à auditoria</h1>
    <p>Gerado pela aplicação AuditIA Municipal Ultra em ${new Date().toLocaleString('pt-PT')}</p>
  </div>
  <h2>${title}</h2>
  ${html}
  <div class="rodape">
    <p>Documento editável em Word. Rever, validar e adaptar à minuta/modelo institucional da CMM antes de assinatura ou circulação.</p>
  </div>
</body>
</html>`;

  const blob = new Blob(['\ufeff', documentHtml], { type: 'application/msword;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = (name || 'documento-auditoria') + '.doc';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
};
