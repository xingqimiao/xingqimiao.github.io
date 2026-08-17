import fs from 'node:fs';
import zlib from 'node:zlib';

const pdfPath = 'C:\\Users\\fkxw2\\Downloads\\只有活着，才有看到太阳的那天(1).pdf';
const buf = fs.readFileSync(pdfPath);

let pos = 0;
let streamIndex = 0;
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
    fs.writeFileSync(`stream_${streamIndex}.txt`, decompressed);
    console.log(`Stream ${streamIndex} length:`, decompressed.length);
  } catch (e) {
    fs.writeFileSync(`stream_${streamIndex}.raw`, rawData);
    console.log(`Stream ${streamIndex} raw length:`, rawData.length);
  }
  streamIndex++;
  pos = endStream + 9;
}
