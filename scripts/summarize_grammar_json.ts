
import * as fs from 'fs';

const data = JSON.parse(fs.readFileSync('./data/grammar.json', 'utf8'));
const stats: Record<number, number> = {};
data.data.forEach((item: any) => {
    stats[item.level] = (stats[item.level] || 0) + 1;
});

console.log('Grammar points by level in grammar.json:');
console.log(stats);

// Sample slugs for each level
const samples: Record<number, string[]> = {};
data.data.forEach((item: any) => {
    if (!samples[item.level]) samples[item.level] = [];
    if (samples[item.level].length < 10) samples[item.level].push(item.slug);
});

console.log('\nSample slugs by level:');
console.log(samples);
