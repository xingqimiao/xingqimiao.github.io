import fs from 'node:fs';
import zlib from 'node:zlib';

const pdfPath = 'C:\\Users\\fkxw2\\Downloads\\只有活着，才有看到太阳的那天(1).pdf';
const buf = fs.readFileSync(pdfPath);
const str = buf.toString('binary');

// Find all streams and decompress flate streams
const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
let match;
let fullText = '';
let streamIndex = 0;

while ((match = streamRegex.exec(str)) !== null) {
  streamIndex++;
  const rawStream = Buffer.from(match[1], 'binary');
  try {
    const decompressed = zlib.inflateSync(rawStream);
    const decStr = decompressed.toString('utf-8');
    fullText += `\n--- STREAM ${streamIndex} ---\n` + decStr;
  } catch (e) {
    // Not zlib compressed or raw
    fullText += `\n--- RAW STREAM ${streamIndex} ---\n` + rawStream.toString('utf-8');
  }
}

fs.writeFileSync('extracted_pdf_decompressed.txt', fullText, 'utf-8');
console.log('Saved decompressed streams. Length:', fullText.length);
