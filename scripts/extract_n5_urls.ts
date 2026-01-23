
import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(process.cwd(), 'data/grammar.json');
const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const grammarPoints = content.data;

const n5Data = grammarPoints.filter((g: any) => g.level >= 1 && g.level <= 12);
const n5Urls = n5Data.map((g: any) => ({ slug: g.slug, url: g.url, level: g.level, title: g.title }));

// Remove duplicates by slug
const uniqueN5 = Array.from(new Map(n5Urls.map(item => [item.slug, item])).values());

fs.writeFileSync('n5_urls.json', JSON.stringify(uniqueN5, null, 2));
console.log(`N5: ${uniqueN5.length} unique points`);
