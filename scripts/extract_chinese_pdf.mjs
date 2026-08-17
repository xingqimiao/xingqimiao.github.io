import fs from 'node:fs';
import zlib from 'node:zlib';

const pdfPath = 'C:\\Users\\fkxw2\\Downloads\\只有活着，才有看到太阳的那天(1).pdf';
const buf = fs.readFileSync(pdfPath);

let pos = 0;
const streams = [];
while (pos < buf.length) {
  const streamStart = buf.indexOf('stream', pos);
  if (streamStart === -1) break;
  
  let dataStart = streamStart + 6;
  if (buf[dataStart] === 0x0d && buf[dataStart+1] === 0x0a) {
    dataStart += 2;
  } else if (buf[dataStart] === 0x0a || buf[dataStart] === 0x0d) {
    dataStart += 1;
  }
  
  const endStream = buf.indexOf('endstream', dataStart);
  if (endStream === -1) break;
  
  const rawData = buf.subarray(dataStart, endStream);
  try {
    const decompressed = zlib.inflateSync(rawData);
    streams.push(decompressed);
  } catch (e) {
    streams.push(rawData);
  }
  pos = endStream + 9;
}

const cmaps = {};
for (const s of streams) {
  const str = s.toString('latin1');
  if (str.includes('beginbfchar') || str.includes('beginbfrange')) {
    const charMatches = str.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g);
    for (const m of charMatches) {
      const srcCode = parseInt(m[1], 16);
      const unicodeHex = m[2];
      const charStr = String.fromCodePoint(parseInt(unicodeHex, 16));
      cmaps[srcCode] = charStr;
    }
    const rangeMatches = str.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g);
    for (const m of rangeMatches) {
      const start = parseInt(m[1], 16);
      const end = parseInt(m[2], 16);
      let target = parseInt(m[3], 16);
      for (let c = start; c <= end; c++) {
        cmaps[c] = String.fromCodePoint(target);
        target++;
      }
    }
  }
}

let extractedFullText = '';
for (const s of streams) {
  const str = s.toString('latin1');
  if (str.includes('BT')) {
    // Check all hex string literals <....>
    const hexTokens = str.matchAll(/<([0-9a-fA-F]+)>\s*(Tj|'|")/g);
    for (const ht of hexTokens) {
      const hex = ht[1];
      for (let i = 0; i < hex.length; i += 4) {
        const code = parseInt(hex.substring(i, i + 4), 16);
        if (cmaps[code]) {
          extractedFullText += cmaps[code];
        }
      }
      extractedFullText += '\n';
    }
    
    // Also check standard Tj / TJ
    const allHex = str.matchAll(/<([0-9a-fA-F]{4,})>/g);
    for (const ah of allHex) {
      const hex = ah[1];
      let line = '';
      for (let i = 0; i < hex.length; i += 4) {
        const code = parseInt(hex.substring(i, i + 4), 16);
        if (cmaps[code]) {
          line += cmaps[code];
        }
      }
      if (line.length > 0) {
        extractedFullText += line + '\n';
      }
    }
  }
}

fs.writeFileSync('extracted_pdf_chinese.txt', extractedFullText, 'utf-8');
console.log('Extracted length:', extractedFullText.length);
console.log('First 500 chars:\n', extractedFullText.slice(0, 500));
