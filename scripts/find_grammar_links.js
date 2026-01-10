
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/PROJECT/hanachan_v2_final/data_v6/ku/grammar_v6.json', 'utf8'));

const slugs = new Set(data.map(i => i.slug));
console.log(`Total grammar slugs: ${slugs.size}`);

data.forEach(item => {
    const str = JSON.stringify(item);
    for (const slug of slugs) {
        if (slug !== item.slug && str.includes(`"${slug}"`)) {
            console.log(`Link: ${item.slug} contains reference to ${slug}`);
        }
    }
});
