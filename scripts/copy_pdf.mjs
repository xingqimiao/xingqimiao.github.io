import fs from 'node:fs';
import path from 'node:path';

const src = 'C:\\Users\\fkxw2\\Downloads\\只有活着，才有看到太阳的那天(1).pdf';
const dest = 'public/temp_view.pdf';
if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log('Copied to', dest);
} else {
  console.log('Source not found');
}
