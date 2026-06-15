window.exportRelatorioPDF = async function() {
  if (!window.jspdf) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const usableWidth = pageWidth - margin * 2;
  const output = document.getElementById('rOut');
  const text = output ? output.innerText.trim() : '';

  if (!text) {
    alert('Gera primeiro o relatório antes de exportar para PDF.');
    return;
  }

  function header(page) {
    doc.setFillColor(35, 75, 43);
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('AuditIA Municipal Ultra', margin, 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Relatório de Auditoria Municipal', pageWidth - margin, 12, { align: 'right' });
    doc.setTextColor(90, 90, 90);
    doc.setFontSize(8);
    doc.text('Página ' + page, pageWidth - margin, pageHeight - 10, { align: 'right' });
    doc.text('Documento gerado em ' + new Date().toLocaleString('pt-PT'), margin, pageHeight - 10);
  }

  let page = 1;
  header(page);
  let y = 32;

  doc.setTextColor(20, 30, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Relatório de Auditoria', margin, y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(text, usableWidth);

  lines.forEach(line => {
    if (y > pageHeight - 22) {
      doc.addPage();
      page += 1;
      header(page);
      y = 30;
      doc.setTextColor(20, 30, 20);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
    }
    doc.text(line, margin, y);
    y += 5.5;
  });

  doc.save('relatorio-auditoria-municipal.pdf');
};
