import fs from 'node:fs';

const ttfBuf = fs.readFileSync('stream_4.txt');
console.log('TTF size:', ttfBuf.length);

const numTables = ttfBuf.readUInt16BE(4);
console.log('numTables:', numTables);
for (let i = 0; i < numTables; i++) {
  const tag = ttfBuf.toString('ascii', 12 + i * 16, 12 + i * 16 + 4);
  const offset = ttfBuf.readUInt32BE(12 + i * 16 + 8);
  const length = ttfBuf.readUInt32BE(12 + i * 16 + 12);
  console.log(`Table ${i}: tag="${tag}", offset=${offset}, length=${length}`);
}
