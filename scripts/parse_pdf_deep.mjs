import fs from 'node:fs';
import zlib from 'node:zlib';

const pdfPath = 'C:\\Users\\fkxw2\\Downloads\\只有活着，才有看到太阳的那天(1).pdf';
const buf = fs.readFileSync(pdfPath);

// Find all streams
const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
let match;
let allText = [];

while ((match = streamRegex.exec(buf.toString('binary'))) !== null) {
  const streamData = Buffer.from(match[1], 'binary');
  try {
    const decompressed = zlib.inflateSync(streamData);
    const textStr = decompressed.toString('utf-8');
    // Also look for hex-encoded UTF-16BE / CID text: e.g. <00410042> Tj or [ <0041> ... ] TJ
    allText.push(textStr);
    
    // Check for hex strings <....>
    const hexMatches = textStr.match(/<([0-9A-Fa-f]+)>\s*Tj/g);
    if (hexMatches) {
      for (const hm of hexMatches) {
        const hex = hm.match(/<([0-9A-Fa-f]+)>/)[1];
        const textBuf = Buffer.from(hex, 'hex');
        allText.push('HEX_UTF16: ' + textBuf.toString('utf16be'));
      }
    }
  } catch (e) {
    // not flate or raw
  }
}

fs.writeFileSync('decompressed_pdf.txt', allText.join('\n---\n'));
console.log('Saved decompressed streams to decompressed_pdf.txt');
