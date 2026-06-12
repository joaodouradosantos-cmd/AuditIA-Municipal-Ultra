async function auditiaFileToBase64(file) {
  const buffer = await file.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

window.lerFicheiroLocal = async function lerFicheiroLocal() {
  const input = document.getElementById('lpFile');
  const out = document.getElementById('lpOut');
  const textarea = document.getElementById('lpTexto');
  const file = input && input.files ? input.files[0] : null;

  if (!file) {
    alert('Escolhe um ficheiro TXT, PDF ou DOCX.');
    return;
  }

  const lower = file.name.toLowerCase();
  if (!lower.endsWith('.txt') && !lower.endsWith('.pdf') && !lower.endsWith('.docx')) {
    alert('Formato suportado: TXT, PDF ou DOCX.');
    return;
  }

  try {
    if (out) out.innerHTML = 'A extrair texto do ficheiro...';
    const access = (document.getElementById('accessCode')?.value || localStorage.getItem('auditia_access_code') || 'auditia2026').trim();
    const response = await fetch('/api/extractDocument', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-AuditIA-Code': access },
      body: JSON.stringify({ fileName: file.name, mimeType: file.type, base64: await auditiaFileToBase64(file) })
    });

    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    textarea.value = data.text || '';

    if (out) {
      out.innerHTML = textarea.value
        ? '<span class="ok">Texto extraído: ' + file.name + '</span>'
        : '<span class="warn">Ficheiro lido, mas sem texto extraível.</span>';
    }
  } catch (error) {
    console.error(error);
    if (out) out.innerHTML = '<span class="bad">Erro ao ler ficheiro</span><p>' + String(error.message || error) + '</p>';
  }
};
