import fs from 'fs';

const src = 'E:/dev-kiraequalcom/docs/kiraequal_book_logo_native_exact.svg';
const target = 'E:/dev-kiraequalcom/equal-next/public/pic/logo/bimi-logo.svg';

const data = fs.readFileSync(src, 'utf8');

// Replace header
const newHeader = `<svg xmlns="http://www.w3.org/2000/svg" version="1.2" baseProfile="tiny-ps" viewBox="0 0 1254 1254" width="100%" height="100%">
  <title>KiraEqual Brand Logo</title>
  <rect width="1254" height="1254" fill="#FFFFFF"/>`;

let output = data.replace(/<\?xml[^>]*\?>\s*/i, '');
output = output.replace(/<svg[^>]*>/i, newHeader);

fs.writeFileSync(target, output, 'utf8');
const stats = fs.statSync(target);
console.log(`Synchronously written! Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
