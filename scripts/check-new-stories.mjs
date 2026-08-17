import fs from 'fs';

const data = JSON.parse(fs.readFileSync('src/data/compiled_articles.json', 'utf8'));
const s1 = data.find(a => a.slug === '83512915');
const s2 = data.find(a => a.slug === '83512916');

console.log('Story 83512915:', s1 ? { title: s1.title, date: s1.date, author: s1.author } : 'NOT FOUND');
console.log('Story 83512916:', s2 ? { title: s2.title, date: s2.date, author: s2.author } : 'NOT FOUND');
