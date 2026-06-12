const APP_CONFIG = {
  apiBaseUrl: ""
};

async function auditiaBase64(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 32768) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768));
  }
  return btoa(binary);
}

window.addEventListener('load', () => {
  window.lerFicheiroLocal = async function() {
    const file = document.getElementById('lpFile')?.files?.[0];
    const out = document.getElementById('lpOut');
    const textarea = document.getElementById('lpTexto');
    if (!file) { alert('Escolhe um ficheiro TXT, PDF ou DOCX.'); return; }
    const name = file.name.toLowerCase();
    if (!name.endsWith('.txt') && !name.endsWith('.pdf') && !name.endsWith('.docx')) {
      alert('Formato suportado: TXT, PDF ou DOCX.');
      return;
    }
    try {
      if (out) out.innerHTML = 'A extrair texto do ficheiro...';
      const access = (document.getElementById('accessCode')?.value || localStorage.getItem('auditia_access_code') || 'auditia2026').trim();
      const response = await fetch('/api/extractDocument', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-AuditIA-Code': access },
        body: JSON.stringify({ fileName: file.name, mimeType: file.type, base64: await auditiaBase64(file) })
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      textarea.value = data.text || '';
      if (out) out.innerHTML = textarea.value ? '<span class="ok">Texto extraído: ' + file.name + '</span>' : '<span class="warn">Ficheiro lido, mas sem texto extraível.</span>';
    } catch (error) {
      if (out) out.innerHTML = '<span class="bad">Erro ao ler ficheiro</span><p>' + String(error.message || error) + '</p>';
    }
  };
});
