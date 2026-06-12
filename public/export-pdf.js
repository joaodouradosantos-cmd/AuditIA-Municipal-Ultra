// Export Relatorio to PDF using jsPDF loaded via CDN
window.exportRelatorioPDF = async function() {
  // Load jsPDF library if not already loaded
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
  const doc = new jsPDF();
  // Get the text from the relatorio output div (rOut)
  const el = document.getElementById('rOut');
  const text = el ? el.innerText : '';
  const lines = doc.splitTextToSize(text, 180);
  doc.text(lines, 10, 10);
  doc.save('relatorio.pdf');
};
