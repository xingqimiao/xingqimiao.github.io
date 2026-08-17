import fs from 'fs';
import path from 'path';

// Let's inspect raw bytes or try pdfjs if available
const pdfPath = 'C:\\Users\\fkxw2\\Downloads\\只有活着，才有看到太阳的那天(1).pdf';
const buffer = fs.readFileSync(pdfPath);
console.log('PDF file size:', buffer.length, 'bytes');

// Check text streams in PDF
const text = buffer.toString('latin1');
const streamMatches = text.match(/\/Length\s+(\d+)/g);
console.log('Stream count:', streamMatches?.length);
