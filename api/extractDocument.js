import { checkMethod, requireAccess } from './_common.js';
import mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

export default async function handler(req, res) {
  if (!checkMethod(req, res, ['POST'])) return;
  if (!requireAccess(req, res)) return;

  try {
    const { fileName, mimeType, base64 } = req.body || {};
    if (!fileName || !base64) return res.status(400).send('Falta o ficheiro.');

    const buffer = Buffer.from(base64, 'base64');
    const lower = String(fileName).toLowerCase();
    let text = '';

    if (lower.endsWith('.txt') || String(mimeType || '').startsWith('text/')) {
      text = buffer.toString('utf8');
    } else if (lower.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value || '';
    } else if (lower.endsWith('.pdf')) {
      const data = new Uint8Array(buffer);
      const doc = await pdfjs.getDocument({ data, useWorkerFetch: false, isEvalSupported: false, disableFontFace: true }).promise;
      const pages = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        pages.push('--- Página ' + i + ' ---\n' + content.items.map(item => item.str || '').join(' '));
      }
      text = pages.join('\n\n');
    } else {
      return res.status(400).send('Formato suportado: TXT, PDF ou DOCX.');
    }

    res.status(200).json({ text: text.trim(), fileName });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message || 'Erro ao extrair texto do documento.');
  }
}
