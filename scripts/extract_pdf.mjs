import fs from 'node:fs';
import path from 'node:path';

const pdfPath = 'C:\\Users\\fkxw2\\Downloads\\只有活着，才有看到太阳的那天(1).pdf';
if (fs.existsSync(pdfPath)) {
  const buf = fs.readFileSync(pdfPath);
  console.log('PDF file size:', buf.length);
  // Simple extraction of printable text sequences in PDF streams
  const str = buf.toString('latin1');
  const texts = [];
  const re = /\(([^)]+)\)\s*Tj/g;
  let match;
  while ((match = re.exec(str)) !== null) {
    texts.push(match[1]);
  }
  console.log('Found Tj count:', texts.length);
  fs.writeFileSync('extracted_pdf_raw.txt', buf.toString('utf-8'));
} else {
  console.log('PDF not found at:', pdfPath);
}
